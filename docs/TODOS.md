# TODOs

The one live to-do list. Everything open is here, whether it came from an idea or from a
finished punch list in `archive/`. Longer write-ups live elsewhere and are linked:
`SECURITY.md` for security, `ON-CALL-SHEET-SYNC.md` for the sheet sync, and
`RECOMMENDATIONS.md` for ideas not yet adopted (move one here when you decide to build it).

Sections go from "time-bound" to "someday". Check an item off where it is, then move it to
**Done** at the bottom when convenient. Use absolute dates.

---

## Now (time-bound)

### On-call sheet sync, stage 3 wrap-up (`ON-CALL-SHEET-SYNC.md`)

- [x] set `CRON_SECRET` on Vercel (until then the daily cron route answers 500)
- [x] give the admin's superior a heads-up about the sheet notifier
- [ ] watch the first real Jobs-tab edit raise the `/admin` banner and menu badge, then
      clear when `/admin/jobs` opens
- [ ] one Refresh each (Jobs and a cover week) on the live site to confirm the deployment

### Super admin hub (`SUPER-ADMIN-HUB.md`)

- [x] stages A–F built 2026-10-12: notification choices, the hub with numbers and usage,
      notifications, activity, system health and feature switches
- [ ] ship it: run `npm run db:indexes`, restart `next dev` (new `@mui/x-charts`), and go
      through "Verifying" as the super admin on a phone
- [ ] after the first week: does the hub replace checking the Vercel and Atlas dashboards
      day to day, and is anything missing from it?

### Places launch (`CLAUDE.md` → Data layer → Places)

- [x] renamed from Whip It In & Out to Places at `/places` (the old path redirects), opened
      to every driver, and announced in the menu ("New" until `PLACES_NEW_UNTIL`), an
      empty-state tip on /home, the landing page and a `/help` section (2026-10-12)
- [ ] check on a phone as a non-admin driver: the Places row under All Hubs, adding a place,
      a comment, and an old `/whip-it-in-and-out` bookmark landing on `/places`
- [ ] **on or after 2026-11-12:** count the places and `placeComments` added since
      2026-10-12 and the `/places` pageviews in Vercel Analytics, then decide the forum
      (Features → Forum Page)
- [ ] **on or after 2026-11-12:** make the `/whip-it-in-and-out` redirect `permanent: true`
      (`next.config.mjs`), and remove `PLACES_NEW_UNTIL` and its check in
      `header/UserMenu.jsx`

### SLIC reports (`RECOMMENDATIONS.md` #5)

- [x] send a test report from a phone, then Fix it from `/admin/reports` and check the
      banner, the menu badge and the SLIC's history
- [x] `npm run db:indexes` for the two `slic-reports` indexes

### After a trial period

