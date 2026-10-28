# DONE.md

> Everything checked off in `TODOS.md`, moved here so the hub stays short (started
> 2026-10-14, when `TODOS.md` became Inbox → Now → Waiting → Next → Ideas). Items keep
> their wording and dates. What shipped in detail is in each feature's plan doc. Add new
> entries at the top of their area, and add an area when there isn't one.

---

## On-call sheet sync (`ON-CALL-SHEET-SYNC.md`)

- [x] cover weeks and the Jobs tab read straight from the ON CALL SHEET, with a change
      history, automatic sync and job-change alerts (2026-10-09/10, stages 1–3)
- [x] set `CRON_SECRET` on Vercel (until then the daily cron route answers 500)
- [x] give the admin's superior a heads-up about the sheet notifier
- [x] watch the first real Jobs-tab edit raise the `/admin` banner and menu badge, then
      clear when `/admin/jobs` opens
- [x] ~~stage 4 cleanup~~: the bid-sheet photo upload, the `extract` route, `@google/genai`
      and `GEMINI_API_KEY` were deleted 2026-10-10 ("Stage 4"). The key's removal from
      Vercel and Google AI Studio is in `TODOS.md` → Housekeeping

## Super admin hub (`SUPER-ADMIN-HUB.md`)

- [x] stages A–F built 2026-10-12: notification choices, the hub with numbers and usage,
      notifications, activity, system health and feature switches
- [x] ship it: run `npm run db:indexes`, restart `next dev` (new `@mui/x-charts`), and go
      through "Verifying" as the super admin on a phone (2026-10-14)
- [x] SuperAdmin role (manages admins, sees the BMC dashboard): built 2026-10-10.
      `/admin/super` with Admins (add, remove, activity) and Supporters; `superAdmin: true`
      on the user row, set only by `npm run admin:super`

## Places (`CLAUDE.md` → Data layer → Places)

- [x] renamed from Whip It In & Out to Places at `/places` (the old path redirects), opened
      to every driver, and announced in the menu ("New" until `PLACES_NEW_UNTIL`), an
      empty-state tip on /home, the landing page and a `/help` section (2026-10-12)
- [x] can't unlike comment (Whip It In and Whip It Out page)

## SLIC lookup

