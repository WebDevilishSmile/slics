# DATA-MODEL.md

Every MongoDB collection the app uses: what it holds, how it's keyed, which module writes
it, what personal data it carries, and when it goes away. It's a map, not a schema. The
example document shapes are in `constants.js` (`SLIC_CENTER_EXAMPLE`, `PLACE_EXAMPLE`, …),
and the code in `lib/db/*.js` is the truth.

Checked against the code on 2026-10-10. When you add a collection, add a row here in the
same change, along with its indexes (`scripts/createIndexes.js`), a retention decision, a
line in `deleteUserAccount` if it holds user data, and a line on the privacy page
(`SECURITY.md` Part 3, "Data layer").

All collections live in one database: the driver's default (`test`), because
`MONGODB_URI` names no database and every module calls `client.db()` with no argument.

---

## Joins to know about

- **`numSlic` is the join key for SLIC data.** Comments, `slic_history` and `slicViews`
  point at a SLIC by `numSlic`, not `_id`. That's why `numSlic` can't change after creation
  (`updateSlic` rejects it). The `/api/slics/[id]` routes take the `_id`.
- **`alphaSlic` is what the sheet uses.** Job routes in the Jobs tab are chains of alpha
  codes (`BETPA>BURMD>…`), and `BETPA` is the alpha code of Bethlehem Center (1809).
  Anything built on the sheet (the daily log idea in `RECOMMENDATIONS.md`) joins to `slics`
  by `alphaSlic`, which isn't uniquely indexed yet (`SECURITY.md` #15).
- **User ids come in two types.** `comments.userId`, vote arrays, `gymComments`, `places`
  and `placeComments` store the id as a **string**. `slicViews.userId`, `slic-reports.userId`, `driver-claims.userId` and Auth.js
  `accounts.userId` store an **ObjectId**. Match the type when you query.
- **Dates come in three forms.** Newer code writes ISO strings (`created_at`,
  `updated_at`). Some older rows have `MM/DD/YY` strings. A few fields are BSON `Date`s
  (`slicViews.viewedAt`, `slic_history.timestamp`, `users.created_at` from registration).
  Check the writer before parsing.
- **Cover-week keys** are `weekEnding`, the week's Saturday as `YYYY-MM-DD`, in
  `cover-bid-jobs`, `cover-bid-picks` and `cover-bid-pick-events`.

---

## SLIC lookup

