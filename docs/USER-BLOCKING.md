# Blocking (suspending) an account

The super admin can suspend an account: the person is signed out everywhere and can't
sign back in, their posts are hidden, and the account stays, so it can be restored.
Stage 2 makes the same email and Google account unable to sign up again.

## Status

- **Planned 2026-11-15.** Nothing built. Answer the open questions at the bottom first;
  the plan takes the recommended answer for each.

## Why

Tiago, 2026-11-15:

> Draw up another plan to block a user. They could easily use another email address
> though…

Deleting (`ADMIN-USER-DELETION.md`) removes an account, but sign-up is open (README,
2026-10-28), so the same person can be back in a minute, and deleting also frees their
name on the on-call sheet for a new account to claim.

## The honest limit: what no block can do

**Anyone can make a new email in a minute, and nothing in this plan stops that.** The
usual ways to try (blocking an IP address, fingerprinting the device) don't fit SLICs:

- **IP blocks would hit the wrong people.** Drivers share the building's wifi, which is
  why sign-up and sign-in limits are generous and per-email (`app/api/auth/register`,
  `auth.js`). Blocking one driver's IP blocks the whole shift.
- **Device fingerprinting is tracking.** The privacy page promises no third-party
  tracking, and a fingerprint is exactly that. Not doing it.
- **Requiring approval for every sign-up** would stop it, but undo the open sign-up
  decided on 2026-10-28 for a problem that hasn't happened yet.

So the plan is three layers, from strongest to weakest:

1. **What a new account can't get: Covers and Jobs.** These are the only features tied
   to who someone really is. `users.driver.key` is unique (`driverNameKey`, one account
   per name on the sheet), and a suspended account **keeps its sheet name**, so a new
   account can't be verified as the same driver. That's why suspending beats deleting
   for someone you want out.
2. **What a new account can't reuse: the same email or Google account** (stage 2). Stops
   the lazy comeback, not a determined one.
3. **What a new account can do: post tips and places, like anyone.** If a throwaway
   account starts posting abuse, you suspend it in two taps, and its posts disappear
   with it. Stage 3 (only if it actually happens) holds a brand-new account's first
   posts for review.

In a building of about 270 drivers who know each other, layer 3 plus a word in the yard
is realistically the backstop. The plan doesn't pretend otherwise.

## Ground rules

- **Super admin only,** like deleting: `requireSuperAdmin()` on the routes, the buttons
  drawn only for the super admin. Never yourself, never a super admin, and drivers only
  (staff are changed to Driver first), the same rules as `admin-delete`.
- **One enforcement point: the session.** `auth.js`'s `jwt` callback already re-reads the
  user row on every request; it returns `null` for a suspended account, exactly as it does
  for a deleted one. No session means none of the 76 write routes need a change: a
  suspended person can't reach them.
- **Sign-in says why.** Password sign-in refuses with its own `CredentialsSignin` code
  (like `RateLimited`), Google sign-in returns the sign-in page with
  `?error=Suspended`, and both show: "This account is suspended. If you think this is a
  mistake, email tiago@slics.app." Not a generic "wrong password".
- **Everything is reversible until deleted.** Suspending keeps every row; unsuspending
  puts it all back. Deleting a suspended account is still possible, but the dialog warns
  that it frees their sheet name and (until stage 2) lets the email sign up again.
- **Audit first,** like every admin action: `user.suspended` / `user.unsuspended`
  (reason, never the email) and, in stage 2, `block.added` / `block.removed`.
- **The block list stores no email.** A SHA-256 hash of the normalized address, like the
  reset and confirmation tokens, so the list can answer "is this blocked?" but can't be
  read back as a list of addresses.

## Stage 1: Suspend and unsuspend

### Data

`users.suspended`: `{ at, by: { id, name }, reason }` while suspended, `$unset` when
lifted. Index: none needed (read by `_id`; the user list filters in memory today).

On suspend, in this order (`suspendUser(id, actor, reason)`, `lib/db/users.js`):

1. `recordAdminAction` `user.suspended` (from the role and sheet name, to the reason).
2. `$set: { suspended }` and `$inc: { sessionVersion: 1 }` on the user row, so every
   session ends on its next request even before the jwt check below.
3. Delete their push subscriptions (`deleteUserPushSubscriptions`), so no notification
   reaches a phone that's signed out.
4. Hide their posts: `$set: { hiddenBySuspension: true }` on their `comments` and
   `placeComments` (open question 1). Their places stay (others rely on them), shown
   without a name, as after deletion.

Unsuspend (`unsuspendUser`) reverses 2 and 4 (`$unset` both) with `user.unsuspended`
first. Push devices aren't restored; they turn notifications on again.

### Enforcement (`auth.js`)

- `jwt` callback: `else if (dbUser?.suspended) return null;` next to the
  `sessionVersion` check.
- `authorize()`: after the password check passes, `if (user.suspended) throw new
  Suspended();` (`class Suspended extends CredentialsSignin { code = 'suspended' }`).
  Only after the password is right, so the message doesn't tell a stranger the account
  exists.
- `signIn` callback (Google): look up the account the Google sign-in would land on
  (`accounts` by `providerAccountId`, else `users` by email, the lookups
  `prepareGoogleSignIn` already does) and return `'/sign-in?error=Suspended'` if it's
  suspended.
