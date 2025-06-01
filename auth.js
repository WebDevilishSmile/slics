// auth.js (This is your main Auth.js entry point, usually at src/app/api/auth/[...nextauth]/route.js or directly at auth.js in root)
import NextAuth from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import client from './lib/db'; // Your MongoDB connection client
import { ObjectId } from 'mongodb'; // Assuming you use ObjectId
import { authConfig } from './auth.config'; // Import the base config for providers/callbacks

// Extend the authConfig with the adapter and any server-only logic
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig, // Inherit providers, session strategy, pages, secret, etc.
  adapter: MongoDBAdapter(client), // Add the database adapter here
  events: {
    async createUser(message) {
      // console.log('Event: createUser', message.user);
      const db = client.db();
      const userId = new ObjectId(message.user.id);
      await db
        .collection('users')
        .updateOne(
          { _id: userId },
          { $set: { role: 'user', comments: [], bmcMember: false } },
          { upsert: true }
        );
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
        token.bmcMember = user.bmcMember || false;
      } else if (token.id) {
        // For subsequent requests, when 'user' is not available,
        // fetch the latest data from the database using the ID from the token.
        try {
          const db = client.db();
          const dbUser = await db
            .collection('users')
            .findOne({ _id: new ObjectId(token.id) });

          if (dbUser) {
            token.role = dbUser.role || 'user';
            token.comments = dbUser.comments || [];
            token.bmcMember = dbUser.bmcMember || false;
          } else {
            console.warn(
              `User with ID ${token.id} not found in DB during Main Auth.js JWT callback.`
            );
          }
        } catch (error) {
          console.error(
            'Error fetching user data in Main Auth.js JWT callback:',
            error
          );
          // Depending on your error handling, you might want to log this and proceed,
          // or throw an error to prevent token creation with stale data.
        }
      }

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
        session.user.bmcMember = token.bmcMember || false;
      }
      // console.log('Main Auth.js Session Callback - Final Session:', session);
      return session;
    },
  },
  // No need to redeclare 'secret' or 'pages' here as they are inherited from authConfig
});
