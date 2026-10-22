# TODOs

The hub: everything to do, and every idea worth keeping. This file says **what** and
**when**, one line per item. The other docs say **how**: a plan doc per feature, the
references (`DATA-MODEL.md`, `OPERATIONS.md`, `SECURITY.md`), and design notes for ideas
(`RECOMMENDATIONS.md`). Each line links to the doc with the detail.

**How an item moves:** Inbox → Ideas → Next → Now → Done.

- **Inbox:** anything, in any wording, added from anywhere. It gets sorted into the
  sections below the next time we plan.
- **Ideas:** worth keeping, not committed. Write as much as you like; a sketch of how to
  build it can go in `RECOMMENDATIONS.md`.
- **Next:** decided, not started. A staged feature gets a plan doc (`README.md` →
  "Conventions"), its notes move there, and it keeps one line here.
- **Now:** being built, or built and waiting on a check on the live site.
- **Waiting:** open, but not before a date or a condition.
- **Done:** checked off where it is, then moved to `archive/DONE.md`.

Use absolute dates.

---

## Inbox

<!-- Add anything here, any wording. -->

- Changing your password (or a reset) signs you out everywhere, but the account's
  `push-subscriptions` rows stay, so a device signed out that way keeps getting its
  pushes until someone signs in on it. Delete them where `sessionVersion` is bumped?
  (found 2026-10-14 building Push stage 2, `PUSH-NOTIFICATIONS.md` → 2.4)

---

## Now

- [ ] **Covers notifications** (built 2026-10-22, not deployed): deploy (the cron needs
      Vercel Pro, which the team is on), run `npm run db:indexes` (`cover-bid-days`,
      `cover-notices`), then "Verifying stage 3" (`PUSH-NOTIFICATIONS.md`): the samples on
      phones, the super admin's `/covers?preview=driver`, a verified driver's reminder on
      the next bid Thursday, and moving a bid day and back
- [ ] **Sheet sync:** one Refresh each (Jobs and a cover week) on the live site to confirm
      the deployment (`ON-CALL-SHEET-SYNC.md`)
- [ ] **Cover-week alerts** (built 2026-10-14): after the deploy, run `npm run db:indexes`
      (`cover-job-changes.seenAt`), then watch the first real cover-tab edit raise the
      `/admin` banner, the menu badge and the push, and clear when `/admin/cover/jobs`
      opens. `push-log` should show every device sent, iPhones included (the `Topic` fix).
      (`ON-CALL-SHEET-SYNC.md` → "Alerts for cover weeks")
  - As of 2026-10-14 `sheet-job-changes` is still empty: the Jobs tab hasn't changed since
    its 10/09 baseline, so no Jobs-tab alert has fired in production yet either
