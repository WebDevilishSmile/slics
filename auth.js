import { MongoDBAdapter } from '@auth/mongodb-adapter';
import Google from 'next-auth/providers/google';
import NextAuth from 'next-auth';
import client from './lib/db';
import { ObjectId } from 'mongodb';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(client),
  providers: [Google],
  events: {
    async createUser(message) {
      const db = client.db();
      await db
        .collection('users')
        .updateOne(
          { _id: new ObjectId(message.user.id) },
          { $set: { role: 'user' } }
        );
    },
  },
  callbacks: {
    async session({ session, user }) {
      // Add the role to the session object
      if (session.user) {
        session.user.role = user.role || 'user';
      }
      return session;
    },
  },
});
