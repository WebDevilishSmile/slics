# COVER-JOB-HIDING.md

Plan and checklist for letting an admin hide a cover job from drivers: one tap on
`/admin/cover/jobs` takes a job off the drivers' Covers page, and it stays off through
every sheet refresh until the admin shows it again. One stage; check items off as they
ship.

**How to use this:** answer "Open questions" first; the rest assumes the defaults written
there. Run `npm run build` (in a scratch copy, never while `next dev` runs) before
shipping. The app is used daily in production.

## Status (2026-10-11)

**Planned 2026-10-11, not started.** Waiting on the admin's answers to "Open questions".
`/covers` is still admin-only (`COVERS_OPEN` in `constants.js`), so no driver sees
anything here until Covers rolls out (`COVER-BIDDING.md`).

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
  driver's list, hidden jobs left out. The admin pages (`/admin/cover/jobs`,
  `/cover-bid-jobs`) keep every job and label the hidden ones.
- **Only admins hide or show a job,** through `requireAdmin()` on the route.
- **Later stages honor it.** Preference lists (stage 2) and picking in the app (stage 3)
  in `COVER-BIDDING.md` must leave hidden jobs out: a driver can't list or pick a job
  they can't see.
- **No personal data.** A hide records which admin made it and when (`{ id, name }` and
  an ISO time), nothing about drivers.

## The job's key

`jobKey = jobNumber.trim().toUpperCase()`, the same normalization the review dialog
already uses to flag repeated job numbers (`lib/coverBidJobRow.js`). Put it in one
exported helper there and use it everywhere below.

- A job with **no job number** has no key, so it can't be hidden (default 2 below).
- If a job number appears **twice in one week**, both rows share the key, so hiding
  hides both (default 3). The review dialog already flags these.

## Stage 1: Hide and show a job (not started)

**Data**
- [ ] New collection `cover-bid-job-hides`: `{ weekEnding: 'YYYY-MM-DD', jobKey,
      jobNumber (as the sheet spelled it), hiddenAt: ISO string, hiddenBy: { id, name } }`.
      Showing a job again deletes its row. Unique index on `{ weekEnding: 1, jobKey: 1 }`
      in `scripts/createIndexes.js` (`npm run db:indexes`)
- [ ] `lib/db/coverBidJobHides.js`, the only module that touches it:
  - `getHiddenJobKeys(weekEndingFrom)` returns a `Set` of `"<weekEnding>|<jobKey>"` for
    every hide from that week on (one query, the same window `/covers` loads)
  - `hideCoverBidJob(weekEnding, jobNumber, user)` upserts, so a second tap is a no-op
  - `showCoverBidJob(weekEnding, jobNumber)` deletes
  - Both refuse an empty key with `HttpError(400, …)`
- [ ] `isJobHidden(job, hiddenKeys)` next to `jobKey` in `lib/coverBidJobRow.js`

**API**
- [ ] `app/api/cover-bid-jobs/hidden/route.js`: `PUT` hides, `DELETE` shows. Body
      `{ weekEnding, jobNumber }`. `requireAdmin()` first; `weekEnding` must be a
      `YYYY-MM-DD` Saturday; errors are `{ error }` (`CLAUDE.md` → "API routes")
- [ ] The admin's job read (`GET /api/cover-bid-jobs?weekEnding=`, which
      `/admin/cover/jobs` loads) adds `hidden: true|false` to each job

**Drivers' page**
- [ ] `app/covers/page.jsx`: load `getHiddenJobKeys(cutoffWeek)` alongside the jobs and
      filter with `isJobHidden` before `toDriverCoverJob`. The filter runs for everyone,
      admins included

**Admin page (`/admin/cover/jobs`)**
- [ ] An eye button per job, "Hide from drivers" / "Show to drivers"
      (`VisibilityOff` / `Visibility`), in `CoverBidJobRowActions.jsx` (desktop table)
      and in `CoverBidJobReviewDialog.jsx`, where a phone card opens. Not on the card
      itself (`CoverBidJobSummaryCard.jsx`): the whole card is a button, and a button
      can't hold another. Disabled with a tooltip on a job with no job number
- [ ] A hidden job reads as hidden in more than color: dimmed, plus a "Hidden" chip, in
      the table row and on the phone card (`CLAUDE.md` → "Visual style": state is never
      shadow or color alone)
- [ ] The week's summary line counts them: "2 hidden from drivers"
- [ ] Confirm in place (the button changes, plus a polite live region), not a toast

**Read-only admin page (`/cover-bid-jobs`)**
- [ ] Keeps every job and shows the same "Hidden" chip on hidden ones

**Docs**
- [ ] `DATA-MODEL.md`: the `cover-bid-job-hides` row
- [ ] `CLAUDE.md` → the cover bid jobs and driver verification bullets: hides, and that
      `/covers` filters them before `toDriverCoverJob`
- [ ] `COVER-BIDDING.md` → "Ground rules": hidden jobs are out of stages 2 and 3
- [ ] `OPERATIONS.md`: `npm run db:indexes` after deploying this

## Open questions

Defaults in bold; change them before building.

1. **Does a hide carry into later weeks?** **No, each week on its own.** Job numbers
   repeat week to week, so a hide that carried over could hide a job the admin meant to
   post. (If yes: key on the job number alone, with an "until" week.)
2. **A job with no job number:** **can't be hidden.** Its button is disabled and says
   why. (The alternative, keying on the description, breaks when the sheet's wording
   changes.)
3. **The same job number twice in one week:** **hiding one hides both.** The review
   dialog already flags the repeat, so it's a sheet error to fix there.

## Verifying

- [ ] `npm run lint` and `npm run build`
- [ ] After deploying: `npm run db:indexes`
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
