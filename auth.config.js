// auth.config.js
import Google from 'next-auth/providers/google';
import AzureActiveDirectory from 'next-auth/providers/azure-ad';

// This configuration is purely for the Auth.js core logic that can run on the Edge.
// NO DATABASE ADAPTER HERE.
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    }),
    AzureActiveDirectory({
      clientId: process.env.AUTH_AZURE_AD_ID,
      clientSecret: process.env.AUTH_AZURE_AD_SECRET,
      tenantId: process.env.AUTH_AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt', // Crucial for middleware to read the token
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    // These callbacks are essential for populating the token and session
    // with the custom data (role, comments, bmcMember).
    // The data for these fields is expected to be present in the initial 'token'
    // or 'user' object if the token was just issued by the main auth.js.
    // We do NOT do database lookups here to avoid Edge compatibility issues.
    async jwt({ token, user }) {
      // 'user' is only present on initial sign-in.
      // For subsequent requests, the token will already have the data
      // from the main auth.js (which fetches from DB).
      if (user) {
        token.id = user.id;
        token.role = user.role || 'user';
        token.comments = user.comments || [];
        token.bmcMember = user.bmcMember || false;
        token.created_at = user.created_at || new Date();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role || 'user';
        session.user.comments = token.comments || [];
        session.user.bmcMember = token.bmcMember || false;
        session.user.created_at = token.created_at || new Date();
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
  },
  secret: process.env.AUTH_SECRET,
};

// We don't export 'handlers', 'signIn', 'signOut' from here.
// These will come from the main 'auth.js'