- [x] "Something wrong with this SLIC?" reports, with an admin queue at `/admin/reports`
      (2026-10-10, `RECOMMENDATIONS.md` #5)
- [x] send a test report from a phone, then Fix it from `/admin/reports` and check the
      banner, the menu badge and the SLIC's history
- [x] `npm run db:indexes` for the two `slic-reports` indexes
- [x] add ability for driver to add gps coordinates or pin to comment ("Add pin" in the tip
      and reply boxes and when editing, with or without text; "Pinned spot" opens it in the
      driver's maps app)
- [x] add ability to cycle through tips on empty state display (a "next tip" arrow; each
      visit starts at the tip after the last one seen)
- [x] add ability for driver to edit their own comments
- [x] when a user comes back to the app, it is logging the lookup again. Fixed server-side
      instead of redirecting: `recordSlicView` skips a repeat of the latest lookup within 30
      minutes, so the card is still there after Maps.

## SLIC comments

- [x] allow user's to reply to SLIC comments (one thread per comment)
- [x] consider removing tiptap and just using textfield or textarea

## Covers (`COVER-BIDDING.md`)

The original ask is quoted in `COVER-BIDDING.md` → "Why".

- [x] stage 1: driver verification and the drivers' Covers page (2026-10-10). Claims, the
      `/admin/driver-claims` queue, the check mark, `/covers` with the driver's own cover
      number and call-in time and the job list without names. Admin-only (`COVERS_OPEN`)
- [x] hide a cover job from drivers on `/admin/cover/jobs`, kept through sheet refreshes
      (`COVER-JOB-HIDING.md`; built 2026-10-12). Its index and live checks are in
      `TODOS.md` → Now
- [x] stage 2: preference lists that lose jobs as they're picked, button with option to
      call dispatch (built 2026-10-12, admin-only with stage 1). Its index and live checks
      are in `TODOS.md` → Now
- [x] fold `/cover-bid-jobs` into `/covers` once Covers rolls out (2026-10-12, early: it was
      an admin-only copy of the job list, and admins have `/covers` now. The page is gone,
      with its menu row; the path redirects to `/covers`, temporarily)
- [x] if a verified driver clicks the cover page but is not a cover or oncall driver then
      show a message saying the cover list is read only. They are not allowed to make any
      picks or setup preferred list. There should be a button that says if this is a
      mistake then send a message. This should send me a message that the driver is
      disputing his status as a cover or oncall driver.
      (built 2026-10-12, admin only with Covers; stage 2, "Off the list is read only")
- [x] on cover page, where it says the cover list is read only, include the driver's
      current job code. For example, "The cover list is read only. Your current job code is
      BMEL." (2026-10-12: the job the Jobs tab names them on, `getDriverJobName` in
      `lib/db/sheetJobs.js`; left out when they hold none. A dispute keeps it for the admin)

## Push notifications (`PUSH-NOTIFICATIONS.md`)

- [x] stage 3: verified drivers who can use Covers turn notifications on, and get call-in
      reminders on bid day (15 min, 30 min, 1 hr, 2 hr before), their list's jobs taken,
      their call-in time and the week's cover jobs; the super admin sees `/covers` as a
      cover driver with placeholder times (built 2026-10-22; its live checks are in
      `TODOS.md` → Now)
- [x] Find a way to filter the notifications so that the change in bid times that causes a
      cascade could be ignored. If driver 27 is changed to 28, then every driver after has
      to be adjusted that 20+ notifications of driver time changes. Maybe we can group them
      once one is changed, so that only a single notification is sent for the cascade
      rather than one per driver. (Inbox, 2026-10-22: no push goes out when a time changes.
      Reminders read the time when they're due, and the call-in notice waits until the
      week's places have been quiet 30 minutes, then each driver whose time changed gets
      one, with the final time. Stage 3, "The renumbering cascade")
- [x] This Vercel limitation may turn out to be a pain in the ass. Right now, we only have
      drivers looking up addresses but if 20+ drivers start using the cover job features
      simultaneously, the server might hit its CPU limits, causing delays or failures in
      session handling and other server-side operations. (Inbox, 2026-10-22: the team is on
      Vercel Pro, checked 2026-10-22, which the every-minute Covers cron needs anyway.
      Watch Usage when Covers opens to every driver)
- [x] stage 1: admin-only. Notify the admin of Jobs-tab changes and new SLIC reports (the
      toggle on `/profile`, `public/sw.js`, `push-subscriptions`, `lib/push.js`; 2026-10-10)
- [x] ship stage 1: set the three VAPID keys on Vercel, run `npm run db:indexes`, test on
      a phone ("Verifying")
- [x] stage 1b: each admin picks their kinds on `/profile`, with eight new kinds (cover
      jobs and picks, tips, claims, sign-ups, Places, SLIC edits, Buy Me a Coffee) and a
      90-day send log (2026-10-12). Ships with the hub
- [x] label the first Buy Me a Coffee renewal's event type (stage 1b):
      `membership.updated` (2026-10-14), which also carries a failed charge, so the app now
      tells them apart (`BMC-SUPPORT.md`, "Renewals")

## Forgot password (`PASSWORD-RESET.md`)

56 of 176 accounts use a password, and none has a verified email, so it started without
email.

- [x] stage 1: an admin makes a one-time reset link on `/admin/users` and texts it; the
      `/reset-password` page; a reset signs the account out everywhere (`sessionVersion`)
      (2026-10-11)
- [x] ship stage 1: `npm run db:indexes` (2026-10-12)
- [x] stage 2: change password on `/profile`, in Edit profile; a change signs every device
      out, and its tries count toward the sign-in limit (2026-10-12)
- [x] stage 3: reset by email, from `no-reply@slics.app` through Resend (2026-10-12)
- [x] ship stage 3: "Setting up Resend" in `PASSWORD-RESET.md` (2026-10-12)

## Buy Me a Coffee (`BMC-SUPPORT.md`)

- [x] see them: the admin Supporters page (stage 2)
- [x] add load more button on recent list, too much scrolling (ten at a time, 2026-10-10)
- [x] the "what it takes" card: effort, not dollars: 200+ hours, the SLICs and PDFs
      (2026-10-10)
- [x] "Link to account" for support from an email with no account, and "Supporter since" on
      the profile (2026-10-10)
- [x] keep track of donations (when and how much): every webhook delivery is saved to
      `bmc-events` (stage 1, 2026-10-10). Run `npm run db:indexes` once for its unique index
- [x] thank you messages or acknowledgments for donations: a one-time notice on /home
      (stage 3, 2026-10-10)
- [x] don't want to beg for donations aggressively but want to imply the efforts and work
      put into the project and the significance of supporting it: the 30-day impact line on
      /about and the membership prompt (stage 4, 2026-10-10)

## Delete account

The app should provide a way for users to delete their accounts.

- [x] self-service delete (2026-09-20; re-checked 2026-10-12): `/profile` → Edit profile →
      Delete account (`profile/DeleteAccountDialog.jsx`, type `DELETE` to confirm, then
      signed out). `DELETE /api/users/[id]` takes only the caller's own id and refuses
      admins; `deleteUserAccount` (`lib/db/users.js`) covers every user-linked collection in
      `DATA-MODEL.md`: tips, votes, places data, gym comments, lookups, Google links, claims,
      push devices and reset links go; SLIC reports and BMC events stay, unlinked

## Landing page

The landing page should introduce SLICs and its purpose for UPS Feeder drivers. It should
provide a clear call-to-action for signing in and accessing the app's features. Consider
including an overview of the app's capabilities, such as looking up SLIC codes, viewing
driver tips, and accessing cover bidding for verified users. The design should be clean and
informative, guiding new users to understand the app's value and how to get started. The
sign in process should be in the /sign-in page.

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

## Privacy and terms

- [x] remove Gemini from app now that we don't need it (2026-10-10; the privacy page no
      longer mentions it)