- `components/signIn/SignInPanel.jsx`: show the suspended message for `code=suspended`
  and `?error=Suspended`, then drop it from the address like the Google error.

### Hiding posts

- `lib/db/comments.js`: `LIVE` becomes `{ deleted: { $ne: true }, hiddenBySuspension:
  { $ne: true } }`, and `getSlicThread` (the one read that keeps deleted placeholders)
  turns a hidden top-level tip with replies into the same "Comment deleted"
  placeholder, so other drivers' replies keep their thread.
- `lib/db/places.js`: the same for `placeComments`.
- Tip counts (`lib/tipsStore.js` reads) follow from the same filter.
- Admin pages still show them, labeled "Hidden: account suspended", so you can see what
  they posted.

### Admin UI

- `/admin/users/[id]`, the Danger zone: "Suspend account…" above "Delete account…",
  with a dialog like the delete one (what happens, an optional reason, no email to type:
  it's undoable). A suspended account shows a red "Suspended since {date}" line with the
  reason, and "Unsuspend" in place of "Suspend".
- `/admin/users` (`UserList.jsx`): a "Suspended" chip on the card, and a filter.
- Routes: `POST /api/users/[id]/suspend` and `DELETE /api/users/[id]/suspend`
  (`requireSuperAdmin()`), the same checks as `admin-delete`.
- `driver-claims`: a claim for a sheet name held by a suspended account says so on
  `/admin/driver-claims` ("This driver's account is suspended"), so a comeback account
  can't be verified by accident.

## Stage 2: Block the same email and Google account

A `blocked-identities` collection: `{ kind: 'email' | 'google', hash, userId, at, by:
{ id, name }, reason }`, `hash` unique.

- **Written** when an account is suspended ("Also block their email and Google account",
  a checkbox, on by default): the account's normalized email, and the `providerAccountId`
  of its Google `accounts` row if it has one. **Removed** on unsuspend.
- **Normalized** before hashing (`lib/blockedIdentities.js`, pure): lowercase and trim;
  for `gmail.com` and `googlemail.com`, drop dots and anything after `+` in the name and
  use `gmail.com`. So `j.doe+slics@gmail.com` and `jdoe@googlemail.com` are the same
  person. Other domains are only lowercased: their dots and `+` can mean different
  mailboxes.
- **Checked** in `app/api/auth/register` (before the "already has an account" check,
  same 409 shape: "This email can't be used to sign up for SLICs. Email
  tiago@slics.app if you think that's a mistake."), in `authorize()`, and in the Google
  `signIn` callback (by email and by `providerAccountId`, so a Google account with a new
  Gmail address is still caught).
- **Kept after deletion:** deleting a suspended account keeps its `blocked-identities`
  rows (`userId` set to null) unless the super admin unchecks "Keep them blocked". That
  is the one thing deletion leaves behind on purpose, and the privacy page says so.

## Stage 3 (only if a throwaway account ever posts abuse)

Hold a new account's posts for review: tips and place comments from an account younger
than 7 days, or with no confirmed email, are saved `pending: true`, shown only to their
author ("Waiting for a quick check") and to admins, and approved on `/admin/comments`.
It costs every new driver a short wait for their first tip, in a feature that already
struggles to get tips, so **don't build it until it's needed**.

## Docs and legal, in the same changes

- `DATA-MODEL.md`: `users.suspended`, `hiddenBySuspension` on `comments` and
  `placeComments`, and (stage 2) `blocked-identities`.
- `admin_audit` header comment: the new actions.
- `CLAUDE.md`, Auth: the jwt callback also ends a suspended account's sessions.
- **Terms:** already cover it ("We may suspend or delete an account that breaks these
  terms…"). No change.
- **Privacy page:** a line under how long things are kept: "If an account is suspended,
  it's kept, with its tips hidden, until it's restored or deleted. To stop it being
  used to sign up again, we keep a one-way code made from its email address (not the
  address itself), even after it's deleted."
- `ADMIN-USER-DELETION.md`: point "Is a block needed?" here.

## Verifying (dev database first)

1. Suspend a test driver signed in on a second browser: their next click signs them
   out; signing in with the password shows the suspended message; Google sign-in comes
   back to `/sign-in` with it.
2. Their tips are gone from the SLIC; one with a reply shows "Comment deleted" with the
   reply still there; `/admin/comments` shows them labeled.
3. A new account claiming their sheet name: `/admin/driver-claims` says the name's
   account is suspended.
4. Unsuspend: they sign in again and their tips are back.
5. Stage 2: signing up with the same email, its `+` or dotted Gmail form, or the same
   Google account, is refused; unsuspending lets them back.
6. A regular admin calling the routes gets 403.

## Open questions (recommended answer first)

1. **Hide their posts while suspended, or leave them?** Recommended: hide (reversible,
   placeholders keep replies). Leaving them is less code, and you can delete the bad
   ones by hand on `/admin/comments`.
2. **Who can suspend: the super admin only, or the Users area (any admin)?**
   Recommended: super admin only to start, like deleting. Easy to widen later with
   `requireArea('users')`.
3. **Tell the person?** Recommended: no automatic email. The sign-in message tells them
   and gives your address. An email (Resend, `lib/email.js`) can be a checkbox later.
4. **Build stage 2 with stage 1, or wait?** Recommended: together. It's small, and the
   checkbox makes the block a deliberate choice each time.
