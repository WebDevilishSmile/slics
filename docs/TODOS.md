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

- [ ] set `CRON_SECRET` on Vercel (until then the daily cron route answers 500)
- [x] give the admin's superior a heads-up about the sheet notifier
- [ ] watch the first real Jobs-tab edit raise the `/admin` banner and menu badge, then
      clear when `/admin/jobs` opens
- [ ] one Refresh each (Jobs and a cover week) on the live site to confirm the deployment

### After a trial period

- [ ] **on or after 2026-10-22:** delete the 13 old-path API alias files
      (`grep -rln "Old path, renamed on 2026-10-08" app/api`) and their mention in
      `CLAUDE.md` → "API routes" (`archive/STRUCTURE.md` #29 follow-up)
- [ ] **once the sheet has run for a few weeks:** stage 4 cleanup. Delete the bid-sheet photo
      upload, the `extract` route, `@google/genai` and `GEMINI_API_KEY`
      (`ON-CALL-SHEET-SYNC.md` → "Stage 4")
- [ ] **once the sheet's cover list has proven itself:** drop the unused `cover` collection
      (its code went 2026-10-10; the rows are kept until then in case the old list is wanted)
- [ ] **when every SLIC has `pdfUrl`:** retire the Supabase bucket and the `slic.pdf`
      fallback (`CLAUDE.md` → "External integrations"; also closes part of `SECURITY.md` #13)

---

## Features

### Forum Page

- [ ] implement forum page for discussions among users

### My Daily Log

Design notes and a staged plan: `RECOMMENDATIONS.md` → "1. My Daily Log".

- [ ] develop new feature to track daily route(s)
- [ ] make it more of a daily log
- [ ] user's job is pulled by the job list (Tiago Davila is on job BMEL)
- [ ] ask if that is true and save to backend (user { job: 'BMEL' })
- [ ] display user's job in history and ask if they want to log day based on job description for that day (Mon: BETPA>BURMD>GAIMD>EZRPA>ALLPA>BETPA)
- [ ] one click add for specific daily route. (e.g., a button that automatically fills in the day's route based on the job description Mon: BETPA>BURMD>GAIMD>EZRPA>ALLPA>BETPA)
- [ ] driver can adjust arrival and departure times for each leg of that day's job route (BETPA>BURMD dep: 18:50 arr: 22:05, BURMD>GAIMD dep: 22:15 arr: 23:45, GAIMD>EZRPA dep: 00:10 arr: 01:30, EZRPA>ALLPA dep: 01:50 arr: 03:20, ALLPA>BETPA dep: 03:40 arr: 05:00)

### Buy Me a Coffee

Design notes: `RECOMMENDATIONS.md` → "2. Buy Me a Coffee".

- [ ] keep track of donations (When and how much) (Right now it just sees who becomes or is a member)
- [ ] thank you messages or acknowledgments for donations
- [ ] don't want to beg for donations aggressively but want to imply the efforts and work put into the project and the significance of supporting it

### Admin Page

Design notes: `RECOMMENDATIONS.md` → "3. Cover drivers from the sheet".

- [ ] available days of cover drivers: find where the sheet shows them, if anywhere (call-in
      times are done)

### UI/UX Improvements

- [ ] the menu on mobile scrolls horizontally (i dont like it)
- [ ] pinned SLICs: a star on the details card; pinned SLICs lead the search list and the
      empty state. Start in localStorage (`archive/UI-SUGGESTIONS.md` #54)
- [ ] manifest shortcuts: "Look up a SLIC" and "My history" on a long-press of the
      home-screen icon (`app/manifest.js`, `archive/UI-SUGGESTIONS.md` #55)
- [ ] decide on bottom navigation (left open in `archive/UI-SUGGESTIONS.md` #52)
- [ ] admin leftovers from the 2026-10-08 review (`archive/UI-SUGGESTIONS.md` #57):
  - [ ] `/admin/users`: the lookup count and the member icon have no visible label
  - [ ] Edit SLIC's "Back" button repeats the header's back arrow
  - [ ] admin SLICs table: 5 rows a page (`SLICS_PER_PAGE`); search placeholder cut off at 390px
  - [ ] `/cover-bid-jobs` is "Cover Bid Jobs" on the page and "Cover Bids" in the header
  - [ ] screenshot `/covers` with an account linked to a driver

---

## Security

Detail and fixes in `SECURITY.md`; its "Status" table says what's left of each. In the
order that file suggests, minus what's done:

- [ ] **#1** history rewritten and force-pushed 2026-10-10. Left: the GitHub Support purge
      (old SHAs + `refs/pull/1/head`; ticket #4844294 open) and whether to tell the drivers
      on the roster
- [ ] **#2** convert the old HTML comments to plain text (dry-run script), then drop `html-react-parser`
- [ ] **#6** user serializers pick fields instead of spreading; `add-phone` stops returning and logging the whole user
- [ ] **#7** admin pages check admin themselves with `getSession()` (not only the layout); `/bids` checks the session
- [ ] **#12** security headers in `next.config.mjs` (step 1 is safe to ship on its own)
- [ ] **#10** allowlist PATCH bodies (`drivers/[id]`, `updateSlic`; `cover/[position]` was deleted 2026-10-10)
- [ ] **#8** decide the access model (open / invite code / approval) and write it in the README
- [ ] **#9** rate-limit password sign-in
- [ ] **#14** BMC webhook: `secretsMatch`, normalized email, idempotent events (pairs with the BMC feature above)
- [ ] **#20** dev database for local work and previews (`.env` points at production today)
- [ ] quick ones: **#19** toggle-role self/last-admin guard · **#22** stop logging emails and
      user documents · **#23** no `error.message` in responses · **#26** delete
      `RequestAccess.jsx` (it holds a personal phone number) · **#30** `poweredByHeader: false`
- [ ] then Tier 2 (#15–#18, #21, #24, #27) in any order

---

## Housekeeping

- [ ] lint for unused imports (`eslint.config.mjs`; `archive/STRUCTURE.md` #34)
- [ ] `package.json`: `"engines": { "node": ">=20.6" }`, a `"description"`, a version off
      `0.1.0`, and drop `@types/node` (`archive/STRUCTURE.md` #32, #35)
- [ ] README: fill in or remove `[Live demo link coming soon]`, add screenshots, refresh the
      usage numbers (`archive/STRUCTURE.md` #36)
- [ ] `.env.example` names the old `app/api/coverBidJobs/extract` path; it's
      `cover-bid-jobs/extract` now (or delete the line in stage 4)
- [ ] `createDriver` (`lib/db/drivers.js`) refuses a new driver whose _seniority date_
      matches an existing one. Drivers hired in the same class share a date, so check only
      `employeeId`

---

## Done

### General Improvements

- [x] organize TODOS.md (2026-10-10: one live list; finished punch lists moved to `docs/archive/`)
- [x] disable MUI ripple
- [x] when a user comes back to the app, it is logging the lookup again. Fixed server-side instead of redirecting: `recordSlicView` skips a repeat of the latest lookup within 30 minutes, so the card is still there after Maps.

### UI/UX Improvements

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
