import { passwordProblem } from '@/lib/password';
import { ACCOUNT_NAME_MAX_LENGTH } from '@/constants';

// What a sign-up (app/api/auth/register) has to send, checked before anything
// touches it (docs/SECURITY.md #8 step 5). Pure, so it can be tested alone.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;

const text = (value) => (typeof value === 'string' ? value.trim() : '');

// → `{ fields: { email, firstName, lastName, password } }` with the email
// lowercased and the names trimmed, or `{ error }` for a 400.
export function registrationProblem(body) {
  const email = text(body?.email).toLowerCase();
  const firstName = text(body?.firstName);
  const lastName = text(body?.lastName);
  const password = body?.password;

  if (!email || !firstName || !lastName || typeof password !== 'string' || !password) {
    return { error: 'All fields are required.' };
  }
  if (firstName.length > ACCOUNT_NAME_MAX_LENGTH || lastName.length > ACCOUNT_NAME_MAX_LENGTH) {
    return { error: `Names can be at most ${ACCOUNT_NAME_MAX_LENGTH} characters.` };
  }
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    return { error: 'Invalid email address.' };
  }
  const problem = passwordProblem(password);
  if (problem) return { error: problem };

  return { fields: { email, firstName, lastName, password } };
}
