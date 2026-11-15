# Deleting an account as the super admin

A "Delete account" action on `/admin/users/[id]`, for the super admin only, that removes
another person's account the same way they could from their own profile.

## Status

- **Built 2026-11-15**, the same day as the plan, with the recommended answer to each
  open question: staff are changed to Driver first, the email confirms, no block list,
  no email to the person (questions 3 and 4 stay open). Lint passes; **not yet tried in
  a browser**: run "Verifying" on the dev database before relying on it.
- Files: `app/api/users/[id]/admin-delete/route.js`, `components/admin/users/UserDangerZone.jsx`
  and `DeleteUserDialog.jsx`, `recordAdminActionResult` in `lib/db/adminAudit.js`, and the
  Danger zone at the bottom of `app/admin/users/[id]/page.jsx`.
- The privacy and terms pages needed no change: the terms already say an account that
  breaks them may be deleted, and to email for help deleting one.

## Why

Tiago, 2026-11-15:

> I need to be able to delete a user as a superAdmin, I never put this logic in.

Today an account can only be deleted by its owner (`DELETE /api/users/[id]`, the
profile's "Delete account"), and never if it's an admin. There's no way to remove a
test account, a duplicate, a spam sign-up, or a driver who asks in the yard instead of
doing it themselves. It also answers `TODOS.md`'s "Leaving as a dispatcher".

## What already exists (and is reused as is)

- **`deleteUserAccount(userId)`** (`lib/db/users.js`) does the whole cascade, user row
  last, and returns counts: tips become "Comment deleted" placeholders where others
  replied, gym comments, votes, place data, `slicViews`, `accounts`, password resets,
  email confirmations, push subscriptions, cover lists, cover notices, driver claims and
  cover disputes are deleted; `bmc-events`, `slic-reports`, `route-suggestions` and
  `cover-reports` are kept and unlinked. **The admin path calls this same function, so
  the two paths can never drift.** Nothing in it changes.
- **The deleted person's sessions end by themselves.** `auth.js`'s `jwt` callback
  re-reads the user row on every request and returns `null` when it's gone, so they're
  signed out on their next request, on every device. Their push rows are deleted in the
  cascade, so no notification reaches them after.
- **`requireSuperAdmin()`** (`lib/authz.js`) and **`recordAdminAction()` /
  `markAdminActionFailed()`** (`lib/db/adminAudit.js`), the same pair `toggle-role` uses.
- **`DeleteAccountDialog.jsx`** (`components/profile/`) as the model for the dialog.

## Ground rules

- **Super admin only,** checked on the server with `requireSuperAdmin()`; the button is
  only drawn for a super admin, but the route is the boundary (`SECURITY.md` #7).
- **Never yourself, never a super admin.** Your own account goes through the profile
  (which already refuses admins); a super admin is changed only by
  `scripts/setSuperAdmin.mjs`, like their role.
- **Drivers only: staff are demoted first.** An admin or dispatcher is refused with "Change
  their role to Driver first." Two deliberate steps, each in `admin_audit`
  (`role.changed`, then `user.deleted`), and it means an account with admin stamps on
  SLICs and cover jobs is never deleted by one click (see "Stamps" below).
- **Re-read the target from the database,** never trust what the page sent (role,
  `superAdmin`), the same as the self-service route does.
- **Typed confirmation of the account's email,** not the word DELETE. Deleting someone
  else's account is easier to do by mistake than your own; typing their email proves
  you're on the right person. The route compares it, normalized, with the row it reads.
- **Audit first, then delete.** `user.deleted` is written to `admin_audit` before the
  cascade; if that write fails nothing is deleted. If the cascade then throws, the row is
  marked with `markAdminActionFailed` so the log doesn't claim it happened.
- **The audit row keeps no email.** `targetName` is the display name, `from` is the role
  and when they joined (and the sheet name if they were a verified driver), `to` is the
  optional reason. Not the email, phone or anything the person asked to have removed.
- **Deleting is not banning.** Sign-up is open (README, 2026-10-28), so the same person
  can make a new account the next minute. That's fine for test accounts and people who
  asked to leave; a real block is a separate feature (open question 3).

## The plan

### 1. Route: `app/api/users/[id]/admin-delete/route.js`

A new file beside `toggle-role`, so the self-service `DELETE /api/users/[id]` stays
exactly as it is. `POST` with `{ confirmEmail, reason? }`.

```js
export const runtime = 'nodejs';

export async function POST(req, { params }) {
  const { session, denied } = await requireSuperAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return json({ error: 'Invalid user id' }, 400);
  if (id === session.user.id) return json({ error: "Use your profile to delete your own account" }, 403);

  const body = await req.json().catch(() => null);
  const target = await getUserById(id);            // fresh from the database
  if (!target) return json({ error: 'User not found' }, 404);
  if (target.superAdmin === true) return json({ error: "A super admin can't be deleted here" }, 403);
  if ((target.role || 'user') !== 'user') return json({ error: 'Change their role to Driver first' }, 409);
  if (normalizeEmail(body?.confirmEmail) !== normalizeEmail(target.email))
    return json({ error: "The email doesn't match this account" }, 400);

  const auditId = await recordAdminAction({
    actor: session.user, action: 'user.deleted', targetType: 'user', targetId: id,
    targetName: displayName(target.name),
    from: { role: 'user', joined: target.created_at, driver: target.driver?.name ?? null },
    to: cleanReason(body?.reason),                 // plain text, trimmed, max ~200 chars
  });
  try {
    const result = await deleteUserAccount(id);
    await recordAdminActionResult(auditId, result); // the counts, see step 2
    return json({ success: true, result }, 200);
  } catch (error) {
    await markAdminActionFailed(auditId);
    console.error(`Admin delete of ${id} failed:`, error);
    return json({ error: 'Failed to delete account' }, 500);
  }
}
```

Use whatever email normalizer `auth.js` / `register` already use, so a Google account's
capitalized email still matches.

### 2. `lib/db/adminAudit.js`

- Add `user.deleted` to the list of actions in the header comment (`from` role, joined
  date and sheet name; `to` the reason; never the email).
- Add `recordAdminActionResult(id, result)`: `$set: { result }` on the row, the counts
  `deleteUserAccount` returns (tips, views, cover lists...). Numbers only, so "what did
  that delete remove?" has an answer.

### 3. The dialog: `components/admin/users/DeleteUserDialog.jsx`

Modeled on `DeleteAccountDialog.jsx`, with:

- Title "Delete {name}'s account?"
- What goes, with the numbers the page already loaded: "{n} tips (placeholders stay where
  others replied), {n} lookups in their history, their cover lists, devices with
  notifications on." And what stays: "Buy Me a Coffee support, SLIC reports and route
  suggestions stay, with their name removed."
- "This can't be undone. They can sign up again with the same email."
- Optional "Reason (only admins see it)" field.
- "Type their email to confirm" field; the button stays disabled until it matches
  (case-insensitive). The server checks it again.
- On success: close, `router.replace('/admin/users')`, and a snackbar "Account deleted".
  `router.refresh()` so the list doesn't show the stale row.

### 4. The page: `app/admin/users/[id]/page.jsx`

A "Danger zone" `Paper` at the bottom, rendered only when `isSuperAdmin(session)`:

- Target is a driver → the "Delete account…" button opening the dialog, given
  `userId`, `name`, `email`, `commentCount` (`userComments.length`) and `viewCount`
  (`userSlicViews.length`).
- Target is staff → no button; "To delete this account, change their role to Driver
  first."
- Target is a super admin, or it's your own account → nothing.

Optional: a delete item in the row menu on `/admin/users` (`UserList.jsx`) opening the same
dialog. The details page is enough to start; the list is where a mistake is easiest.

### 5. Docs, in the same change

- `DATA-MODEL.md`, the `users` row's last column: "Self-service delete
  (`DELETE /api/users/[id]`) or the super admin (`POST /api/users/[id]/admin-delete`,
  `user.deleted` in `admin_audit`); both run `deleteUserAccount`."
- `SECURITY.md` #17: move "account deletion" from **Left** to done for the admin path
  (self-service deletion still isn't audited, on purpose: it's the person's own choice
  and the audit row would outlive them).
- `TODOS.md`: tick "Leaving as a dispatcher" (demote, then delete).
- `CLAUDE.md`: one line under the users admin.
- `app/privacy/page.jsx` and the terms: checked, no change needed (see Status).
- `docs/README.md`: this file's row.

## Stamps (left as they are, on purpose)

`deleteUserAccount` leaves `{ id, name, email }` stamps in `slic_history`,
`slics.createdBy/updatedBy` and `cover-bid-jobs` (`SECURITY.md` #19). Only staff write
those, and staff can't be deleted here without being demoted first, so a driver's delete
almost never meets one. Anonymizing them (#19 step 2) is its own change, and it would
cover the self-service path too.

## Verifying

On the dev database (`npm run db:dev-seed`), never production first:

1. As a regular admin: no Danger zone; `POST` the route directly → 403.
2. As the super admin, on yourself and on another super admin → 403, nothing deleted.
3. On an admin or dispatcher → 409 "Change their role to Driver first".
4. Wrong email typed → 400; nothing in `admin_audit`.
5. A test driver with tips (one with a reply), votes, history, a cover list, a pending
   driver claim, a SLIC report and a push device:
   - the right email → 200; the account is gone from `/admin/users`;
   - the tip with a reply is a "Comment deleted" placeholder, the others are gone;
   - the SLIC report is still there with no name;
   - `admin_audit` has `user.deleted` with the counts and no email.
6. Signed in as that test driver in another browser: the next click signs them out.
7. Make the cascade throw (bad id in a test) → the audit row has `failed: true`.

## Open questions (recommended answer first)

1. **Staff accounts: demote first, or delete in one step?** Recommended: demote first
   (above). The alternative is one step that writes both `role.changed` and
   `user.deleted`.
2. **Confirm with the email, or the word DELETE?** Recommended: the email.
3. **Is a block needed?** If the goal is ever keeping someone *out* (abuse, not a test
   account), deleting won't do it. A `blocked-emails` list checked by `register` and the
   Google sign-in callback would; that's a separate plan.
4. **Tell the person?** Optional: send "Your SLICs account was deleted" through the
   existing Resend email (`lib/email.js`) before deleting, when they have a confirmed
   email. Useful when it's at their request; skip it for spam and test accounts. A
   checkbox in the dialog, off by default.
