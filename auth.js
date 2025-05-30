import { MongoDBAdapter } from '@auth/mongodb-adapter';
import Google from 'next-auth/providers/google';
import NextAuth from 'next-auth';
import client from './lib/db';
import { ObjectId } from 'mongodb';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(client),
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
  ],
  events: {
    async createUser(message) {
      const db = client.db();
      await db
        .collection('users')
        .updateOne(
          { _id: new ObjectId(message.user.id) },
          { $set: { role: 'user', comments: [] } },
          { upsert: true }
        );
    },
  },
  callbacks: {
    async session({ session, user }) {
      const db = client.db();

      // Add missing fields to session
      if (session.user) {
        session.user.role = user.role || 'user';
        session.user.comments = user.comments || [];
      }

      // Persist default role if not already set
      if (!user.role) {
        await db
          .collection('users')
          .updateOne(
            { _id: new ObjectId(user.id) },
            { $set: { role: 'user' } }
          );
      }

      return session;
    },
  },
});