- [ ] **Covers:** after the deploy, `npm run db:indexes` and the live checks for job hiding
      (`COVER-JOB-HIDING.md` → "Verifying"), cover lists (`COVER-BIDDING.md` → "Verifying
      stage 2") and the read-only rule (`COVER-BIDDING.md` → "Verifying the read-only
      rule")
- [ ] **Cover jobs, automatic hides** (built 2026-10-14): press Refresh for W/E 10/24 on
      `/admin/cover/jobs`. SH16, WA03, WA09 and SH12 should read "Hidden in sheet", the ER
      jobs "Sleeper job", each with its eye disabled, and SH13 should show once. None of
      them should be on `/covers` (`COVER-JOB-HIDING.md` → "Automatic hides")
- [ ] **Covers:** screenshot `/covers` with an account linked to a driver
      (`archive/UI-SUGGESTIONS.md` #57)
- [ ] **Admin fixes from 2026-10-11:** check them on a phone, signed in as an admin, in
      both schemes (`archive/DONE.md` → UI/UX; they couldn't be screen-shotted without an
      admin session)
- [ ] **Places:** check on a phone as a non-admin driver: the Places row under All Hubs,
      adding a place, a comment, and an old `/whip-it-in-and-out` bookmark landing on
      `/places`
- [ ] **Password reset:** make a link for a test account on the live site and check it on
      a phone (`PASSWORD-RESET.md` → "Verifying")
- [ ] **Password reset:** send a reset to a password account on the live site and open the
      link on a phone (the 2026-10-12 test went to a Google account)
- [ ] **Profile, This week** (built 2026-10-14): on a phone, signed in as a verified admin,
      check the card against the sheet for this week and next, tap a stop to open its
      SLIC, open the folded "Your job" on a cover week, in both schemes
      (`COVER-BIDDING.md` → "This week on the profile")
- [ ] **Push stage 2** (built and deployed 2026-10-14, switch off): run "Verifying stage
      2" on phones (`PUSH-NOTIFICATIONS.md`): as an admin, a second account's reply gives
      exactly one push; sign-out empties `push-subscriptions` for that device, offline too;
      then turn on "Notifications for every driver" on `/admin/super/features` and check
      it as a driver (desktop Chrome, Android, the iPhone home-screen app)
- [ ] **Buy Me a Coffee:** tick every event in BMC → Webhooks (monthly support's renewals
      would be `recurring_donation.updated`), and watch what BMC sends when a failed
      renewal's retry goes through (`BMC-SUPPORT.md` → "Renewals")
- [ ] **Buy Me a Coffee:** fix the membership mismatches by hand in Users, or leave them
      (`BMC-SUPPORT.md` → "History import" has the list, re-checked 2026-10-10)
- [ ] **Staff roles** (built 2026-10-16): after the deploy, the live checks in
      `STAFF-ROLES.md` → "Verifying": every admin tool still on `/admin` and the switches
      on `/admin/super/admins`; then `claude-test@slics.app` made Dispatch sees only SLICs
      (`/dispatch`, "No access" elsewhere, 403s) and gets the welcome note once on `/home`,
      and is set back to User

---

## Waiting

- [ ] **On or after 2026-10-17:** compare Vercel → Observability → Functions (last 12
  hours) with 2026-10-15's, before the CPU fixes: ~2.6K calls, ~4 min of Active CPU (about
  Hobby's 4 CPU-hours a month); `/home` 231 calls / 58s, `/` 130 / 36s, the auth route
  489 / 31s, `/help` 155 / 11s, the 404 page 61 / 11s, `/sign-in` 101 / 10s,
  `/api/users/me/views` 99 / 10s. Still close? Static public pages (Ideas → Platform)
  or Pro. A cold `/home` went from 14 calls to 2 for an admin, 1 for a driver.
- [ ] **On or after 2026-10-21** (a week after it shipped): does the super admin hub
      replace checking the Vercel and Atlas dashboards day to day, and is anything missing
      from it? (`SUPER-ADMIN-HUB.md`)
- [ ] **On or after 2026-10-22:** delete the 13 old-path API alias files
      (`grep -rln "Old path, renamed on 2026-10-08" app/api`) and their mention in
      `CLAUDE.md` → "API routes" (`archive/STRUCTURE.md` #29 follow-up)
- [ ] **On or after 2026-11-12:** count the places and `placeComments` added since
      2026-10-12 and the `/places` pageviews in Vercel Analytics, then decide the forum
      (Ideas → Forum)
- [ ] **On or after 2026-11-12:** make the `/whip-it-in-and-out` redirect `permanent: true`
      (`next.config.mjs`), and remove `PLACES_NEW_UNTIL` and its check in
      `header/UserMenu.jsx`
- [ ] **When the first one-time coffee arrives by webhook:** check its row
      (`BMC-SUPPORT.md` stage 1)
- [ ] **When every SLIC has `pdfUrl`:** retire the Supabase bucket and the `slic.pdf`
      fallback (`CLAUDE.md` → "External integrations"; also closes part of `SECURITY.md`
      #13)

### Old data to drop

The system health page counts the two collections (`lib/systemHealth.js`).

- [ ] the `cover` collection, **once the sheet's cover list has proven itself** (its code
      went 2026-10-10; the rows are kept until then in case the old list is wanted)
- [ ] the `bid-jobs` collection, **when sure nobody wants the old list** (`/bids`, its only
      reader, was deleted 2026-10-10 with `SECURITY.md` #7)
- [ ] `users.driverId`, the old roster link (nothing writes or reads it since 2026-10-10;
      `COVER-BIDDING.md` → "Data")

---

## Next

- [ ] **Covers for every driver:** roll stage 1 out (`COVER-BIDDING.md` → "Rolling stage
      1 out to every driver"), including a "Verify you're a driver" guide on `/help`
- [ ] **Covers stage 3:** picking in the app on the clock, with auto-pick. Settle the open
      questions first, starting with what the source of truth is once the app can't write
      the sheet (`COVER-BIDDING.md` → "Stage 3")
- [ ] **Push stage 3:** "your pick is up" for cover bidding (`PUSH-NOTIFICATIONS.md` →
      "Stage 3"; waits on Covers stage 3)

---

## Ideas

Not committed. The numbers are `RECOMMENDATIONS.md` items, where the design notes are.
Effort: S = an evening or two · M = a few evenings · L = a project with stages.

### For drivers

- **Drivers helping drivers.** Ability to change profile image and share time they work
  and show phone number for those that need help. A page where drivers that need
  assistance can find and contact each other. A driver can choose a schedule (mon: 18:30 -
  tues: 05:00) that they are available for assistance. Any driver can call with questions
  about where they are going and the driver will try to help.
- **My Daily Log** (L, #1). Track the day's route from your job. Your notes:
  - develop new feature to track daily route(s)
  - user's job is pulled by the job list (Tiago Davila is on job BMEL)
  - ask if that is true and save to backend (user { job: 'BMEL' })
  - display user's job in history and ask if they want to log day based on job
    description for that day (Mon: BETPA>BURMD>GAIMD>EZRPA>ALLPA>BETPA)
  - one click add for specific daily route. (e.g., a button that automatically fills in
    the day's route based on the job description Mon: BETPA>BURMD>GAIMD>EZRPA>ALLPA>BETPA)
  - driver can adjust arrival and departure times for each leg of that day's job route
    (BETPA>BURMD dep: 18:50 arr: 22:05, BURMD>GAIMD dep: 22:15 arr: 23:45, GAIMD>EZRPA
    dep: 00:10 arr: 01:30, EZRPA>ALLPA dep: 01:50 arr: 03:20, ALLPA>BETPA dep: 03:40 arr:
    05:00)
- **Forum page** for discussions among users. **On hold** (decided 2026-10-10) until the
  Places count on 2026-11-12 (Waiting): first see whether drivers use the Places comments.
  If they do, build a small board on the places comment code (`lib/db/places.js`,
  `components/places/`): plain text, one-level threads, votes, maybe posts that expire.
  Concerns: drivers post little now, push notifications for drivers are built but not
  switched on yet (Now → Push stage 2), and someone has to moderate.
- **Pinned SLICs** (S, #8): a star on the details card; pinned SLICs lead the search list
  and the empty state. Start in localStorage (`archive/UI-SUGGESTIONS.md` #54). With the
  daily log, a confirmed job could pin its route's SLICs.
- **Home-screen shortcuts** (S): "Look up a SLIC" and "My history" on a long-press of the
  home-screen icon (`app/manifest.js`, `archive/UI-SUGGESTIONS.md` #55)
- **Bottom navigation.** **On hold** (2026-10-10; left open in
  `archive/UI-SUGGESTIONS.md` #52). A working prototype (Look up · History/Hubs · Profile ·
  Menu, phones only) is on the local branch `bottom-nav-preview`. Open points: hide the
  header's hamburger on phones, drop the back arrow on tab pages, a stronger top edge in
  light mode
- **Safety notes at the top of the card** (S–M, #6): low bridges, no-truck roads and a
  closed dock, above the fold instead of in a thread
- **Tip freshness** (S, #7): a tip's age, and "Still right?" after 6 months
- **Share a SLIC** (S, #9): `navigator.share` with the `/home/<slic>` link
- **"What's new" after a release** (S, #10): a one-time sheet with two or three lines
- **Faster cards on a weak signal** (S, #11): keep the last lookups' address and phone on
  the device

### For the admin

- **A data-health page** (S, #12): SLICs with no PDF or phone, stale ones, duplicates
- **An admin audit log page** (S, #14): who changed what, on one page. `admin_audit` and
  the super admin's Activity page cover part of it; the rest is `SECURITY.md` #17
- **Notifications for dispatchers** (`STAFF-ROLES.md` → "Follow-ups"): `canUsePush` and
  the admin push kinds still go by the admin role, so a dispatcher with SLIC reports gets
  no reports push
- **Per-person tool exceptions** (`STAFF-ROLES.md`): tools are per role today; add
  overrides on an account if one dispatcher ever needs a tool the others don't
- **Leaving as a dispatcher** (`STAFF-ROLES.md`): only admins are refused self-service
  account deletion; decide whether a dispatcher should need a super admin too

### Platform

- **A small test suite** (M, #16): the sheet parsers and the route auth test
- **CI on GitHub Actions** (S, #17): build and lint on every push
- **Schemas at the API boundary** (M, #18): zod per collection (`SECURITY.md` #10–#11)
- **Next 16** (M, #19): clears the last audit findings (`SECURITY.md` #3)
- **Error alerts** (S, #20): a 500 on a driver's phone reaches you first
- **Static public pages** (M): the root layout reads the session for the header, so every
  route renders on demand. Without it, `/`, `/help`, `/privacy`, `/terms` and the 404
  page could be static files, free for crawlers; the header's signed-in parts would come
  from the client. Only if the 2026-10-17 CPU check says so.
- A dev database (#15) is under Security → #20

---

## Security

Detail and fixes in `SECURITY.md`; its "Status" table says what's left of each. In the
order that file suggests:

- [ ] **#1** history rewritten and force-pushed 2026-10-10. Left: the GitHub Support purge
      (old SHAs + `refs/pull/1/head`; ticket #4844294 open) and whether to tell the drivers
      on the roster
- [ ] **#12** step 1 done 2026-10-10 (CSP and the other headers in `next.config.mjs`). Left:
      check signed-in pages, Google sign-in and the installed iPhone app on the live site for
      blocked loads; then step 2, nonces instead of `'unsafe-inline'` scripts
- [ ] **#10** allowlist PATCH bodies (`updateSlic`; `drivers/[id]` done 2026-10-10;
      `cover/[position]` was deleted 2026-10-10)
- [ ] **#8** decide the access model (open / invite code / approval) and write it in the
      README
- [ ] **#9** left: Google-only or a second factor for admins, the breached-password check,
      and the register route's 409 (the sign-in limit and the reset flow are done)
- [ ] **#14** BMC webhook, mostly done 2026-10-10. Left: a freshness check, `emailVerified`
      (#8) and an `admin_audit` row (#17)
- [ ] **#20** dev database for local work and previews (`DEV-DATABASE.md`). The seed
      script is built and dry-run checked (2026-10-14). Left: the `slics-dev` Atlas user
      and `DEV_MONGODB_URI` (stage 2), `.env.development.local` and the dev-time warning
      (stage 3), Vercel Preview on it (stage 4)
- [ ] then Tier 2 (#15–#18, #21, #24, #27) in any order

---

## Housekeeping

- [ ] Gemini: revoke the key in Google AI Studio and remove `GEMINI_API_KEY` from `.env`
      (gone from Vercel; the code went 2026-10-10, `ON-CALL-SHEET-SYNC.md` → "Stage 4")
- [ ] `/admin/drivers`: link the 20 suggested matches, add details for the new hires, and
      delete the roster rows of drivers who left
- [ ] check the three SLIC numbers that are on two hubs in `allHubs`: 0269 (PRORI Warwick,
      YARMA W. Yarmouth), 7752 (BAYTX Baytown, FTW1 Dallas), 9079 (LGBAP Long Beach Airport,
      SNAAP Santa Ana). If one of each pair is wrong, fix the data; the lookup copes either
      way since 2026-10-10 (`&alpha=`), but both hubs share one set of tips
- [ ] lint for unused imports (`eslint.config.mjs`; `archive/STRUCTURE.md` #34)
- [ ] `package.json`: `"engines": { "node": ">=20.6" }`, a `"description"`, a version off
      `0.1.0`, and drop `@types/node` (`archive/STRUCTURE.md` #32, #35)
- [ ] README: fill in or remove `[Live demo link coming soon]`, add screenshots, refresh the
      usage numbers (`archive/STRUCTURE.md` #36)
