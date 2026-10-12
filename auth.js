// auth.js (This is your main Auth.js entry point, usually at src/app/api/auth/[...nextauth]/route.js or directly at auth.js in root)
import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import client from './lib/db/client'; // Your MongoDB connection client
import { ObjectId } from 'mongodb'; // Assuming you use ObjectId
import { authConfig } from './auth.config'; // Import the base config for providers/callbacks
import bcrypt from 'bcryptjs';
import { after } from 'next/server';
import { checkRateLimit, getClientIp } from './lib/rateLimit';
import { notifySignUp } from './lib/pushEvents';
import { FEATURE_DEFAULTS, getSessionFeatures } from './lib/db/appSettings';

// Password sign-in limits (docs/SECURITY.md #9). Per email, so guessing one
// account's password stalls; per IP with more room, because a building of
// drivers shares one address.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LIMIT_PER_EMAIL = 10;
const LOGIN_LIMIT_PER_IP = 50;

// Compared against when the email has no password account, so an unknown
// email takes as long as a wrong password and the timing doesn't say which
// emails have accounts. The hash of a random string nobody knows (cost 12,
// like registration).
const DUMMY_HASH = '$2b$12$umXnI8FsMPaDlEGzBSSlg.f0LVlEgbG1edSyfaXQ7eeuqP34yNOqe';

// signIn('credentials') resolves with `code: 'rate_limited'`, so the form
// can say so instead of "Invalid email or password".
class RateLimited extends CredentialsSignin {
  code = 'rate_limited';
}

// Extend the authConfig with the adapter and any server-only logic
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig, // Inherit providers, session strategy, pages, secret, etc.
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toString().trim().toLowerCase();

        // Both limits count every attempt, and fail open (lib/rateLimit.js).
        const [byEmail, byIp] = await Promise.all([
          checkRateLimit({
            key: `login:${email}`,
            limit: LOGIN_LIMIT_PER_EMAIL,
            windowMs: LOGIN_WINDOW_MS,
          }),
          checkRateLimit({
            key: `login-ip:${request ? getClientIp(request) : 'unknown'}`,
            limit: LOGIN_LIMIT_PER_IP,
            windowMs: LOGIN_WINDOW_MS,
          }),
        ]);
        if (!byEmail.ok || !byIp.ok) throw new RateLimited();

        const db = client.db();
        const user = await db.collection('users').findOne({ email });
        const isValid = await bcrypt.compare(
          credentials.password.toString(),
          user?.password || DUMMY_HASH
        );
        if (!user?.password || !isValid) return null;
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image || null,
          role: user.role,
          bmcMember: user.bmcMember,
          superAdmin: user.superAdmin === true,
          driverVerified: Boolean(user.driver?.verifiedAt),
          sessionVersion: user.sessionVersion ?? 0,
          comments: user.comments,
          created_at: user.created_at,
        };
      },
    }),
  ],
  adapter: MongoDBAdapter(client), // Add the database adapter here
  events: {
    async createUser(message) {
      // console.log('Event: createUser', message.user);
      const db = client.db();
      const userId = new ObjectId(message.user.id);
      await db.collection('users').updateOne(
        { _id: userId },
        {
          $set: {
            role: 'user',
            comments: [],
            bmcMember: false,
            created_at: new Date(),
          },
        },
        { upsert: true }
      );
      // A push to the admins who chose sign-ups (lib/pushEvents.js), after the
      // response. It never throws; the try only guards against `after` being
      // called outside a request, so a sign-up can't fail over a notification.
      try {
        after(() => notifySignUp());
      } catch (error) {
        console.error('Could not schedule the sign-up notification:', error);
      }
    },
  },
  callbacks: {
    // IMPORTANT: Override the jwt callback from auth.config.js
    // to include the database lookup for fresh user data.
    // This JWT callback will ONLY run in a Node.js environment (e.g., API routes, getServerSideProps).
    // The middleware will rely on the token already having this info.
    async jwt({ token, user, account, profile }) {
      // console.log('Main Auth.js JWT Callback - Initial:', {
      //   token,
      //   user,
      //   account,
      //   profile,
      // });

      // If it's the initial sign-in, the 'user' object will be available
      if (user) {
        token.id = user.id;
        token.role = user.role || 'user';
        token.comments = user.comments || [];
        token.bmcMember = user.bmcMember ?? false;
        token.superAdmin = user.superAdmin === true;
        // Credentials sign-in passes the flag from authorize(); Google's
        // adapter user is the row itself.
        token.driverVerified =
          user.driverVerified === true || Boolean(user.driver?.verifiedAt);
        // Google's adapter user is the row itself; credentials pass it from
        // authorize(). A missing version is 0.
        token.sessionVersion = user.sessionVersion ?? 0;
        token.created_at = user.created_at || new Date();
      } else if (token.id) {
        // For subsequent requests, when 'user' is not available,
        // fetch the latest data from the database using the ID from the token.
        try {
          const db = client.db();
          const dbUser = await db
            .collection('users')
            .findOne({ _id: new ObjectId(token.id) });

          if (dbUser && (dbUser.sessionVersion ?? 0) !== (token.sessionVersion ?? 0)) {
            // The password was reset (lib/db/passwordResets.js), which bumps
            // the row's version: every session from before it ends here, the
            // same way as a deleted user (docs/PASSWORD-RESET.md).
            return null;
          } else if (dbUser) {
            token.role = dbUser.role || 'user';
            token.comments = dbUser.comments || [];
            token.bmcMember = dbUser.bmcMember ?? false;
            token.superAdmin = dbUser.superAdmin === true;
            // A verified driver (lib/db/driverClaims.js): an admin linked the
            // account to its name on the on-call sheet.
            token.driverVerified = Boolean(dbUser.driver?.verifiedAt);
            token.created_at = dbUser.created_at || new Date();
          } else {
            // The user row is gone (deleted account). Returning null makes
            // Auth.js clear the session cookie, so every device signed in as
            // this user is logged out on its next request. A lookup *failure*
            // (catch below) is deliberately not treated the same way.
            return null;
          }
        } catch (error) {
          console.error(
            'Error fetching user data in Main Auth.js JWT callback:',
            error
          );
          // Mongo unreachable: keep the existing token rather than signing
          // everyone out during an outage.
        }
      }

      // The super admin's feature switches (lib/db/appSettings.js): read on
      // every request like the role, from a shared cache, so flipping one
      // reaches every driver on their next request. Never throws; a failed
      // read means the constants.js defaults.
      token.features = await getSessionFeatures();

      // console.log('Main Auth.js JWT Callback - Final Token:', token);
      return token;
    },

    // The session callback remains the same as in auth.config.js,
    // as it just exposes what's already in the token.
    async session({ session, token }) {
      // console.log('Main Auth.js Session Callback:', { session, token });
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role || 'user';
        session.user.comments = token.comments || [];
        session.user.bmcMember = token.bmcMember ?? false;
        session.user.superAdmin = token.superAdmin === true;
        session.user.driverVerified = token.driverVerified === true;
        session.user.created_at = token.created_at || new Date();
      }
      // `{ coversOpen, placesNewUntil }`: read by canUseCovers (lib/authz.js)
      // and the header menu. Never about the user, so beside it.
      session.features = token?.features ?? {
        coversOpen: FEATURE_DEFAULTS.coversOpen,
        placesNewUntil: FEATURE_DEFAULTS.placesNewUntil,
      };
      // console.log('Main Auth.js Session Callback - Final Session:', session);
      return session;
    },
  },
  // No need to redeclare 'secret' or 'pages' here as they are inherited from authConfig
});
