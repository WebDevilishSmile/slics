import { confirmUrl, createEmailConfirmation } from '@/lib/db/emailConfirmations';
import { sendEmail } from '@/lib/email';
import { confirmEmailEmail } from '@/lib/passwordResetEmails';
import { EMAIL_CONFIRM_LINK_HOURS } from '@/constants';

// Makes a link that confirms a password account's email and sends it
// (docs/SECURITY.md #8): at sign-up (app/api/auth/register) and from /profile
// (app/api/users/me/email-confirmation). Called inside `after()`, so it never
// throws, and like lib/email.js it never logs the address. → true when the
// email went out.
export async function sendEmailConfirmation({ userId, email, firstName, origin }) {
  try {
    const { token } = await createEmailConfirmation(userId, email);
    return await sendEmail({
      to: email,
      ...confirmEmailEmail({
        firstName,
        url: confirmUrl(origin, token),
        hours: EMAIL_CONFIRM_LINK_HOURS,
        origin,
      }),
    });
  } catch (error) {
    // The class and code only: a MongoDB error's message can quote the email.
    console.error('Email confirmation not sent:', error?.name, error?.code ?? '');
    return false;
  }
}
