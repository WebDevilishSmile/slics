# COVER-BIDDING.md

Plan and checklist for moving the weekly cover bid into the app: drivers prove who they
are on the on-call sheet, then see the cover list, then keep a list of the jobs they want,
then pick in the app when their time comes. Built in stages; check items off as they ship.

**How to use this:** stages go in order. Each item says where the code lives. Run
`npm run build` (in a scratch copy, never while `next dev` runs) before shipping any item.
The app is used daily in production.

## Status (2026-10-10)

- **Stage 1** (driver verification and the drivers' Covers page): built, **admin-only**
  until it rolls out. `COVERS_OPEN` in `constants.js` is `false`, so only admins see
  `/covers`, the menu item and the check mark on Driver tips. Test it on other admins
  first, then follow the rollout checklist below.
- **Indexes:** run `npm run db:indexes` once stage 1 is deployed (two of its indexes are
  unique, see "Data").
- **Stages 2–4:** not started.

---

## Why

Drivers bid on cover jobs every week in the ON CALL SHEET (`ON-CALL-SHEET-SYNC.md`): at
their call-in time, in pick order, each writes the jobs they take. The app already reads
the sheet. To run the bid itself, it has to know which account is which driver, and it
has to keep the bid anonymous: a driver sees which jobs are gone, never who took them.

Verification is cover-specific. Nothing else in SLICs asks for it, and a driver who
doesn't do covers never has to.

## Ground rules

- **Drivers come from the sheets, not the roster.** An account is linked to the driver's
  name as the sheet spells it (`DOE, JANE`): the cover tabs' pick sections and the Jobs
  tab's `Driver` column. The `drivers` roster is only a hint beside a claim, matched by
  employee ID. Since the roster is merged with the sheet (`/admin/drivers`,
  `lib/driverRoster.js`), that hint also names the roster row's driver on the sheet, and
  the queue preselects it.
- **An admin verifies, and every verification is on record.** A driver claims their name,
  their UPS email (`employee_id@ups.com`, read for the employee ID; nothing is sent to it)
  and their seniority date. An admin checks it and picks the sheet name. Verifying,
  changing the name, removing a verification and turning a claim down each write to
  `admin_audit` first. An admin can't verify themselves; the super admin can.
- **One sheet name, one account.** `users.driver.key` is unique.
- **The evidence is short-lived.** The employee ID and seniority date on a claim are
  deleted as soon as an admin decides it, either way. Claims go with the account.
- **Anonymous to drivers, open to admins.** A driver sees:
  - the job list, with picked jobs grayed out and no names (`toDriverCoverJob`);
  - their own row in the pick section: cover number or on-call order, and their call-in
    (pick) time (`myCoverSpot`).

  A driver never sees who picked a job, anyone else's picks, or anyone's job or leave
  status (`VACATION`, `FMLA`). Admins see everything, as today.
- **A hidden job is out for drivers.** An admin can hide a week's job from drivers
  (`COVER-JOB-HIDING.md`). `/covers` leaves it out on the server, before
  `toDriverCoverJob`, and stages 2 and 3 must too: a driver can't list or pick a job they
  can't see.
- **The claim form never lists names.** Registration is open (`SECURITY.md` #8), so the
  list of every driver's name stays admin-only. The driver types their own; the admin
  matches it.

## Data

- **`driver-claims`** (`lib/db/driverClaims.js`): `{ userId, name, employeeId,
  seniorityDate, status: 'pending' | 'approved' | 'rejected', note, linkedName,
  created_at, updated_at, decided_at, decidedBy }`. At most one pending claim per driver
  (unique partial index); sending again edits it.
- **`users.driver`**: `{ name, key, verifiedAt, verifiedBy: { id, name } }`. Verified ⇔
  `driver.verifiedAt`. `key` is `driverNameKey(name)` (`lib/driverNames.js`): upper case,
  no periods, single spaces, no space around the comma. Unique where set.
- **The session** carries `driverVerified`, re-read from the user row on every request
  like `role` (`auth.js`), so a verification or removal applies on the driver's next
  request, with no sign-out.
- `users.driverId`, the old roster link, is no longer written or read; it waits to be
  dropped (`TODOS.md`).

---

## Stage 1: Verification and the drivers' Covers page (built, admin-only)

- [x] **Claim:** `POST /api/driver-claims` (`requireCovers()`, 5 a day per driver), checked
      by `validateDriverClaim`. The form is `components/covers/DriverClaimDialog.jsx`.
- [x] **`/covers`** (`app/covers/page.jsx`, gated by `canUseCovers` before any read):
  - [x] Not verified: `components/covers/DriverVerification.jsx`, the notice that only
        verified drivers see the cover list, then the claim in its state (none, pending
        with Edit, turned down with the admin's reason and Try again).
  - [x] Verified: `components/covers/MyCoverWeeks.jsx`, one tile per posted week from
        this one on (Cover 7, On call #23, Out this week, and the call-in time), then
        `CoverBidJobsTable` with `toDriverCoverJob` rows. Admins see the jobs while
        unverified too.
- [x] **Admin queue:** `/admin/driver-claims` (`components/admin/driverClaims/`). Each
      claim shows the account (with its join date, so a brand-new one stands out), the
      evidence, the roster hint, and a sheet-name picker (`SheetNameField.jsx`)
      preselected by `rankSheetNames`. Verify, or Turn down with a reason. `PATCH
      /api/driver-claims/[id]`.
- [x] **Alerts:** the `/admin` banner (`DriverClaimsNotice.jsx`) and the header-menu badge
      (`lib/driverClaimsStore.js`, `GET /api/driver-claims`). A claim counts until it's
      decided.
- [x] **Admin user page:** "Driver verification" (`components/admin/users/UserDriver.jsx`):
      Verify without a claim, Change name, Remove. `PUT`/`DELETE /api/users/[id]/driver`.
      A "Verified drivers" filter on `/admin/users`.
- [x] **The check mark** (`components/utility/VerifiedBadge.jsx`): the profile, the menu,
      Driver tips authors (`getSlicThread`'s `showVerified`, only for those who can use
      Covers until rollout), and the admin user list and page.
- [x] **Account deletion** deletes the driver's claims (`deleteUserDriverClaims`).

### Rolling stage 1 out to every driver

- [ ] Tested on at least one other admin: claim, verify, the week tiles, turn down, remove.
- [ ] Set `COVERS_OPEN = true` in `constants.js`. That opens `/covers`, the menu item, the
      claim route and the check mark on tips to every signed-in driver.
- [ ] Add a "Verify you're a driver" guide to `/help` (`components/help/guides.jsx`).
- [ ] Re-read the privacy page's "Driver verification" section.
- [ ] Update the line about rollout in `CLAUDE.md`.
- [ ] Drop the "This is a work in progress" notice from `CoverBidJobsTable`, or reword it
      for drivers.

---

## Stage 2: A preference list (not started)

A verified driver lists the jobs they want, in order. As jobs are picked (by anyone, on
the sheet or later in the app), they drop off everyone's list.

- [ ] A `cover-preferences` collection, one document per driver per week, keyed by
      `userId` + `weekEnding`. Deleted with the account; a retention decision for past
      weeks.
- [ ] `requireVerifiedDriver()` in `lib/authz.js` for its routes (on top of
      `isVerifiedDriver`).
- [ ] The list on `/covers`: add from the job list, reorder, remove. Picked jobs gray out
      and leave the list on the next read.
- [ ] Admins see every driver's list; drivers see only their own.

## Stage 3: Picking in the app (not started)

The driver on the clock picks in the app. When their time comes, their list's top
available job is taken for them if they haven't picked.

Open questions, to settle before building:

- **The source of truth.** The app must never change the sheet (`ON-CALL-SHEET-SYNC.md`).
  Once picks happen in the app, the sheet no longer has them unless someone copies them
  over. Either the app becomes the record (and the sheet's owner copies picks in, or
  stops using the pick section), or picks stay on the sheet and the app only suggests.
  This needs the sheet's owner.
- **The clock.** Is the call-in time the start of a driver's turn? How long is a turn,
  and does the next driver wait for the clock or start as soon as the previous one picks?
- **Auto-pick.** What happens when a driver's list is empty or all picked: skip them, or
  wait?
- **On-call drivers** (after pick 20): do they bid too?
- **Mistakes:** who can undo a pick, and how it's recorded.

## Stage 4: "Your pick is up" (not started)

A push notification when a driver's turn starts. It's stage 3 of `PUSH-NOTIFICATIONS.md`.

---

## Verifying

Locally (`npm run dev`, which writes to the production database, so delete test data
afterwards) with three accounts: a regular one, a tester admin, and a second admin or the
super admin to review.

1. **The gate (regular account):** no Covers in the menu; `/covers` redirects to `/home`;
   `POST /api/driver-claims` answers 403; no check mark on a verified admin's tip.
2. **Claiming (tester admin), light and dark, at phone width:** Covers shows the notice. A
   bad UPS email or a future date shows the server's message in the dialog. A good claim
   shows the pending notice; Edit claim changes the same one. The sixth send in a day
   answers 429.
3. **Reviewing (the other admin):** the `/admin` banner and the menu badge count the claim.
   On `/admin/driver-claims` the sheet name is preselected and the roster hint shows.
   Verify: `admin_audit` gets `driver.verified`, and the claim has no `employeeId` or
   `seniorityDate` left. The tester can't decide their own claim. Linking a name that's
   already linked answers 409.
4. **Verified (tester admin), no sign-out:** the check mark is in the menu, on the profile
   and on their tips. `/covers` shows "Cover N" and the call-in time for a week in
   `cover-bid-picks`. Picked jobs are grayed, and neither the page source nor the job
   dialog has a name, an assigned driver or a cover reason.
5. **Turning down:** the tester sees the reason and Try again; the evidence is gone.
6. **Removing** from the admin user page: the next request drops the check mark and the
   tiles. Deleting the test account deletes its claims.