| Collection | Holds | Keyed by | Written by | Personal data | Goes away when |
|---|---|---|---|---|---|
| `slics` | One destination: type (center/customer), `numSlic`, `alphaSlic`, name, phone, address, `pdfUrl` (or legacy `pdf: true`) | `_id`; `numSlic` (indexed, not unique) | `lib/db/slics.js` (`createSlic`, `updateSlic`, `deleteSlic`) | `createdBy`/`updatedBy` admin stamps (`{ id, name, email }`) | Admin deletes it (hard delete; its comments, history and views stay, see `SECURITY.md` #18) |
| `slic_history` | Audit trail: `{ slicId, numSlic, action, changes: [{ field, from, to }], user, timestamp }` | `slicId`, `numSlic` | `lib/db/slicHistory.js`, only through `createSlic`/`updateSlic` | Admin stamp | Never; deletes aren't recorded (`SECURITY.md` #17) |
| `comments` | Driver tips and replies: `content`, `format` (`'text'`, or missing for old Tiptap HTML; the conversion script keeps the original in `content_html` with `htmlConvertedAt`), `numSlic`, `userId`, `parentId`, vote arrays, optional `pin`, `deleted` placeholder | `numSlic` + `upVotes` index | `lib/db/comments.js` | Author id, voter ids (never sent to other drivers) | Author deletes it (a placeholder stays while it has replies); account deletion |
| `slicViews` | One row per lookup: `{ userId, numSlic, viewedAt }`, plus optional `note`/`noteUpdatedAt` and `hidden`/`hiddenAt` | `userId` + `viewedAt` index | `lib/db/slicViews.js` (`recordSlicView` skips a repeat within 30 min) | Who looked up what, and when | Account deletion. No TTL (`SECURITY.md` #21). "Remove from history" only hides a row |
| `slic-reports` | Drivers' "Something wrong?" reports on a SLIC: `numSlic`, `userId`, `kind` (`phone`/`address`/`closed`/`other`), `note` (plain text), `status` (`open`, then `resolved` or `dismissed`), `created_at`, `updated_at` (re-reported), `closed_at`, `closedBy: { id, name }` | `status` + `created_at`; `userId` | `lib/db/slicReports.js` from `POST /api/slic-reports`; admins close them on `/admin/reports` | Reporter id, the note | Kept as the record of what was fixed; account deletion sets `userId` to `null` |
| `bmc-events` | Every Buy Me a Coffee webhook delivery, plus the history imported 2026-10-10: `type`, `email` (normalized), `supporterName`, `amount`, `currency`, `message`, `userId` (matched account or `null`), `externalId`, `fields` (the payload's field names only), `receivedAt`, `key` (SHA-256 of the body), `thankedAt` (the driver dismissed the thank-you), `linkedAt` (a super admin linked an unmatched email's support to the account). Imported rows add `source: 'import'`, `importedAt`, `coffees`, `period` (a subscription's `month`/`year`) and, on a cancellation, `endsAt`; their `key` is `import:<kind>:<BMC id>` | `key` (unique) | `lib/db/bmcEvents.js` from the BMC webhook; `scripts/importBmcHistory.mjs` | Email, name, amount, message | Kept as the record of support; account deletion sets `userId` to `null` (`BMC-SUPPORT.md`) |
| `allHubs` | The hubs list behind `/hubs`. `numSlic` isn't unique here: 0269 (PRORI, YARMA), 7752 (BAYTX, FTW1) and 9079 (LGBAP, SNAAP) are each on two hubs, so the lookup tells them apart with `&alpha=` (`home/SlicsSearch.jsx`). Possibly a data error, unconfirmed (`TODOS.md`) | `_id` | Not written by the app (read in `lib/db/slics.js`) | None | — |

## People

| Collection | Holds | Keyed by | Written by | Personal data | Goes away when |
|---|---|---|---|---|---|
| `users` | Account: name, first/last, email, bcrypt `password` (email sign-up only), `image`, `role` (`user`/`admin`), `superAdmin` (`true` on a super admin, set only by `scripts/setSuperAdmin.mjs`), `bmcMember`, `phone`, `driver` (the verified-driver link, `{ name, key, verifiedAt, verifiedBy: { id, name } }`: the name as the on-call sheet spells it, set only by an admin; `COVER-BIDDING.md`), `driverId` (the old roster link: nothing writes or reads it since 2026-10-10, waiting to be dropped), `jobChangesSeenAt` (admin) | `_id`; `email` (indexed, not unique); `driver.key` (unique where set: one account per sheet name) | Auth.js adapter, `app/api/auth/register`, `lib/db/users.js`, the BMC webhook | Name, email, phone, password hash | Self-service delete (`DELETE /api/users/[id]`, `deleteUserAccount`); admins can't delete themselves |
| `accounts` | Auth.js OAuth links (Google) | `userId` (ObjectId) | `MongoDBAdapter` | Provider account id | Account deletion |
| `drivers` | The building roster: name, `employeeId`, `seniorityDate` (`YYYY-MM-DD-A`: the letter is the order within a hire date), `phone`, `created_at`/`updated_at`, plus `sheetKey` (the sheet name an admin linked the row to) and `notSheetKeys` (names an admin said aren't this driver). The sheet leads: `/admin/drivers` lists the sheet's drivers and fills in employee ID, date and phone from the linked row (`lib/driverRoster.js`; the Jobs tab's rank and these dates agree, checked 2026-10-10). Nothing driver-facing reads it; it's a hint beside a claim on `/admin/driver-claims` | `_id`; `employeeId` (unique); `sheetKey` (unique where set) | `lib/db/drivers.js`, admin only | Real people, most without an account | Admin deletes a row. The privacy page promises correction or removal on request |
| `driver-claims` | A driver asking to be verified for covers (`COVER-BIDDING.md`): `userId`, `name` (as typed), `employeeId` (from their UPS email) and `seniorityDate` (both only until decided), `status` (`pending`, then `approved` or `rejected`), `note` (the admin's reason when rejected, shown to the driver), `linkedName` (the sheet name it was approved as), `created_at`, `updated_at`, `decided_at`, `decidedBy: { id, name }` | `status + created_at`; `userId + created_at`; `userId` unique among pending | `lib/db/driverClaims.js` from `POST /api/driver-claims`; admins decide on `/admin/driver-claims` | Employee ID and seniority date until decided, the name, the account | The evidence is deleted when an admin decides the claim; the claim itself goes with the account |
| `rateLimits` | Fixed-window counters | `_id` = `<key>:<windowStart>` (keys like `register:<ip>`) | `lib/rateLimit.js` | Keys can contain a user id or IP | TTL on `expiresAt` (self-cleaning) |
| `admin_audit` | One row per consequential admin action, written before the change: `actorId`/`actorName` (null for the script), `action` (`role.granted`/`.revoked`, `membership.granted`/`.revoked`, `superAdmin.granted`/`.revoked`, `support.linked`, `driver.verified`/`.unverified`, `driverClaim.rejected`), `targetType`, `targetId`, `targetName`, `from`, `to`, `at` | `actorId + at` | `lib/db/adminAudit.js` (`toggle-role`, `toggle-member`, `/api/admins`, `lib/db/driverClaims.js`), `scripts/setSuperAdmin.mjs` | Names | Kept as the audit trail (`SECURITY.md` #17) |

## Cover bids and the on-call sheet

See `ON-CALL-SHEET-SYNC.md` for how these are filled.

| Collection | Holds | Keyed by | Written by | Personal data | Goes away when |
|---|---|---|---|---|---|
| `cover-bid-jobs` | A week's cover jobs: `jobNumber`, name, assigned driver, reason, `sun`…`sat` (`"HH:MM"` or `''`), description, `source` (`'sheet'` or a photo upload) | `weekEnding` + `sortOrder` | `lib/db/coverBidJobs.js` (`replaceCoverBidJobsForWeek` for the sheet) | Driver names, admin stamps (admin-only: the drivers' copy on `/covers`, `toDriverCoverJob`, says only whether a job is picked) | Replaced by the next refresh of that week |
| `cover-bid-picks` | One doc per week: every pick row (name, job/status, picks 1–7), who refreshed it, when | `weekEnding` (unique) | `lib/db/coverBidPicks.js` | Driver names, leave statuses (`VACATION`, `FMLA`) | Never (no retention yet) |
| `cover-bid-pick-events` | One row per pick that changed between refreshes | `weekEnding` + `seenAt` | `lib/db/coverBidPicks.js` | Driver names | Never |
| `sheet-jobs` | Snapshot of the Jobs tab: one doc per job (driver, per-day start/hours/miles, description, week hours, seniority); `removedAt` when it leaves the sheet | `jobName` (unique) | `lib/db/sheetJobs.js` | Driver names, seniority | A job is marked removed, never deleted |
| `sheet-job-changes` | One row per changed field: `{ jobName, kind, field, group, from, to, seenAt, source }` | `seenAt`; `jobName` + `seenAt` | `lib/db/sheetJobs.js` | Driver names in `from`/`to` | Never |
| `sync-state` | Sheet sync bookkeeping: `{ _id: 'jobs' }`, `{ _id: 'week:YYYY-MM-DD' }` leases and outcomes, `{ _id: 'ping' }` | `_id` | `lib/db/syncState.js` | None | Overwritten in place |
| `cover` | **Unused since 2026-10-10.** The old hand-edited cover-driver positions (`position`, `driverName`). `/admin/cover/drivers` now builds the list from `cover-bid-picks`; the route and editor were deleted. The rows wait to be dropped (`TODOS.md`) | `position` | Nothing | Driver names | Drop it once the sheet list has proven itself |
| `bid-jobs` | An old bid list. Unused: `/bids`, its only reader, was deleted 2026-10-10 | `_id` | Not written or read by the app | Driver names, if present | — |

## Places and gyms

| Collection | Holds | Keyed by | Written by | Personal data | Goes away when |
|---|---|---|---|---|---|
| `places` | Driver-added stops (`/whip-it-in-and-out`): categories, trailer access, address, pin, hours, `slics` tags | `_id` | `lib/db/places.js` | `createdBy` (string id; `null` after the author deletes their account) | Author or admin deletes it (only an admin once others have commented) |
| `placeComments` | Plain-text comments, one level of replies, votes, `deleted` placeholder | `placeId` + `parentId`; `userId` | `lib/db/places.js` | Author id, voter ids | Author deletes it; account deletion (`deleteUserPlaceData`) |
| `gyms` | The admin's truck-accessible Planet Fitness list | `_id` | `lib/db/gyms.js`, admin only | Admin stamp | Admin deletes it |
| `gymComments` | Comments on a gym (kept apart from `comments`, which assumes a `numSlic`) | `gymId` + `created_at` | `lib/db/gyms.js` | Author id and name | Account deletion |

---

## Outside MongoDB

- **Vercel Blob:** the directions PDFs, one public random-suffix URL per upload, saved on
  `slics.pdfUrl`. The old blob is deleted after each re-upload. `lib/blob.js` is the only
  module that talks to it.
- **Supabase bucket (legacy):** older PDFs at a predictable `<alphaSlic>.pdf` URL, used
  only when a SLIC has `pdf: true` and no `pdfUrl`. It goes away when the migration finishes.
- **The ON CALL SHEET:** read only, never written. Its id lives in `ON_CALL_SHEET_ID`.
- **Browser storage (per device, not reliable):** recent lookups, the tips "new since last
  visit" marks, the comment-prompt state, the tip cycle position, the install-nudge
  snooze, the maps-app choice.
