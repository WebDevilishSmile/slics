# COVER-JOB-HIDING.md

Plan and checklist for letting an admin hide a cover job from drivers: one tap on
`/admin/cover/jobs` takes a job off the drivers' Covers page, and it stays off through
every sheet refresh until the admin shows it again. One stage; check items off as they
ship.

**How to use this:** the open questions were answered 2026-10-12, all with the defaults
("Decisions" below). Run `npm run build` (in a scratch copy, never while `next dev` runs)
before shipping. The app is used daily in production.

## Status (2026-10-12)

**Built 2026-10-12; waiting on deploy, `npm run db:indexes` and the live checks in
"Verifying".** `/covers` is still admin-only (`COVERS_OPEN` in `constants.js`), so no
driver sees anything here until Covers rolls out (`COVER-BIDDING.md`).

**Rolling back:** revert the commits. Nothing else changed shape; the
`cover-bid-job-hides` collection is new and inert without the code, so it can stay or be
dropped.

---

## Why

The ON CALL SHEET decides which jobs are on a week's list, and the app copies them as
they are (`ON-CALL-SHEET-SYNC.md`). Sometimes a job is on the sheet but shouldn't be
offered to drivers: it's already spoken for, it's being pulled, or it was added by
mistake. The app must never change the sheet (`lib/googleSheets.js` can't write), so the
admin needs a switch in the app itself that the sheet can't override.

## Ground rules

- **The hide survives every refresh.** A sheet refresh replaces a week's jobs whenever
  anything in the tab changes: it inserts the new rows and deletes the old ones, so every
  job gets a new `_id` (`replaceCoverBidJobsForWeek` in `lib/db/coverBidJobs.js`). A
  `hidden` field on the job would be lost on the next refresh. So hides live in their
  own collection, which no refresh, ping or cron touches, and they name a job by what
  stays the same across refreshes: **week + job number**.
- **Hidden means never sent.** `/covers` drops hidden jobs on the server, before
  `toDriverCoverJob`, so a hidden job never reaches a driver's browser. Same rule as the
  anonymity rule in `COVER-BIDDING.md`: what drivers mustn't see isn't sent, rather
  than sent and hidden in the page.
- **Admins see what drivers see on `/covers`.** An admin viewing `/covers` gets the
  driver's list, hidden jobs left out. The admin pages (`/admin/cover/jobs`) keep every
  job and label the hidden ones.
- **Only admins hide or show a job,** through `requireAdmin()` on the route.
- **Later stages honor it.** Preference lists (stage 2) and picking in the app (stage 3)
  in `COVER-BIDDING.md` must leave hidden jobs out: a driver can't list or pick a job
  they can't see.
- **No personal data.** A hide records which admin made it and when (`{ id, name }` and
  an ISO time), nothing about drivers.

## The job's key

`jobKey(jobNumber)` = `jobNumber.trim().toUpperCase()` (`lib/coverBidJobRow.js`), the
same normalization the review dialog uses to flag repeated job numbers and the job dialog
uses to list who picked a job. `hideKey(weekEnding, jobNumber)` and `isJobHidden(job,
hiddenKeys)` sit beside it.

- A job with **no job number** has no key, so it can't be hidden (decision 2).
- If a job number appears **twice in one week**, both rows share the key, so hiding
  hides both (decision 3). The review dialog already flags these.
- **A hide follows the saved job number,** the one `/covers` sees. On
  `/admin/cover/jobs` an unsaved row can't be hidden yet, and an unsaved edit to the
  number doesn't move the hide. Saving a new number on a hidden row leaves the hide on
  the old number, so the job shows again (a sheet refresh would have replaced the
  edited row anyway).

## Stage 1: Hide and show a job (built 2026-10-12)

**Data**

- [x] New collection `cover-bid-job-hides`: `{ weekEnding: 'YYYY-MM-DD', jobKey,
    jobNumber (as the sheet spelled it), hiddenAt: ISO string, hiddenBy: { id, name } }`.
      Showing a job again deletes its row. Unique index on `{ weekEnding: 1, jobKey: 1 }`
      in `scripts/createIndexes.js` (`npm run db:indexes`)
- [x] `lib/db/coverBidJobHides.js`, the only module that touches it:
  - `getHiddenJobKeys(weekEndingFrom)` returns a `Set` of `"<weekEnding>|<jobKey>"` for
    every hide from that week on (one query, the same window `/covers` loads)
  - `getWeekHides(weekEnding)` lists one week's, with who hid each and when
  - `hideCoverBidJob(weekEnding, jobNumber, user)` upserts, so a second tap is a no-op
  - `showCoverBidJob(weekEnding, jobNumber)` deletes
  - Both refuse an empty key with `HttpError(400, …)`
- [x] `isJobHidden(job, hiddenKeys)` next to `jobKey` in `lib/coverBidJobRow.js`

**API**

- [x] `app/api/cover-bid-jobs/hidden/route.js`: `PUT` hides, `DELETE` shows. Body
      `{ weekEnding, jobNumber }`. `requireAdmin()` first; `weekEnding` must be a
      `YYYY-MM-DD` Saturday; errors are `{ error }` (`CLAUDE.md` → "API routes")
- [x] The admin's job read (`GET /api/cover-bid-jobs?weekEnding=`, which
      `/admin/cover/jobs` loads) adds `hidden`, the week's hides (`getWeekHides`).
      The page matches rows to them by saved job number (`useCoverBidJobs`
      `isRowHidden`), so a hide shows on every row with that number

