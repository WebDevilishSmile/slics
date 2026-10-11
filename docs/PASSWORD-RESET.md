# PASSWORD-RESET.md

Plan and checklist for "Forgot password": first a reset link an admin hands a driver, then
changing a password from the profile, then a self-service reset by email. Built in stages;
check items off as they ship.

**How to use this:** stages go in order, and each stands alone. Run `npm run build` (in a
scratch copy, never while `next dev` runs) before shipping any item. The app is used daily
in production.

## Status (2026-10-11)

**Planned, not started.** Stage 3 waits on one decision: where reset emails come from
(see "Open questions").

---

## Why

A driver who forgets their password is locked out today. There's no reset and no way to
change a password (`SECURITY.md` #9), so the only fix is the admin editing the database by
hand. The sign-in limit added on 2026-10-11 (10 tries per email per 15 minutes) makes a
forgotten password more noticeable, not less.

Who it's for, counted 2026-10-11:
- **56 of 176 accounts** sign in with an email and password. Nothing here changes for the
  other 119, which sign in with Google (Google handles their passwords).
- **None of the 56 has a verified email** (`emailVerified` is null for all of them). The
  app has never sent an email, and an address typed at sign-up may be mistyped, or may
  not belong to the person who typed it (`SECURITY.md` #8).

That last point is why stage 1 doesn't use email. An admin who knows the driver hands
them a link, which works today with no email service and no unverified addresses.

## Ground rules

- **The link holds a secret only once.** A reset token is 32 random bytes (base64url).
  The database stores only its SHA-256 hash, so a database read can't reset anyone's
  password. Logs and `admin_audit` never contain a token or a link.
- **The token rides in the URL fragment:** `/reset-password#<token>`. The browser never
  sends a fragment to the server, so the token stays out of Vercel's request logs, Vercel
  Analytics and any `Referer`. The page reads it, clears it from the address bar
  (`history.replaceState`) and POSTs it.
- **One live token per account, used once.** Making a new one deletes the old one, and a
  successful reset deletes the token. Expired tokens are deleted by a TTL index.
- **A reset signs the account out everywhere.** It bumps `users.sessionVersion`, and
  the `jwt` callback (`auth.js`) ends any session carrying an older version
  (`SECURITY.md` #27). If the password leaked, the person who had it is signed out too.
- **Nothing says whether an email has an account.** The email form (stage 3) answers the
  same thing for every address, and the reset page's errors are about the link, never
  the account.
- **Passwords:** 8 to 128 characters, the same rule as sign-up, bcrypt cost 12. (bcrypt
  only reads the first 72 bytes; the cap keeps that from surprising anyone.)
- **Only password accounts.** A Google account has no password to reset. Every entry
  point says "If you sign in with Google, use the Google button."

---

## Stage 1: a reset link from an admin

No email and no new vendor. A driver tells an admin they're locked out, and the admin
makes a link on `/admin/users` and texts it to them.

- [ ] **`lib/db/passwordResets.js`:** collection `password-resets`, rows
      `{ userId: ObjectId, tokenHash, via: 'admin' | 'email', createdAt, expiresAt: Date,
      createdBy?: { id, name } }`.
  - `createPasswordReset(userId, { via, actor })` deletes the user's other rows, inserts
    a new one and returns the raw token, which isn't stored anywhere.
  - `redeemPasswordReset(token, password)` hashes the token and finds an unexpired row.
    It sets `password`, `passwordChangedAt` and `$inc: { sessionVersion: 1 }` on the
    user, then deletes the row. It returns `{ ok }` or `{ error }`: "This link has
    expired or was already used."
  - Indexes in `scripts/createIndexes.js`: unique `tokenHash`, `userId`, and a TTL on
    `expiresAt`.
  - `deleteUserAccount` deletes the user's rows. Add the collection to `DATA-MODEL.md`.
- [ ] **`users.sessionVersion` in `auth.js`:** at sign-in, copy it into the token (a
      missing value counts as 0). On each refresh, if the row's version is newer, return
      `null`, the same path as a deleted user. Keep the rule that a *failed* lookup keeps
      the token (`CLAUDE.md` → Auth). Today nobody has the field, so nobody is signed out
      when this ships.
- [ ] **`POST /api/users/[id]/password-reset`** (admin): makes a link that lasts 24 hours
      and answers `{ url, expiresAt }`.
  - Refuses an account with no password (a Google account), and the caller's own
    account.
  - An admin can make links only for `role: 'user'` accounts. A super admin can also
    make them for admins, but never for another super admin. Otherwise one admin could
    take over another admin's account.
  - Writes `admin_audit` first (`password.resetLinkCreated`, the target, no token).
  - Rate-limited per admin.
- [ ] **`/admin/users`:** a "Reset password" action on a password account's card
      (`admin/users/UserCard.jsx`). It opens a soft dialog with the link, a Copy button
      (confirmed in place, like `home/TitleAddress.jsx`), "Text it" (`sms:` with the
      link) and when it expires. The link is shown once and never saved in the page.
- [ ] **`/reset-password`** (public: add it to `publicPaths` in `middleware.js` and to
      `PAGE_TITLES` in `header/HeaderBar.jsx`):
  - Reads the token from the fragment, then clears it.
  - Soft panel: new password and confirm, with show/hide (`softInputSx` fields, one
    contained button).
  - On success: "Password changed. Sign in with your new password," with a button to `/`.
    It doesn't sign them in, so the email sign-in form stays the only place a password
    is checked.
  - With no token or a bad one: the error, and "Ask an admin for a new link."
- [ ] **`POST /api/auth/reset-password`** `{ token, password }`, next to
      `/api/auth/register`: validates, calls `redeemPasswordReset`, and is rate-limited
      by IP (10 per 15 minutes). Answers the same error for a wrong, used or expired token.
- [ ] **"Forgot password?"** under the email sign-in form (`signIn/EmailAuth.jsx`). It
      opens a short note: "Ask an admin for a reset link. If you sign in with Google, use
      the Google button." Stage 3 replaces it with the email form.
- [ ] **For the super admin's own account:** `npm run password:reset-link -- <email>
      --dry-run` (`scripts/passwordResetLink.mjs`) prints a link for any password
      account, logged in `admin_audit` with no actor, like `scripts/setSuperAdmin.mjs`.
      It runs locally against `.env`, so only someone with the database can use it.
- [ ] **Docs:** `/help` (the sign-in guide: "Forgot your password?"), `DATA-MODEL.md`,
      `OPERATIONS.md` (the script), `SECURITY.md` #9 and #27, `CLAUDE.md` → Auth.

## Stage 2: change your password on `/profile`

For a driver who's signed in and wants a new password, or whose password leaked
somewhere else.

- [ ] **"Change password"** in `profile/EditProfileDialog.jsx`, for password accounts
      only: current password, new, confirm.
- [ ] **`POST /api/users/me/password`** `{ currentPassword, newPassword }`: checks the
      current one with bcrypt, then the same update as a reset. It's rate-limited per
      user, and a wrong current password counts toward the sign-in limit for that email
      (`login:<email>`), so this can't be used to guess passwords.
- [ ] Afterwards every device is signed out, this one included, because the session
      version changed. The dialog says so before they confirm, then sends them to `/`.
      (Keeping this device signed in would mean re-issuing its token, which isn't worth
      the code.)

## Stage 3: "Forgot password" by email

Self-service, for a driver who can't reach an admin. It waits on choosing a sender (see
"Open questions").

- [ ] **`lib/email.js`**, the only module that talks to the email provider, like
      `lib/blob.js` for Blob. It never throws to the caller and never logs an address.
      New env vars go in `.env.example` and `OPERATIONS.md`.
- [ ] **`POST /api/auth/forgot-password`** `{ email }`: always answers "If that email has
      a password account, a link is on its way," whether or not it does.
  - Rate-limited per email (3 per hour) and per IP (10 per hour).
  - For a password account: a link that lasts 30 minutes (`via: 'email'`), sent after
    the response (`after()`), so the timing doesn't reveal anything.
  - For a Google account: an email saying "You sign in with Google," with no link.
  - For no account: nothing is sent.
- [ ] **The email:** plain text plus simple HTML, from "SLICs." It says who asked (only
      "someone asked to reset your password"), the link, when it expires, and "If it
      wasn't you, ignore this." No tracking pixels or click-tracking redirects; turn them
      off in the provider, since they would rewrite the link.
- [ ] **A successful email reset sets `emailVerified`.** The link proves the driver reads
      that inbox. That's step 2 of `SECURITY.md` #8 for these accounts, and the BMC webhook
      can start requiring it (#8 step 4).
- [ ] **The form** replaces stage 1's "Forgot password?" note: an email field and Send,
      then the same message for every address. "Ask an admin" stays as the fallback line.
- [ ] **Privacy page** (`app/privacy/page.jsx`): the email provider receives a driver's
      address when they ask for a reset, and the app keeps only the token's hash for 30
      minutes.

---

## Open questions

1. **Where do reset emails come from?** (stage 3 only)
   - **A domain the app owns,** say `slics.app`, which costs about $10–15 a year, plus
     **Resend** for sending. Resend's changelog says the free tier now allows three
     verified domains. Third-party guides put it at 3,000 emails a month and 100 a day,
     far more than 56 accounts need. Resend's pricing page should confirm whether the
     free tier sends to any address once a domain is verified: one secondary source says
     it delivers only to your own address. The domain needs SPF and DKIM DNS records, and
     it could also become the app's address instead of `slics.vercel.app`.
     *Recommended.*
   - **The admin's Gmail over SMTP** (an app password and `nodemailer`). No domain is
     needed, and Gmail allows about 500 emails a day. But resets would come from a
     personal address, and that account's app password would live on Vercel.
   - **No email at all:** stop after stages 1 and 2. That's reasonable for a building
     where the admin knows everyone.
2. **How long should an admin's link last?** The plan says 24 hours, long enough to reach
   a driver mid-shift. Shorter is safer if links get forwarded.
3. **Should the reset page sign the driver in?** The plan says no (see stage 1).

## Verifying

- Stage 1: make a link for a test password account. Open it in a private window and set a
  password. Check that the old password fails, the new one works, the account's other
  sessions are signed out, and opening the link again says it's used. Check that a
  Google-only account has no "Reset password" action, that an admin can't make a link for
  another admin, and that the `admin_audit` row has no token. Load the reset page with
  the token and confirm the request log in Vercel shows `/reset-password` with no token.
- Stage 2: a wrong current password is refused and counts toward the sign-in limit, and
  a change signs out every device.
- Stage 3: a real address, an address with no account and a Google account get the same
  answer on screen. Only the password account gets a link, and it stops working after 30
  minutes.
- `npm run lint` and `npm run build`.

## Rolling back

- Stage 1 adds a collection, two fields and new routes. Reverting the commits removes the
  feature, and `sessionVersion` simply stops being checked. No data has to be undone,
  and the tokens expire on their own.
- Stage 3: unset the email env vars and the form still answers normally but sends nothing
  (`lib/email.js` fails open). Revert the commit to bring back stage 1's note.
