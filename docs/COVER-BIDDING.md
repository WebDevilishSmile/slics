# COVER-BIDDING.md

Plan and checklist for moving the weekly cover bid into the app: drivers prove who they
are on the on-call sheet, then see the cover list, then keep a list of the jobs they want,
then pick in the app when their time comes. Built in stages; check items off as they ship.

**How to use this:** stages go in order. Each item says where the code lives. Run
`npm run build` (in a scratch copy, never while `next dev` runs) before shipping any item.
The app is used daily in production.

## Status (2026-10-22)

- **Stage 1** (driver verification and the drivers' Covers page): built, **admin only**
  while it's tested (super admins only for a few hours on 2026-10-12). Until the "Covers
  for every driver" switch on `/admin/super/features` opens it (`COVERS_OPEN` in
  `constants.js` is only the default), only admins see `/covers`, the menu item and the
  check mark on Driver tips, and only they can file a claim or keep a list
  (`canUseCovers`, `lib/authz.js`). Admins are the testers, so `/covers` shows them
  exactly what a driver will get: unverified, only the claim; verified, their place, the
  jobs and their list, read only on a week they're off. Their admin view is the admin
  pages (`/admin/cover/*`, `/admin/driver-claims`). Test it, then follow the rollout
  checklist below.
- **Indexes:** run `npm run db:indexes` once stage 1 is deployed (two of its indexes are
  unique, see "Data").
- **Stage 2** (cover lists): built 2026-10-12 behind the same gate, so admin only
  too.
  Run `npm run db:indexes` once it's deployed (`cover-preferences`, including its TTL),
  then check it with "Verifying stage 2" below.
- **Off the list, read only** (built 2026-10-12, behind the same gate): a verified driver
  a posted week's pick list doesn't name can't keep a list for that week, and "This is a
  mistake" tells the admins (see the end of stage 2). Run `npm run db:indexes` once it's
  deployed (`cover-disputes`), then check it with "Verifying the read-only rule" below.
- **Early access** (built 2026-10-17): the super admin can let one account into Covers
  before it opens to everyone (see "Early access" under stage 1).
- **Bid day, the super admin's preview and notifications** (built 2026-10-22, not
  deployed yet): the day drivers call in is known and shown, the super admin can see
  `/covers` as a cover driver does, and verified drivers get notifications (stage 3 of
  `PUSH-NOTIFICATIONS.md`). Run `npm run db:indexes` once deployed (`cover-bid-days`,
  `cover-notices`).
- **Stage 3** (picking in the app): not started. **Stage 4:** the call-in reminder is
  built; "your pick is up" waits for stage 3.

---

## Why

Drivers bid on cover jobs every week in the ON CALL SHEET (`ON-CALL-SHEET-SYNC.md`): at
their call-in time, in pick order, each writes the jobs they take. The app already reads
the sheet. To run the bid itself, it has to know which account is which driver, and it
has to keep the bid anonymous: a driver sees which jobs are gone, never who took them.

Verification is cover-specific. Nothing else in SLICs asks for it, and a driver who
doesn't do covers never has to.

**The original ask**, as written in `TODOS.md` (moved here 2026-10-14):

> I need to establish a way to authenticate users. We should have a way to link the driver on the jobs list and cover and on-call list, to the user of the app. Email address will link to the driver. Sometimes the user's name and email does not match exactly with the driver roster, so additional verification may be needed. Find a way to have the user claim their driver identity. This has to be verified by admin. A verification process like X does with the check mark or badge for verified users could be implemented. Eventually, I would like the cover bid weekly bidding process to be done on this app. The verified user logs in, sees what jobs are available and their pick time (call in time), and can take his bid when his time comes. We need to maintain anonymity, so other drivers can't see what bids have been made by whom, only admins. I'm thinking a cover page where users can see available bids without revealing who has made them. Once a job is picked it is grayed out but doesn't say who took it. On the cover page there will be the name of the user and his pick time. There can be a way to create a list of bids they want in order of preference. As the jobs are picked those jobs come off of the preferred list for each user. Once the users is on the clock their auto pick will be submitted and the next driver can pick. First thing will be building the cover page for all drivers. Upon entering page, am alert that only verified drivers can see that cover list. They can submit for verification by claiming their name and employee email (employee_id@ups.com) and seniority date. Admins will review and approve these claims to ensure the integrity of the verification process. Once verified, the user will have access to the cover bidding features. I don't want to hinder drivers from accessing the SLICs app if they are not interested in this. So, this has to be cover-specific. If a driver wants to participate in the covers feature, then he must be verified.

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

## Stage 1: Verification and the drivers' Covers page (built, admin only while tested)