## Admin pages

- [x] available days of cover drivers: find where the sheet shows them, if anywhere
      (call-in times are done) This is not a feature
- [x] get rid of drivers page or populate it with data from Google Sheets (2026-10-10:
      `/admin/drivers` is the sheet's drivers, by seniority date, with the roster merged in;
      `lib/driverRoster.js`. The data chores it left are in `TODOS.md` → Housekeeping)
- [x] cover drivers page filled from the sheet: pick order 1–20 on the week's tab are
      cover, everyone after driver 20 is on call, each with their call-in time. The
      hand-edited list and its route are gone (2026-10-10, `lib/coverDrivers.js`,
      `RECOMMENDATIONS.md` #3)
- [x] consider changing users search to url so navigating back preserves the search state
- [x] slics page
- [x] comments page
- [x] users page
- [x] cover drivers page
- [x] cover jobs page
- [x] drivers page
- [x] planet fitness page
- [x] the table when adding the cover bids from a photo is tough to use. The cells are so
      small I can't see what is written, the sun-sat cells should be times (date/time
      picker maybe), the description on the end is never big enough to see fully (I
      understand its limited, but maybe during the upload before we can have a button to
      open a dialog that the admin can verify each job thoroughly...) accuracy is very
      important. Consider adding a preview or expand option for each row to make it easier
      to review the details. Take advantage of the screen size when available. Also, take
      into mind the admin may have to adjust some entries on mobile, so accessing and
      manipulating the data on mobile (although a secondary issue) has to be considered and
      optimized.

## UI/UX

- [x] `/about` isn't in the middleware's `publicPaths`, but the signed-out menu links to it,
      so a signed-out tap bounces to `/sign-in` (seen 2026-10-15 tracing CPU). Make it
      public, or hide the row signed out? (2026-10-22: made public. It shows who made the
      app and two cached totals, nothing about anyone)