- [ ] **on or after 2026-10-22:** delete the 13 old-path API alias files
      (`grep -rln "Old path, renamed on 2026-10-08" app/api`) and their mention in
      `CLAUDE.md` → "API routes" (`archive/STRUCTURE.md` #29 follow-up)
- [x] ~~stage 4 cleanup~~: the bid-sheet photo upload, the `extract` route, `@google/genai`
      and `GEMINI_API_KEY` were deleted 2026-10-10 (`ON-CALL-SHEET-SYNC.md` → "Stage 4").
      Left: remove the key from Vercel and `.env`, and revoke it in Google AI Studio
- [ ] **once the sheet's cover list has proven itself:** drop the unused `cover` collection
      (its code went 2026-10-10; the rows are kept until then in case the old list is wanted)
- [ ] drop the unused `bid-jobs` collection when sure nobody wants the old list (`/bids`, its
      only reader, was deleted 2026-10-10 with `SECURITY.md` #7)
- [ ] **when every SLIC has `pdfUrl`:** retire the Supabase bucket and the `slic.pdf`
      fallback (`CLAUDE.md` → "External integrations"; also closes part of `SECURITY.md` #13)

---

## Features

### Delete Account

The app should provide a way for users to delete their accounts.

- [x] self-service delete (2026-09-20; re-checked 2026-10-12): `/profile` → Edit profile →
      Delete account (`profile/DeleteAccountDialog.jsx`, type `DELETE` to confirm, then signed
      out). `DELETE /api/users/[id]` takes only the caller's own id and refuses admins;
      `deleteUserAccount` (`lib/db/users.js`) covers every user-linked collection in
      `DATA-MODEL.md`: tips, votes, places data, gym comments, lookups, Google links, claims,
      push devices and reset links go; SLIC reports and BMC events stay, unlinked

### Landing page

The landing page should introduce SLICs and its purpose for UPS Feeder drivers. It should provide a clear call-to-action for signing in and accessing the app's features. Consider including an overview of the app's capabilities, such as looking up SLIC codes, viewing driver tips, and accessing cover bidding for verified users. The design should be clean and informative, guiding new users to understand the app's value and how to get started. The sign in process should be in the /sign-in page.

- [x] landing page on `/` and sign-in on `/sign-in` (2026-10-12, `components/landing/`). It
      leaves out cover bidding until covers open to every driver (`COVERS_OPEN`)
- [x] design critique pass (2026-10-12, `.impeccable/critique/`): the hero shows a made-up
      SLIC card (`landing/ProductPreview.jsx`), what Google sign-in shares sits under the
      button, "Why you sign in" comes before the steps, and the page ends on the button
      again. One h2 style, `sectionHeading` centered, the footer leads with the legal
      links, one `<main>` in `app/layout.jsx`, and a link preview (`app/opengraph-image.jsx`)
- [x] `/sign-in` critique pass (2026-10-12): errors sit on the field or above the button,
      both "wrong password" and "already exists" name the Google route, each form has its
      own heading (focused on switch) and `?mode=`, a show-password eye replaces Confirm
      Password, and Google shows "Opening Google…". Sign-in goes straight to where the
      driver was headed; the membership prompt shows only for a non-member on `/history`

### User

I need to establish a way to authenticate users. We should have a way to link the driver on the jobs list and cover and on-call list, to the user of the app. Email address will link to the driver. Sometimes the user's name and email does not match exactly with the driver roster, so additional verification may be needed. Find a way to have the user claim their driver identity. This has to be verified by admin. A verification process like X does with the check mark or badge for verified users could be implemented. Eventually, I would like the cover bid weekly bidding process to be done on this app. The verified user logs in, sees what jobs are available and their pick time (call in time), and can take his bid when his time comes. We need to maintain anonymity, so other drivers can't see what bids have been made by whom, only admins. I'm thinking a cover page where users can see available bids without revealing who has made them. Once a job is picked it is grayed out but doesn't say who took it. On the cover page there will be the name of the user and his pick time. There can be a way to create a list of bids they want in order of preference. As the jobs are picked those jobs come off of the preferred list for each user. Once the users is on the clock their auto pick will be submitted and the next driver can pick. First thing will be building the cover page for all drivers. Upon entering page, am alert that only verified drivers can see that cover list. They can submit for verification by claiming their name and employee email (employee_id@ups.com) and seniority date. Admins will review and approve these claims to ensure the integrity of the verification process. Once verified, the user will have access to the cover bidding features. I don't want to hinder drivers from accessing the SLICs app if they are not interested in this. So, this has to be cover-specific. If a driver wants to participate in the covers feature, then he must be verified.

Plan, rules and open questions: `COVER-BIDDING.md`.

- [x] stage 1: driver verification and the drivers' Covers page (2026-10-10). Claims, the
      `/admin/driver-claims` queue, the check mark, `/covers` with the driver's own cover
      number and call-in time and the job list without names. Admin-only (`COVERS_OPEN`)
- [x] hide a cover job from drivers on `/admin/cover/jobs`, kept through sheet refreshes
      (`COVER-JOB-HIDING.md`; built 2026-10-12). Left: `npm run db:indexes` after the
      deploy, and the live checks in its "Verifying"
- [ ] roll stage 1 out to every driver (the checklist in `COVER-BIDDING.md`), including a
      "Verify you're a driver" guide on `/help`
- [x] stage 2: preference lists that lose jobs as they're picked, button with option to call dispatch
      (built 2026-10-12, admin-only with stage 1; `COVER-BIDDING.md`). Left: `npm run
      db:indexes` after the deploy, and its "Verifying stage 2" checks
- [ ] stage 3: picking in the app on the clock, with auto-pick. Settle the open questions
      first, starting with what the source of truth is once the app can't write the sheet
- [ ] drop `users.driverId`, the old roster link (nothing writes or reads it since 2026-10-10)
- [ ] fold `/cover-bid-jobs` into `/covers` once Covers rolls out

- [ ] ability to change profile image and share time they work and show phone number for those that need help. A page where drivers that need assistance can find and contact each other.

- [x] if a verified driver clicks the cover page but is not a cover or oncall driver then show a message saying the cover list is read only. They are not allowed to make any picks or setup preferred list. There should be a button that says if this is a mistake then send a message. This should send me a message that the driver is disputing his status as a cover or oncall driver.
      (built 2026-10-12, admin only with Covers; `COVER-BIDDING.md` stage 2, "Off the
      list is read only"). Left: `npm run db:indexes` after the deploy, and its "Verifying
      the read-only rule" checks

### Privacy and Terms page

- [x] remove Gemini from app now that we don't need it (2026-10-10; the privacy page no longer
      mentions it)

### Forum Page

- [ ] implement forum page for discussions among users

On hold (decided 2026-10-10). Places (`/places`, was `/whip-it-in-and-out`) launched to all
drivers on 2026-10-12; first see whether they use its comments (the check under Now → Places
launch). If they do, build a small board on the places comment code
(`lib/db/places.js`, `components/places/`): plain text, one-level threads, votes, maybe posts
that expire. Concerns: drivers post little now, there are no push notifications yet
(planned in `PUSH-NOTIFICATIONS.md`), and someone has to moderate.

### Push Notifications

Plan and checklist: `PUSH-NOTIFICATIONS.md`. Stage 1 live since 2026-10-11 (admins). Web push
from the web app: no App Store or Apple developer account. On iPhone it works only from the
home-screen app. A push-only service worker (no caching), registered only when someone turns
notifications on, so nobody else's device is touched.

- [x] stage 1: admin-only. Notify the admin of Jobs-tab changes and new SLIC reports (the
      toggle on `/profile`, `public/sw.js`, `push-subscriptions`, `lib/push.js`; 2026-10-10)
- [x] ship stage 1: set the three VAPID keys on Vercel, run `npm run db:indexes`, test on
      a phone (`PUSH-NOTIFICATIONS.md` → "Verifying")
- [x] stage 1b: each admin picks their kinds on `/profile`, with eight new kinds (cover
      jobs and picks, tips, claims, sign-ups, Places, SLIC edits, Buy Me a Coffee) and a
      90-day send log (2026-10-12). Ships with the hub, below
- [ ] label the first Buy Me a Coffee renewal's event type (`PUSH-NOTIFICATIONS.md` stage
      1b), and tick every event in BMC → Webhooks
- [ ] stage 2: drivers opt in to replies on their tips (and on places once that page launches)
- [ ] stage 3: "your pick is up" for cover bidding (waits on Features → User)

### Forgot Password

Plan and checklist: `PASSWORD-RESET.md` (planned 2026-10-11). 56 of 176 accounts use a
password, and none has a verified email, so it started without email.

- [x] stage 1: an admin makes a one-time reset link on `/admin/users` and texts it; the
      `/reset-password` page; a reset signs the account out everywhere (`sessionVersion`)
      (2026-10-11)
- [x] ship stage 1: `npm run db:indexes` (2026-10-12)
- [ ] make a link for a test account on the live site and check it on a phone
- [x] stage 2: change password on `/profile`, in Edit profile; a change signs every device
      out, and its tries count toward the sign-in limit (2026-10-12)
- [x] stage 3: reset by email, from `no-reply@slics.app` through Resend (2026-10-12)
- [x] ship stage 3: "Setting up Resend" in `PASSWORD-RESET.md` (2026-10-12)
- [ ] send a reset to a password account on the live site and open the link on a phone
      (the 2026-10-12 test went to a Google account)

### My Daily Log

Design notes and a staged plan: `RECOMMENDATIONS.md` → "1. My Daily Log".

- [ ] develop new feature to track daily route(s)
- [ ] user's job is pulled by the job list (Tiago Davila is on job BMEL)
- [ ] ask if that is true and save to backend (user { job: 'BMEL' })
- [ ] display user's job in history and ask if they want to log day based on job description for that day (Mon: BETPA>BURMD>GAIMD>EZRPA>ALLPA>BETPA)
- [ ] one click add for specific daily route. (e.g., a button that automatically fills in the day's route based on the job description Mon: BETPA>BURMD>GAIMD>EZRPA>ALLPA>BETPA)
- [ ] driver can adjust arrival and departure times for each leg of that day's job route (BETPA>BURMD dep: 18:50 arr: 22:05, BURMD>GAIMD dep: 22:15 arr: 23:45, GAIMD>EZRPA dep: 00:10 arr: 01:30, EZRPA>ALLPA dep: 01:50 arr: 03:20, ALLPA>BETPA dep: 03:40 arr: 05:00)

### Buy Me a Coffee

Plan and checklist: `BMC-SUPPORT.md` (design in `RECOMMENDATIONS.md` #2).

- [ ] fix the membership mismatches by hand in Users, or leave them (`BMC-SUPPORT.md` →
      "History import" has the list, re-checked 2026-10-10)
- [ ] when the first one-time coffee arrives by webhook, check its row (`BMC-SUPPORT.md` stage 1)
- [x] see them: the admin Supporters page (stage 2)
- [x] add load more button on recent list, too much scrolling (ten at a time, 2026-10-10)
- [x] the "what it takes" card: effort, not dollars: 200+ hours, the SLICs and PDFs (2026-10-10)
- [x] "Link to account" for support from an email with no account, and "Supporter since" on
      the profile (2026-10-10)
- [x] keep track of donations (when and how much): every webhook delivery is saved to
      `bmc-events` (stage 1, 2026-10-10). Run `npm run db:indexes` once for its unique index
- [x] thank you messages or acknowledgments for donations: a one-time notice on /home (stage 3, 2026-10-10)
- [x] don't want to beg for donations aggressively but want to imply the efforts and work put into the project and the significance of supporting it: the 30-day impact line on /about and the membership prompt (stage 4, 2026-10-10)
- [x] SuperAdmin role (manages admins, sees the BMC dashboard): built 2026-10-10. `/admin/super` with Admins (add, remove, activity) and Supporters; `superAdmin: true` on the user row, set only by `npm run admin:super`

### Admin Page

Design notes: `RECOMMENDATIONS.md` → "3. Cover drivers from the sheet".

- [x] available days of cover drivers: find where the sheet shows them, if anywhere (call-in
      times are done) This is not a feature
- [x] get rid of drivers page or populate it with data from Google Sheets (2026-10-10:
      `/admin/drivers` is the sheet's drivers, by seniority date, with the roster merged in;
      `lib/driverRoster.js`. Next: link the 20 suggested matches, add details for the new
      hires, and delete the roster rows of drivers who left)

### UI/UX Improvements

- [ ] pinned SLICs: a star on the details card; pinned SLICs lead the search list and the
      empty state. Start in localStorage (`archive/UI-SUGGESTIONS.md` #54)
- [ ] manifest shortcuts: "Look up a SLIC" and "My history" on a long-press of the
      home-screen icon (`app/manifest.js`, `archive/UI-SUGGESTIONS.md` #55)
- [ ] admin leftovers from the 2026-10-08 review (`archive/UI-SUGGESTIONS.md` #57):
  - [x] `/admin/users`: the lookup count and the member icon have no visible label
        (2026-10-11: a "Member"/"Non-member" toggle chip and "n lookups" at every width)
  - [x] Edit SLIC's "Back" button repeats the header's back arrow (2026-10-11: removed;
        new SLICs keep Clear)
  - [x] admin SLICs table: 5 rows a page (`SLICS_PER_PAGE`); search placeholder cut off at
        390px (2026-10-11: 25 a page, placeholder "Search SLICs")
  - [x] `/cover-bid-jobs` is "Cover Bid Jobs" on the page and "Cover Bids" in the header
        (2026-10-11: "Cover Bids" everywhere)
  - [ ] screenshot `/covers` with an account linked to a driver
  - [ ] check the 2026-10-11 fixes above on a phone, signed in as an admin, in both
        schemes (they couldn't be screenshotted without an admin session)
- [ ] **On Hold** decide on bottom navigation (left open in `archive/UI-SUGGESTIONS.md` #52). On hold
      (2026-10-10). A working prototype (Look up · History/Hubs · Profile · Menu, phones
      only) is on the local branch `bottom-nav-preview`. Open points: hide the header's
      hamburger on phones, drop the back arrow on tab pages, a stronger top edge in light mode

---

## Security

Detail and fixes in `SECURITY.md`; its "Status" table says what's left of each. In the
order that file suggests, minus what's done:

- [ ] **#1** history rewritten and force-pushed 2026-10-10. Left: the GitHub Support purge
      (old SHAs + `refs/pull/1/head`; ticket #4844294 open) and whether to tell the drivers
      on the roster
- [x] **#2** 2026-10-10: no comment is parsed as HTML, `html-react-parser` is gone, and the
      43 old HTML comments are stored as text
- [x] **#6** 2026-10-10: user serializers pick fields; `add-phone` and the toggles return only what changed
- [x] **#7** 2026-10-10: every admin page checks `getAdminSession()` before reading; `/bids`
      deleted; `/cover-bid-jobs` admins only for now
- [ ] **#12** step 1 done 2026-10-10 (CSP and the other headers in `next.config.mjs`). Left:
      check signed-in pages, Google sign-in and the installed iPhone app on the live site for
      blocked loads; then step 2, nonces instead of `'unsafe-inline'` scripts
- [ ] **#10** allowlist PATCH bodies (`updateSlic`; `drivers/[id]` done 2026-10-10; `cover/[position]` was deleted 2026-10-10)
- [ ] **#8** decide the access model (open / invite code / approval) and write it in the README
- [x] **#9** rate-limit password sign-in (2026-10-11: per email and per IP, constant-time for
      unknown emails). Left in #9: reset flow, admin second factor, breached-password check
- [ ] **#14** BMC webhook: `secretsMatch`, normalized email, idempotent events (pairs with the BMC feature above)
- [ ] **#20** dev database for local work and previews (`.env` points at production today)
- [x] quick ones (2026-10-11): **#19** caller found by id, not email · **#22** logging
      audit · **#23** no `error.message` in responses (`lib/httpError.js`) · **#26**
      `RequestAccess.jsx` deleted
- [ ] then Tier 2 (#15–#18, #21, #24, #27) in any order

---

## Housekeeping

- [ ] check the three SLIC numbers that are on two hubs in `allHubs`: 0269 (PRORI Warwick,
      YARMA W. Yarmouth), 7752 (BAYTX Baytown, FTW1 Dallas), 9079 (LGBAP Long Beach Airport,
      SNAAP Santa Ana). If one of each pair is wrong, fix the data; the lookup copes either
      way since 2026-10-10 (`&alpha=`), but both hubs share one set of tips
- [ ] lint for unused imports (`eslint.config.mjs`; `archive/STRUCTURE.md` #34)
- [ ] `package.json`: `"engines": { "node": ">=20.6" }`, a `"description"`, a version off
      `0.1.0`, and drop `@types/node` (`archive/STRUCTURE.md` #32, #35)
- [ ] README: fill in or remove `[Live demo link coming soon]`, add screenshots, refresh the
      usage numbers (`archive/STRUCTURE.md` #36)
- [x] `.env.example` named the old `extract` path: the line went with Gemini (2026-10-10)
- [x] `createDriver` (`lib/db/drivers.js`) refuses a new driver whose _seniority date_
      matches an existing one. Drivers hired in the same class share a date, so check only
      `employeeId` (2026-10-10: it checks only `employeeId`, which is now uniquely indexed)

---

## Done

### General Improvements

- [x] organize TODOS.md (2026-10-10: one live list; finished punch lists moved to `docs/archive/`)
- [x] disable MUI ripple
- [x] when a user comes back to the app, it is logging the lookup again. Fixed server-side instead of redirecting: `recordSlicView` skips a repeat of the latest lookup within 30 minutes, so the card is still there after Maps.

### UI/UX Improvements

- [x] the menu on mobile scrolled sideways: the Sign out row's `width: 100%` plus its margins
      overflowed the drawer by 12px (fixed 2026-10-10, `header/UserMenu.jsx`)
- [x] change dialogs, alerts, and other UI design to match neumorphic style and remove weird glow.

#### Neumorphic Design

- [x] use the new neumorphic design elements throughout the app
  - [x] apply neumorphic design to all buttons and interactive elements
  - [x] apply neumorphic design to all cards and containers
  - [x] apply neumorphic design to all input fields and forms
  - [x] apply neumorphic design to all modals and dialogs
  - [x] apply neumorphic design to all navigation elements (e.g., menus, tabs)
  - [x] apply neumorphic design to all typography elements (e.g., headings, paragraphs)
  - [x] about page
  - [x] cover-bid-jobs page
  - [x] privacy and terms pages
  - [x] membership page

### Admin Page

- [x] consider changing users search to url so navigating back preserves the search state
- [x] slics page
- [x] comments page
- [x] users page
- [x] cover drivers page
- [x] cover jobs page
- [x] drivers page
- [x] planet fitness page
- [x] the table when adding the cover bids from a photo is tough to use. The cells are so small I can't see what is written, the sun-sat cells should be times (date/time picker maybe), the description on the end is never big enough to see fully (I understand its limited, but maybe during the upload before we can have a button to open a dialog that the admin can verify each job thoroughly...) accuracy is very important. Consider adding a preview or expand option for each row to make it easier to review the details. Take advantage of the screen size when available. Also, take into mind the admin may have to adjust some entries on mobile, so accessing and manipulating the data on mobile (although a secondary issue) has to be considered and optimized.
- [x] cover weeks and the Jobs tab read straight from the ON CALL SHEET, with a change
      history, automatic sync and job-change alerts (2026-10-09/10, `ON-CALL-SHEET-SYNC.md`
      stages 1–3)
- [x] cover drivers page filled from the sheet: pick order 1–20 on the week's tab are cover,
      everyone after driver 20 is on call, each with their call-in time. The hand-edited
      list and its route are gone (2026-10-10, `lib/coverDrivers.js`, `RECOMMENDATIONS.md` #3)

### Whip It In and Whip It Out Page

- [x] can't unlike comment

### SLIC Lookup

- [x] "Something wrong with this SLIC?" reports, with an admin queue at `/admin/reports`
      (2026-10-10, `RECOMMENDATIONS.md` #5)
- [x] add ability for driver to add gps coordinates or pin to comment ("Add pin" in the tip and reply boxes and when editing, with or without text; "Pinned spot" opens it in the driver's maps app)
- [x] add ability to cycle through tips on empty state display (a "next tip" arrow; each visit starts at the tip after the last one seen)
- [x] add ability for driver to edit their own comments

### SLIC Comments

- [x] allow user's to reply to SLIC comments (one thread per comment)
- [x] consider removing tiptap and just using textfield or textarea

### Punch lists (archived 2026-10-10)

- [x] `archive/SUGGESTIONS.md`: security, performance and quality, all 22 items (closed 2026-10-07)
- [x] `archive/STRUCTURE.md`: files, folders and API naming (open items moved up to Housekeeping)
- [x] `archive/UI-SUGGESTIONS.md`: theme plumbing and the UI review (open items moved up to UI/UX)
