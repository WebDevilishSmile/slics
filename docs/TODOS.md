# TODOs

The hub: everything to do and every idea worth keeping, one line each, linking to the doc
with the detail. Items move **Inbox → Ideas → Next → Now → done**, and a done item goes to
`archive/DONE.md` (`README.md` → "Conventions" has the rules). Use absolute dates.

---

## Inbox

<!-- Add anything here, any wording. -->

- Changing your password (or a reset) signs you out everywhere, but the account's
  `push-subscriptions` rows stay, so a device signed out that way keeps getting its
  pushes until someone signs in on it. Delete them where `sessionVersion` is bumped?
  (found 2026-10-14 building Push stage 2, `PUSH-NOTIFICATIONS.md` → 2.4)

---

## Now

Built and live, waiting on a check or a step only Tiago can do.

- [ ] **Creator mode** (stage 2 built 2026-11-12): try every driver page on a phone as the
      super admin, then record the tutorials with it (`CREATOR-MODE.md` → Checklist)
- [ ] **SLIC directions** (stages 1–3 live 2026-11-12): go over each route on its edit page
      (`ROUTE-REVIEW.md`; move arrival notes out; NWTVA done), and on a phone try Read
      aloud, Step by step and the two documents now on production (`SLIC-DIRECTIONS.md`)
- [ ] **Sheet conventions:** print `print/ON-CALL-SHEET-CONVENTIONS.pdf` for dispatch. The
      digests and blank-row reading it describes are live (checked 2026-11-13)