- [x] The names of drivers should be uniformly capitalized. Some names are all upper case,
      some are all lower case, and some are properly capitalized. Standardize them to be
      consistently capitalized first letter. (Inbox, 2026-10-22: shown through
      `displayName`, `lib/names.js`, everywhere a person's name is shown: account names
      ("jane doe" → "Jane Doe"; 21 of 194 changed) and the sheet's capitals ("DOE, JANE"
      → "Doe, Jane"). A name typed in both cases ("McDonald") is kept; stored names don't
      change)
- [x] admin leftovers from the 2026-10-08 review (`archive/UI-SUGGESTIONS.md` #57). The
      phone check of these is in `TODOS.md` → Now:
  - [x] `/admin/users`: the lookup count and the member icon have no visible label
        (2026-10-11: a "Member"/"Non-member" toggle chip and "n lookups" at every width)
  - [x] Edit SLIC's "Back" button repeats the header's back arrow (2026-10-11: removed;
        new SLICs keep Clear)
  - [x] admin SLICs table: 5 rows a page (`SLICS_PER_PAGE`); search placeholder cut off at
        390px (2026-10-11: 25 a page, placeholder "Search SLICs")
  - [x] `/cover-bid-jobs` is "Cover Bid Jobs" on the page and "Cover Bids" in the header
        (2026-10-11: "Cover Bids" everywhere)
- [x] the menu on mobile scrolled sideways: the Sign out row's `width: 100%` plus its
      margins overflowed the drawer by 12px (fixed 2026-10-10, `header/UserMenu.jsx`)
- [x] change dialogs, alerts, and other UI design to match neumorphic style and remove
      weird glow.
- [x] disable MUI ripple
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

## Security (`SECURITY.md`)

- [x] **#9** left: Google-only or a second factor for admins, the breached-password check,
      and the register route's 409. Decided 2026-10-28: staff sign-in stays as it is (all
      8 staff use Google, no password); no breached-password check; the 409 stays on
      purpose (`SECURITY.md` #9 says why)
- [x] **#8** decide the access model (open / invite code / approval) and write it in the
      README. 2026-10-28: open, written in the README, privacy and terms; sign-up emails a
      link that confirms a password account's address; a Google sign-in links to an
      account with the same email, removing a password nobody confirmed; sign-up hardened
- [x] **#14** the webhook's `emailVerified`: a membership needs a confirmed email
      (2026-10-28, with #8)
- [x] **#2** 2026-10-10: no comment is parsed as HTML, `html-react-parser` is gone, and the
      43 old HTML comments are stored as text
- [x] **#6** 2026-10-10: user serializers pick fields; `add-phone` and the toggles return
      only what changed
- [x] **#7** 2026-10-10: every admin page checks `getAdminSession()` before reading;
      `/bids` deleted; `/cover-bid-jobs` admins only for now
- [x] **#9** rate-limit password sign-in (2026-10-11: per email and per IP, constant-time
      for unknown emails). What's left of #9 is in `TODOS.md` → Security
- [x] quick ones (2026-10-11): **#19** caller found by id, not email · **#22** logging
      audit · **#23** no `error.message` in responses (`lib/httpError.js`) · **#26**
      `RequestAccess.jsx` deleted

## Housekeeping

- [x] organize TODOS.md (2026-10-10: one live list; finished punch lists moved to
      `docs/archive/`)
- [x] `.env.example` named the old `extract` path: the line went with Gemini (2026-10-10)
- [x] `createDriver` (`lib/db/drivers.js`) refuses a new driver whose _seniority date_
      matches an existing one. Drivers hired in the same class share a date, so check only
      `employeeId` (2026-10-10: it checks only `employeeId`, which is now uniquely indexed)

## Punch lists (archived 2026-10-10)

- [x] `archive/SUGGESTIONS.md`: security, performance and quality, all 22 items (closed
      2026-10-07)
- [x] `archive/STRUCTURE.md`: files, folders and API naming (open items moved to
      `TODOS.md` → Housekeeping)
- [x] `archive/UI-SUGGESTIONS.md`: theme plumbing and the UI review (open items moved to
      `TODOS.md`)