**Drivers' page**

- [x] `app/covers/page.jsx`: load `getHiddenJobKeys(cutoffWeek)` alongside the jobs and
      filter with `isJobHidden` before `toDriverCoverJob`. The filter runs for everyone,
      admins included

**Admin page (`/admin/cover/jobs`)**

- [x] An eye toggle per job, `HideJobButton.jsx`: "Hide job X from drivers" with
      `aria-pressed`, the crossed-out eye while hidden (`VisibilityOff` / `Visibility`), in
      `CoverBidJobRowActions.jsx` (desktop table) and in `CoverBidJobReviewDialog.jsx`
      (`renderSecondary`), where a phone card opens. Not on the card itself
      (`CoverBidJobSummaryCard.jsx`): the whole card is a button, and a button can't hold
      another. Disabled with a tooltip on an unsaved row or one with no job number
- [x] A hidden job reads as hidden in more than color: dimmed (`hiddenSx`, no grayscale,
      so it reads apart from picked), plus a "Hidden" label (`HiddenLabel`,
      `coverBidJobs/jobGrid.jsx`), in the table row, on the phone card and in the
      dialog's title (`CLAUDE.md` → "Visual style": state is never shadow or color alone)
- [x] A new summary line above the week's jobs counts them: "12 jobs · 2 hidden from
      drivers"
- [x] Confirm in place (the icon changes and pops, `tapHaptic()`, and the summary line is
      the polite live region), not a toast

**Read-only admin page (`/cover-bid-jobs`, folded into `/covers` on 2026-10-12; the path
redirects there)**

- [x] Kept every job and shows the same "Hidden" label on hidden ones, dimmed
      (`app/cover-bid-jobs/page.jsx` sets `hidden` on each job; the shared
      `coverBidJobs/CoverBidJobsTable.jsx` and `JobCard.jsx` show it)

**Docs**

- [x] `DATA-MODEL.md`: the `cover-bid-job-hides` row
- [x] `CLAUDE.md` → the cover bid jobs and driver verification bullets: hides, and that
      `/covers` filters them before `toDriverCoverJob`
- [x] `COVER-BIDDING.md` → "Ground rules": hidden jobs are out of stages 2 and 3
- [x] `OPERATIONS.md`: `npm run db:indexes` after deploying this

## Automatic hides (built 2026-10-14)

Some jobs on a week's tab are never for cover drivers, so the app hides them without an
admin's hide:

- **Rows the sheet hides.** The sheet's owner hides the shifter jobs at the top of the tab
  with "Hide row" (on 10/24/2026: SH16, WA03, WA09 and SH12). The refresh reads which
  rows are hidden (`getHiddenRows` in `lib/googleSheets.js`: a second request per tab,
  row metadata only, no cell data, still read-only) and saves each job's `sheetHidden`.
  A row the owner unhides shows again on the next read. Only "Hide row" counts, not a
  filter.
- **Sleeper jobs.** A job number starting with `ER` and a digit (ER18003), always.
- **The same row twice.** A row the tab lists twice with every field the same is saved
  once (`dedupeJobs`, `lib/coverSheetParser.js`); it's hidden only if every copy is
  (10/24 lists SH13 in the hidden shifter block and again, shown, in time order).

`autoHideReason(job)` (`lib/coverBidJobRow.js`) returns `'sheet'`, `'sleeper'` or `null`,
and `isJobHidden` is true for either, so `/covers`, the cover lists (`coverListStatus`)
and the admins' list counts all leave them out with no change of their own.

**Automatic is final** (decided 2026-10-14). On `/admin/cover/jobs` these jobs are dimmed
and labeled "Hidden in sheet" or "Sleeper job", and the eye is pressed and disabled,
saying why. To show one, unhide the row in the sheet. `sheetHidden` counts as a
difference when a refresh compares the week, so it saves, but it never records a cover
job change or sends a push.

## Decisions

Asked as open questions 2026-10-11; the admin chose every default on 2026-10-12, and
added that a hide records only who and when (no reason note).

1. **Does a hide carry into later weeks?** **No, each week on its own.** Job numbers
   repeat week to week, so a hide that carried over could hide a job the admin meant to
   post. (If yes: key on the job number alone, with an "until" week.)
2. **A job with no job number:** **can't be hidden.** Its button is disabled and says
   why. (The alternative, keying on the description, breaks when the sheet's wording
   changes.)
3. **The same job number twice in one week:** **hiding one hides both.** The review
   dialog already flags the repeat, so it's a sheet error to fix there.

## Verifying

- [x] `npm run lint` and `npm run build` (2026-10-12, the build in a scratch copy)
- [x] After deploying: `npm run db:indexes`
- [ ] On the live site, signed in as an admin, on a week that has jobs:
  - [ ] hide a job on `/admin/cover/jobs`: it dims, shows "Hidden", and the week's
        summary counts it
  - [ ] it's gone from `/covers`, and absent from the page source too (view source, or
        search the HTML for its job number)
  - [ ] press Refresh for that week: it stays hidden
  - [ ] edit that job's row in the sheet (a time, say) so the refresh replaces the week:
        it stays hidden
  - [ ] show it again: it's back on `/covers`
- [ ] Phone width, light and dark, on both admin pages