- [x] **Claim:** `POST /api/driver-claims` (`requireCovers()`, 5 a day per driver), checked
      by `validateDriverClaim`. The form is `components/covers/DriverClaimDialog.jsx`.
- [x] **`/covers`** (`app/covers/page.jsx`, gated by `canUseCovers` before any read):
  - [x] Not verified: `components/covers/DriverVerification.jsx`, the notice that only
        verified drivers see the cover list, then the claim in its state (none, pending
        with Edit, turned down with the admin's reason and Try again).
  - [x] Verified: `components/covers/MyCoverWeeks.jsx`, one tile for the week bid on
        this week (Cover 7, On call #23, Out this week, and the call-in time; see "One
        week on /covers" below), then `CoverBidJobsTable` with `toDriverCoverJob` rows.
        Admins see the jobs while unverified too.
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

### Early access (built 2026-10-17)

Tiago asked: "In the user page, I want to be able to choose which individuals have access
to the cover jobs info. I want to be able to toggle that off and on for whomever I
decide." So he can let chosen drivers test Covers before the switch opens it to everyone.

- [x] **The switch:** "Covers early access" on each `/admin/users` card and a "Covers"
      well on `/admin/users/[id]` (`components/admin/users/UserCoversAccess.jsx`). Only a
      super admin flips it, like the "Covers for every driver" switch; other admins with
      the Users tool see the state. Staff whose role has the Covers tool show "Has Covers
      through their role" and get no switch. A "Covers early access" filter on
      `/admin/users` lists everyone let in.
- [x] **Data:** `users.coversAccess = { at, by: { id, name } }` while on, `$unset` when off,
      through `setCoversAccess` (`lib/db/users.js`), which writes `coversAccess.granted` /
      `.revoked` to `admin_audit` first. `PUT /api/users/[id]/covers-access` with
      `{ on }` (`requireSuperAdmin()`).
- [x] **The rule:** `canUseCovers` adds `session.user.coversAccess` (`auth.js` reads it
      with the role on every request), so everything behind it follows: `/covers`, the
      menu row ("Early access" under it), the claim, cover lists, the This week card and
      the check mark on tips.
- **Only adds.** Once Covers is open it changes nothing (the switch says so), and a grant
  is kept, so it applies again if Covers closes. It never keeps anyone out.
- **Rollback:** `git revert` the server commit; saved `coversAccess` fields then do
  nothing and can stay. The `/help` This week guide still waits for the switch.

### The super admin's preview (built 2026-10-22)

Tiago asked to "see the covers page like a cover driver would", knowing the call-in
time from the sheet would have to be a placeholder: he isn't verified, and isn't on a
pick list.

- [x] **`/covers?preview=driver`**, honored only for `isSuperAdmin` (anyone else gets the
      normal page). It loads what a verified driver's page loads (the jobs through
      `toDriverCoverJob`, hidden jobs left out, BETPA's phone, the bid days), but from the
      picks only each posted week's date: the tile is "Cover #", "Your place on the pick
      list", with the real bid day and "Your time". No real driver's row reaches the page.
- [x] **The list works but isn't saved:** `CoverBoard`'s `preview` keeps it in the page,
      with no `PUT` and no re-read, and says "Preview: this list isn't saved."
- [x] **In and out:** "See it as a cover driver" under the title, for the super admin
      only, and a notice above the preview with Exit preview
      (`components/covers/CoverPreview.jsx`).
- The notifications themselves are previewed with "Send me a sample" on
  `/admin/super/notifications`.

### One week on /covers (2026-10-28)

Tiago: "having two Covers one for the week of and one for the following week is
confusing. Let's just display one week and we will use Sunday as the threshold for
showing the following week." `/covers` used to show a tile for every posted week from
this one on, which was usually two (W/E 10/31 and W/E 11/7 on 10/28).

- [x] **The week** is `currentBidWeek(today)` (`lib/bidDay.js`, New York's date): the
      week whose usual Thursday bid day falls in today's Sunday–Saturday week, which is
      always next week. On Sun 10/25/2026 it went from W/E 10/31 (bid Thu 10/22) to W/E
      11/7 (bid Thu 10/29). A bid day moved for a holiday doesn't change it.
- [x] **The tile** is that week's: the driver's place and call-in, or "Your place for the
      week ending … shows once its pick list is posted" until it is.
- [x] **The read-only notice and "This is a mistake"** are about that week only, on the
      page and in `POST /api/cover-disputes`.
- [x] **The calendar** opens on the same week (the server passes it as `initialWeek`;
      `?week=` still wins), so it follows New York time, not the browser's or the server's
      clock. The current week is still a tap away there, read only if the driver is off it.
- **Rollback:** `git revert` the commit; nothing is stored.

### Rolling stage 1 out to every driver

- [ ] Tested on at least one other admin: claim, verify, the week tiles, turn down, remove.
- [ ] Set `COVERS_OPEN = true` in `constants.js`. That opens `/covers`, the menu item, the
      claim route and the check mark on tips to every signed-in driver.
- [ ] Add a "Verify you're a driver" guide to `/help` (`components/help/guides.jsx`).
- [ ] Re-read the privacy page's "Driver verification" section, and add the cover lists
      to it: which jobs a driver wants, seen by admins only, deleted four weeks after the
      week (and with the account).
- [ ] Add a "Keep a cover list" guide to `/help` beside "Verify you're a driver".
- [ ] Update the line about rollout in `CLAUDE.md`.
- [ ] Drop the "This is a work in progress" notice from `CoverBidJobsTable`, or reword it
      for drivers.

### This week on the profile (built 2026-10-14)

A verified driver's `/profile` opens on what they work this week, and next week once its
pick list names them (`profile/ThisWeek.jsx`, `lib/db/driverWeeks.js`). The pick list's
"Job / status" column is what each driver works that week: on W/E 10/17/2026 it held the
picked cover job's number for 27 of the 35 picked jobs, and otherwise their own job, a
leave, `ON CALL`, `COVERING ER#####`, or nothing before a pick. The PICK #1–7 columns are
almost always empty, so the card doesn't use them. It shows the cover job's start times
for that week and its route by day (`lib/jobRoutes.js`), never who owns it or why
they're off (`toDriverWeek`).

---

## Stage 2: A preference list (built 2026-10-12, admin only while tested)

A verified driver lists the jobs they want, in order. As jobs are picked (by anyone, on
the sheet or later in the app), they drop off everyone's list. Picks still happen by
calling dispatch at the call-in time; the list is what the driver reads off on the call.

- [x] **`cover-preferences`** (`lib/db/coverPreferences.js`), one document per driver per
      week, keyed by `userId` + `weekEnding`, entries by job number (`jobKey`) like the
      hides, never the job's `_id`. Deleted with the account. **Retention:** the last four
      weeks, for checking afterwards: `expiresAt` is 28 days after the week's Saturday
      (`COVER_LIST_KEEP_DAYS`) and a TTL index deletes it.
- [x] **`requireVerifiedDriver()`** in `lib/authz.js`: `requireCovers()` plus
      `isVerifiedDriver`. Admins need a verification too, since a list belongs to a
      driver on the sheet.
- [x] **Routes:** `GET`/`PUT /api/users/me/cover-preferences` (the session's own list
      only; `PUT` sends the whole list in order, this week or later, drops jobs not
      posted or hidden, 300 saves an hour). `GET /api/cover-preferences` for admins.
- [x] **The list on `/covers`** (`covers/CoverBoard.jsx`, `covers/CoverList.jsx`): for
      the week picked on the calendar, the open jobs in order with move up, move down
      and remove; each job in the table, card and dialog has an add/remove button
      (`coverBidJobs/ListToggle.jsx`; a taken job can't be added, 30 at most). A taken
      or hidden job leaves the list on read (`coverListStatus`, `lib/coverList.js`) but
      stays stored, so it comes back if it reopens; the list names the taken ones. The
      page re-reads the list when the driver comes back to it. A past week's list is
      read-only.
- [x] **Call dispatch** under the list dials the phone on SLIC `DISPATCH_NUM_SLIC`
      (BETPA, 1809), read at page load, beside the driver's call-in time for that week.
      It's always the list's main action. The sheet gives call-in slots but not the bid
      day; since 2026-10-22 the bid day is a rule an admin can override (below), shown
      beside the time ("Your call-in: Thu 10/22 at 9:15").
- [x] **Admins see every list:** `/admin/cover/lists` (`components/admin/coverLists/`),
      each driver's list in pick order with their cover number or on-call order and
      call-in, taken jobs struck through, and the most wanted open jobs (first choice,
      on how many lists). `/admin/cover/jobs` labels each job "On N lists · 1st on M"
      (`WantedLabel`). Drivers see only their own list.
- [x] **Off the list is read only** (2026-10-12): a verified driver who isn't a cover or
      on-call driver in a posted week (the week's `cover-bid-picks` has rows and none is
      theirs, `offListWeeks` in `lib/coverDrivers.js`) sees that week's jobs but can't
      start or change a list for it, and `PUT /api/users/me/cover-preferences` answers
      403. A list saved before shows read-only without Call dispatch. A week whose picks
      aren't posted isn't off: nobody knows yet. Stage 3's picking must check the same
      rule.
- [x] **"This is a mistake"** (`covers/CoverDispute.jsx`): the read-only notice on
      `/covers` names the week it shows (since 2026-10-28, only the week bid on this
      week: "One week on /covers" under stage 1) and the driver's current job
      code from the Jobs tab ("Your current job code is BMEL", `getDriverJobName` in
      `lib/db/sheetJobs.js`, left out when they hold none), and its button sends the admins
      an optional note (`POST /api/cover-disputes`, 5 a day). The server records the
      week and the linked sheet name itself, and refuses when the driver is on that
      week's list or it isn't posted. The dispute keeps their job code for the admin. One open dispute per driver (`cover-disputes`,
      `lib/db/coverDisputes.js`); sending again edits it. Admins get a push (`coverDisputes`,
      on by default), the header-menu badge and the `/admin` banner, and close it on
      `/admin/driver-claims` with an optional answer the driver sees on `/covers`. The fix
      is the sheet's, or the account's link on its admin user page.

### Bid day (built 2026-10-22)

Drivers call dispatch at their call-in slot (the pick section's column A, New York time)
on the bid day. The sheet doesn't say which day that is. The saved picks showed W/E
10/24/2026 picked on Thursday 10/15 from 7:00, and Tiago confirmed the rule: the Thursday
9 days before the week ends, which an admin can move for a holiday (Thanksgiving, Thu
11/26/2026, is the bid day for W/E 12/5).

- [x] **The rule** is `lib/bidDay.js`, pure: `defaultBidDate`, `bidDateFor`,
      `weeksBiddingOn`, `callInInstant` (a slot on a bid day to the moment, through
      `Intl`, right across daylight saving).
- [x] **Moving a week:** "Bid day: Thu 10/22 · Change" under Refresh on
      `/admin/cover/jobs` (`coverBidJobs/BidDayControl.jsx`), a date between four weeks and
      one week before the week starts, and "Use Thu …" to go back. `PUT
      /api/cover-bid-days` (Covers area) writes `cover-bid-days` after `admin_audit`
      (`coverBidDay.set` / `.reset`); going back deletes the doc.
- [x] **Drivers see it** beside their call-in time: "Call in Thu 10/22" on the week's tile,
      "Your call-in: Thu 10/22 at 9:15" under the list. The call-in reminders go out on it
      (`PUSH-NOTIFICATIONS.md` stage 3).

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

## Stage 4: "Your pick is up" (part built 2026-10-22)

A push notification when a driver's turn comes. The call-in reminder is built: on bid day,
at the times the driver chose before their call-in, with the first jobs on their list
(stage 3 of `PUSH-NOTIFICATIONS.md`). "Your pick is up", sent when the driver before them
picks, waits for stage 3.

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
   tile. Deleting the test account deletes its claims.

### Verifying stage 2

With a verified admin (the super admin can verify themselves) on a posted week:

1. **The gate:** a regular account gets 401/403 from `/api/users/me/cover-preferences`;
   an unverified admin sees only the claim on `/covers`: no jobs, no list.
2. **Building a list (phone width, light and dark):** add three jobs from the cards, the
   table and the job dialog; move one up and down; remove one. Reload: the order holds.
   A picked job's add button is disabled ("Taken").
3. **Dropping off:** when one of the list's jobs is picked on the sheet and the week is
   refreshed (or synced), coming back to `/covers` drops it from the list and names it
   under "Taken since you added it". If the pick is cleared, it returns in place. A
   listed job an admin hides leaves the list.
4. **Call dispatch** opens the dialer with BETPA's number; the call-in time matches the
   week's tile.
5. **Admins:** `/admin/cover/lists` shows the list in pick order and the most wanted
   table; `/admin/cover/jobs` shows "On 1 list · 1st on 1" on the first open job.
6. **Past week:** a week that's over shows its list read-only; `PUT` answers 400.
7. **Cleanup:** delete the test list (remove every job), or delete the test account.

### Verifying the read-only rule

With a verified tester whose linked name isn't in a posted week's picks (re-link them on
their admin user page to a name only on the Jobs tab, then link them back):

1. **Read only:** `/covers` says the cover list is read only, naming the week shown (the
   one bid on this week). That week has no list and no add buttons, and a `PUT` for it
   answers 403. A week they're on still works.
2. **This is a mistake:** send it with a note. The notice says when it was sent and the
   button goes. The admins who chose "Cover list disputes" get a push with no name; the
   menu badge and the `/admin` banner count it; `/admin/driver-claims` shows the account,
   the linked name, the week and the note. A tester on the week shown gets 409.
3. **Closing:** close it with an answer. The driver sees the answer on `/covers` and the
   button again; the badge drops.
4. **Cleanup:** link the tester back. Deleting a test account deletes its disputes.
