import client from '@/lib/db/client';
import { applyMembershipFromEvents } from '@/lib/db/bmcEvents';
import { deleteUserEmailConfirmations } from '@/lib/db/emailConfirmations';
import { deleteUserPasswordResets } from '@/lib/db/passwordResets';

// A Google sign-in that meets an account with the same email
// (docs/SECURITY.md #8 step 3). Auth.js used to refuse it
// (OAuthAccountNotLinked), so a password account on someone's Gmail, made by
// them long ago or by anyone who typed the address first, blocked their Google
// button for good. auth.config.js now lets Auth.js link the two, and this
// decides first, from auth.js's `signIn` callback, which Auth.js runs before
// it links. → true to go ahead, false to refuse (AccessDenied).
//
// Google has proven the person owns the inbox, so they get the account, tips
// and history included. A password set without the email ever being
// confirmed could be anyone's: it's removed, and the sessions it opened end
// (`sessionVersion`, auth.js); this sign-in carries the new version, so it
// stays. A confirmed account keeps its password.
export async function prepareGoogleSignIn({ providerAccountId, email, emailVerified }) {
  const db = client.db();

  // Already linked: an ordinary Google sign-in.
  const linked = await db
    .collection('accounts')
    .findOne({ provider: 'google', providerAccountId }, { projection: { _id: 1 } });
  if (linked || !email) return true;

  // The same lookup as Auth.js's adapter (getUserByEmail), which links next.
  // No account: Auth.js makes a new one.
  const user = await db.collection('users').findOne(
    { email },
    {
      projection: {
        emailVerified: 1,
        hasPassword: { $eq: [{ $type: '$password' }, 'string'] },
      },
    },
  );
  if (!user) return true;

  // Only an address Google itself checked may claim an existing account.
  if (!emailVerified) {
    console.warn(`Google sign-in refused: Google hasn't verified the email account ${user._id} has.`);
    return false;
  }

  const now = new Date();
  const dropPassword = user.hasPassword === true && !user.emailVerified;
  if (dropPassword) {
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        // A Date, as Auth.js's adapter writes it.
        $set: { emailVerified: now, passwordRemovedAt: now.toISOString() },
        $unset: { password: '' },
        $inc: { sessionVersion: 1 },
      },
    );
    // A reset link made before (an admin's could have gone to whoever set the
    // password) would put one back.
    await deleteUserPasswordResets(user._id);
  } else if (!user.emailVerified) {
    await db.collection('users').updateOne({ _id: user._id }, { $set: { emailVerified: now } });
  }
  await deleteUserEmailConfirmations(user._id);
  // A Buy Me a Coffee membership that waited for a confirmed email
  // (lib/db/bmcEvents.js). Never throws, so it can't stop the sign-in.
  if (!user.emailVerified) await applyMembershipFromEvents(user._id, email);

  console.log(
    `Google sign-in linked to account ${user._id}${dropPassword ? '; its unconfirmed password was removed' : ''}.`,
  );
  return true;
}