- [ ] **Cover reports** (built 2026-11-07, none filed yet): send a test report from
      `/covers` on a phone, check the push, the menu badge, the `/admin` banner and
      `/admin/cover/reports`, then Delete it (`COVER-BIDDING.md` → "Reference only and
      cover reports")
- [ ] **W/E 12/05's bid day falls on Thanksgiving** (Thu 11/26, the default): ask dispatch
      which day it moves to and set it on `/admin/cover/jobs` before then. No week has
      been moved yet, so it's also the last check of Covers notifications: `/covers` and
      the reminders should follow, and `admin_audit` get `coverBidDay.set`
      (`PUSH-NOTIFICATIONS.md` → "Verifying stage 3")
- [ ] **Password reset:** on a phone, open an admin-made link for a test account, and an
      emailed reset sent to a password account (the 2026-10-12 test went to a Google
      account) (`archive/PASSWORD-RESET.md` → "Verifying")

---

## Waiting

- [ ] **On hold (2026-11-12) until Tiago picks it back up: SLIC directions, stage 4,** the
      route as waypoints in Google Maps (`SLIC-DIRECTIONS.md`). Before then: confirm
      `ROUTE-REVIEW.md` → Do first with drivers (a gate code in a public PDF, low
      clearances) and settle its 28 app-vs-PDF mismatches

**Old data to drop.** Tiago's call; the system health page counts the two collections
(`lib/systemHealth.js`).

- [ ] the `cover` collection (20 rows), once you're sure the sheet's cover list has proven
      itself: its code went 2026-10-10, and Covers has run from the sheet since
- [ ] the `bid-jobs` collection (148 rows), when sure nobody wants the old list (`/bids`,
      its only reader, was deleted 2026-10-10 with `SECURITY.md` #7)
- [ ] `users.driverId`, the old roster link (on one account; nothing reads or writes it
      since 2026-10-10, `COVER-BIDDING.md` → "Data")

---

## Next

- [ ] **Covers stage 3:** picking in the app on the clock, with auto-pick. Settle the open
      questions first, starting with what the source of truth is once the app can't write
      the sheet (`COVER-BIDDING.md` → "Stage 3")
- [ ] **Up next on bid day** (planned 2026-11-13, from the Inbox): a push when the driver
      before you has picked, read from the sheet, so it doesn't wait on Covers stage 3.
      Five open questions, each with a default. Ship before a bid day (next: Thu 11/19)
      (`PUSH-NOTIFICATIONS.md` → "Up next: your turn on bid day")

---

## Ideas

Not committed. Numbers are `RECOMMENDATIONS.md` items, where the design notes are.
Effort: S = an evening or two · M = a few evenings · L = a project with stages.

### For drivers

- **Drivers helping drivers** (M–L, #21): a driver shares the hours they can take calls,
  and drivers who need help find and call them
- **My Daily Log** (L, #1): log the day's route from your job, legs pre-filled; Tiago's
  notes are in #1
- **Forum page** for discussions (on hold since 2026-10-10). The Places count was due
  2026-11-12: by 2026-11-13, 9 places (7 since 2026-10-12) and 3 place comments in all.
  Check the `/places` pageviews in Vercel Analytics, then decide. If yes, build on the
  places comment code (`lib/db/places.js`, `components/places/`); someone has to moderate
- **Pinned SLICs** (S, #8): a star on the card; pinned SLICs lead the search list and the
  empty state (`archive/UI-SUGGESTIONS.md` #54)
- **Home-screen shortcuts** (S): "Look up a SLIC" and "My history" on a long-press of the
  icon (`app/manifest.js`, `archive/UI-SUGGESTIONS.md` #55)
- **Bottom navigation** (on hold since 2026-10-10, `archive/UI-SUGGESTIONS.md` #52): a
  prototype is on the local branch `bottom-nav-preview`. Open: the hamburger on phones,
  the back arrow on tab pages, a stronger top edge in light mode
- **Safety notes at the top of the card** (S–M, #6): low bridges, no-truck roads, a closed
  dock
- **Tip freshness** (S, #7): a tip's age, and "Still right?" after 6 months
- **Share a SLIC** (S, #9): `navigator.share` with the `/home/<slic>` link
- **"What's new" after a release** (S, #10): a one-time sheet with two or three lines
- **Faster cards on a weak signal** (S, #11): keep the last lookups' address and phone on
  the device

### For the admin

- **A data-health page** (S, #12): SLICs with no PDF or phone, stale ones, duplicates
- **An admin audit log page** (S, #14): who changed what, on one page; `admin_audit` and
  the hub's Activity cover part of it, the rest is `SECURITY.md` #17
- **Notifications for dispatchers:** `canUsePush` still goes by the admin role, so a
  dispatcher with SLIC reports gets no reports push (`archive/STAFF-ROLES.md` →
  "Follow-ups")
- **Per-person tool exceptions:** tools are per role; add overrides on an account if one
  dispatcher needs a tool the others don't (`archive/STAFF-ROLES.md`)
- **Leaving as a dispatcher:** only admins are refused self-service account deletion;
  should a dispatcher need a super admin too? (`archive/STAFF-ROLES.md`)

### Platform

- **Other hubs** (L, `MULTI-HUB.md`): stages 0–1 live 2026-11-12; stage 2 on hold until a
  hub asks or Covers picking starts, built on the `multi-hub` branch (its own worktree)
- **A small test suite** (M, #16): the sheet parsers and the route auth test
- **CI on GitHub Actions** (S, #17): build and lint on every push
- **Schemas at the API boundary** (M, #18): zod per collection (`SECURITY.md` #10–#11)
- **Next 16** (M, #19): clears the last audit findings (`SECURITY.md` #3)
- **Error alerts** (S, #20): a 500 on a driver's phone reaches you first
- **Static public pages** (M): `/`, `/help`, `/privacy`, `/terms` and the 404 as static
  files, with the header's signed-in parts from the client. Less pressing on Vercel Pro
  (the team's plan, checked 2026-10-22)
- A dev database (#15) is under Security → #20

---

## Security

Detail in `SECURITY.md`; its "Status" table says what's left of each, in this order:

- [ ] **#12** step 2: nonces instead of `'unsafe-inline'` scripts (step 1 shipped
      2026-10-10 and was checked on the live site by 2026-11-13)
- [ ] **#10** allowlist PATCH bodies (`updateSlic`; `drivers/[id]` done 2026-10-10)
- [ ] **#14** BMC webhook: a freshness check and an `admin_audit` row (#17)
- [ ] **#20** dev database (`DEV-DATABASE.md`, stages 1–2 done 2026-11-12): stage 3,
      `.env.development.local` and the dev-time warning; stage 4, Vercel Preview on it
- [ ] then Tier 2 (#15–#18, #21, #24, #27) in any order

---

## Housekeeping

- [ ] **Due since 2026-10-22:** delete the 12 old-path API alias files
      (`grep -rln "Old path, renamed on 2026-10-08" app/api`) and their mention in
      `CLAUDE.md` → "API routes" (`archive/STRUCTURE.md` #29)
- [ ] **Due since 2026-11-12:** make the `/whip-it-in-and-out` redirect `permanent: true`
      (`next.config.mjs`). The Places "New" label ended by itself on 2026-11-12 (a date on
      `/admin/super/features`)
- [ ] **Ready:** retire the Supabase bucket and the `slic.pdf` fallback: every SLIC with a
      PDF has `pdfUrl` (checked 2026-11-13). `CLAUDE.md` → "External integrations"; closes
      part of `SECURITY.md` #13
- [ ] Gemini: revoke the key in Google AI Studio and remove `GEMINI_API_KEY` from `.env`
      (still there 2026-11-13; gone from Vercel and the code since 2026-10-10)
- [ ] `/admin/drivers`: link the 20 suggested matches, add details for the new hires, and
      delete the roster rows of drivers who left
- [ ] check the three SLIC numbers on two hubs in `allHubs`: 0269 (PRORI Warwick, YARMA W.
      Yarmouth), 7752 (BAYTX Baytown, FTW1 Dallas), 9079 (LGBAP Long Beach Airport, SNAAP
      Santa Ana). Both of a pair share one set of tips
- [ ] lint for unused imports (`eslint.config.mjs`; `archive/STRUCTURE.md` #34)
- [ ] `package.json`: `"engines": { "node": ">=20.6" }`, a `"description"`, a version off
      `0.1.0`, and drop `@types/node` (`archive/STRUCTURE.md` #32, #35)
- [ ] README: fill in or remove `[Live demo link coming soon]`, add screenshots, refresh the
      usage numbers (`archive/STRUCTURE.md` #36)
