# ON-CALL-SHEET-SYNC.md

Plan and checklist for pulling cover weeks and jobs from the "ON CALL SHEET" Google Sheet
into the app. Built in stages; check items off as they ship.

**How to use this:** stages go in order. Each item says where the code lives. Run
`npm run build` (in a scratch copy, never while `next dev` runs) before shipping any item.
The app is used daily in production.

## Status (2026-10-10)

- **Stages 1 and 2:** deployed (2026-10-09; redeployed 2026-10-10 with the sheet id fixed).
  - The first production refresh failed with Google's `404: Requested entity was not
    found` because `ON_CALL_SHEET_ID` on Vercel was wrong. A bad key would answer 400 and
    an IP-restricted key 403, so a 404 from the tab list always means the sheet id.
- **Stage 3:** in progress. The webhook and the sync lock are deployed, and the admin's
  script is installed. The daily cron is built. Next: the alerts, then the health line.
- **Setup for stages 1–2:**
  - [x] **API key:** the Google Sheets API is enabled, with an API key restricted to it.
  - [x] **Env:** `GOOGLE_SHEETS_API_KEY` and `ON_CALL_SHEET_ID` are in `.env` and on Vercel.
  - [x] **Indexes:** `npm run db:indexes` run 2026-10-10, after stage 2's were added.
  - [x] **First reads:** the Jobs baseline (213 jobs) and the first cover weeks were read
    from a local server. They still need one refresh each on the live site to check the
    deployment.

---

## Why

Drivers write their cover picks into a shared Google Sheet. Until now the app only got
cover-bid data when an admin photographed the printed sheet and ran it through Gemini
("Upload Bid Sheet" on `/admin/cover/jobs`), and that extraction skipped the pick rows. The
sheet's `Jobs` tab (every bid job, its driver, times, hours, miles and seniority) wasn't
tracked at all.

Reading the sheet directly is exact (no OCR), keeps the picks, and lets the app record
what changed and when. Changes to the Jobs tab are worth an alert; cover weeks change too
often for that and update quietly.

## Ground rules

- **The app never changes the sheet.** It reads with a Google API key (Sheets API v4),
  which cannot write to a sheet. No OAuth, no service account, no change to the sheet's
  sharing.
- **Only two kinds of tab are read:** the tab named `Jobs`, and tabs whose *whole name* is
  a date (`10/17/2026`).
  - Tabs are picked by name from the tab list, which carries no cell data.
  - Every other tab is never fetched, including `SHIFTERS`, which holds drivers' phone
    numbers.
- **The sheet ID stays out of git.** The sheet is shared as "anyone with the link can
  edit", so its link works as an edit key. It lives only in `ON_CALL_SHEET_ID` in `.env` and
  on Vercel. Don't paste it into code, docs or commit messages.
- **Saved, not live.** Pages read MongoDB. Only a Refresh press, the sheet's ping
  (stage 3) or the daily cron reads Google.
- **Additive.** New collections, and sheet rows marked `source: 'sheet'`. The only thing
  that replaces data is a cover-week refresh, and it asks first when the week has jobs
  uploaded from a photo. An automatic refresh skips such a week.

## The sheet's layout (as of 2026-10-09)

**Dated tab** (one per week):

- **Title row:** `JOBS AVAILABLE FOR W/E 10.17.2026`. The week in the title must match the
  tab's name, or the refresh stops.
- **Job section:**
  - Header: `Job #, NAME, Assigned Driver, Cover Reason, Sun, Mon, Tues, Wed, Thurs, Fri, Sat, Description`.
  - These are the same fields as `cover-bid-jobs`. Day cells are 24-hour times.
  - A name in **NAME** means the job has been picked.
  - `ER#####` rows have no times.
- **Pick section** (after a blank row):
  - Header: `, NAME, , , PICK #1 … PICK #7`.
  - Each row: pick time slot, name (`LAST, FIRST`), pick order, an unlabeled column, then one
    job code per pick.
  - The unlabeled column just before PICK #1 holds the driver's own job, or a status like
    `VACATION`, `FMLA`, `COVERING ER#####` or `on call`. The app calls it "Job / status".
  - A driver can be listed twice, so picks are keyed by name plus occurrence (`sheetDiff.js`).

**Tab names:**

- There are 519 tabs.
- Only the 242 whose whole name is a date (`10/17/2026`, `6/01/24`, `03.04.23`) are week
  tabs.
- `ON CALL 10/10/2026`, `HUB Drivers 10/3/2026` and `Copy of 9/19/2026` have a date in the
  name but aren't read.
- Two old tabs are misnamed (`1/17/2025`, `02.18.22` aren't Saturdays), so they never
  match a week.
- The jobs tab is named `Jobs`.

**`Jobs` tab:**

- **Header row** (26 columns): `Job Name, Driver`, then `Start, Hours, Miles` for each of
  Su…Sa, then `Description, Hours for Week, Seniority`.
- **Size:** 213 rows (41 KB). `Job Name` is unique. 64 rows have no driver (the
  SH/SL/ORS/WA/SP placeholders).

Parsers find headers by their text, never by fixed row or column numbers, so an inserted
row or column doesn't break them.

**Hidden rows are read on purpose (decided 2026-10-10).** The sheet's owner hides rows
with "Hide row": on 10/17/2026, the picked jobs SH16, WA09 and SH12, and pick rows for
drivers with no picks. The 10/10 and 10/24 tabs hide pick rows the same way. The
Sheets API returns hidden rows like any other, and the app keeps them, so a week can list
jobs drivers don't see in the sheet. Picked ones show grayed as "Picked". Skipping them
would take one more request per tab for `rowMetadata.hiddenByUser`, which carries no cell
data.

---

## Stage 1 — Refresh a cover week on `/admin/cover/jobs` (built)

Replaces the photo upload with a **Refresh** button for the week picked on the calendar.

- [x] **Sheet reader.** `lib/googleSheets.js`, server-only, plain `fetch`, no new dependency:
  - `listTabs()`: tab names and ids only.
  - `getTabValues(title)`: formatted values, exactly what people see.
  - Env `GOOGLE_SHEETS_API_KEY` and `ON_CALL_SHEET_ID`, both in `.env.example`.
- [x] **Tab names.** `lib/onCallSheet.js`:
  - `weekEndingFromTabTitle` matches a name that is *only* a date: `M/D/YYYY`, `M.D.YYYY`,
    or a 2-digit year.
  - Also here: `findWeekTab`, `findJobsTab`, `isSaturday`, `formatWeekEnding` and
    `SheetFormatError`.
- [x] **Parser.** `lib/coverSheetParser.js`:
  - `parseCoverTab(values)` → `{ weekEnding, jobs, picks }`.
  - Day cells go through `normalizeDayTime` (`lib/dayFormat.js`).
  - Tested on a CSV download of the 10/17/2026 tab: 35 jobs and 59 pick rows.
- [x] **Diff helper.** `lib/sheetDiff.js`: `diffByKey(oldRows, newRows, { keyOf, flatten })`
  → added / removed / changed. Shared with stage 2.
- [x] **Preview.** `npm run sheet:preview -- YYYY-MM-DD [--tabs]` or `-- --jobs`
  (`scripts/previewSheetWeek.mjs`). It prints what a refresh would save and never writes.
- [x] **Storage:**
  - `replaceCoverBidJobsForWeek` in `lib/db/coverBidJobs.js`:
    - It inserts the sheet's rows (`source: 'sheet'`, sheet order) before removing the old
      ones, so a failure never leaves the week empty.
    - It writes nothing when nothing changed.
  - `lib/db/coverBidPicks.js`:
    - `cover-bid-picks`: one doc per week, plus who refreshed it and when.
    - `cover-bid-pick-events`: one row per pick that changed. A week's first refresh records
      none.
  - Indexes in `scripts/createIndexes.js`.
- [x] **Shared refresh.** `refreshCoverWeek()` in `lib/onCallSheetSync.js` returns
  `{ status: 'ok' | 'no-tab' | 'uploaded' | 'format', message, data }`. The button's route
  and stage 3's webhook both call it.
- [x] **Routes:**
  - `POST /api/cover-bid-jobs/refresh` `{ weekEnding, replaceUploaded? }`: admin-only,
    rate-limited per user. Responses:
    - 400: `weekEnding` isn't a Saturday.
    - 404: no tab for that week.
    - 409: the week has uploaded jobs; the client asks before retrying with
      `replaceUploaded`.
    - 422: the tab isn't laid out as expected.
    - 502: Google or the database failed.
  - `GET /api/cover-bid-jobs/picks?weekEnding=` reads Mongo only.
- [x] **Page.** On `/admin/cover/jobs`:
  - `BidSheetUploader` is gone from the page.
  - `SheetRefreshButton` ("Refresh W/E … from sheet") confirms in place and asks before
    replacing uploaded jobs.
  - `CoverBidPicks` under the jobs shows the picks table, "refreshed … by …" and the recent
    changes.
  - `PickedByList` sits in the job dialog, through its `footer` prop.
  - The page fetches picks once with `hooks/useCoverBidPicks.js`.
- [x] **Picked jobs gray out.** A job whose NAME column has text has been picked
  (`isPicked`, `lib/coverBidJobRow.js`).
  - It shows grayed (`pickedSx`) with a "Picked" label (`PickedLabel`), both in
    `components/coverBidJobs/jobGrid.jsx`.
  - It still opens on a tap or click.
  - This applies on `/cover-bid-jobs` and `/admin/cover/jobs`, as tables and cards.
  - "cut" in NAME counts as picked too.
- [x] **Keep the old upload code for now:**
  - `BidSheetUploader.jsx`, `BidSheetSourceViewer.jsx`, the `extract` route and
    `GEMINI_API_KEY` stay, unused by the page, until stage 4.
  - Putting the button back is one line if the sheet route fails.

## Stage 2 — All jobs on `/admin/jobs`, with a change history (built)

- [x] **Parser.** `lib/jobsSheetParser.js`:
  - `parseJobsTab(values)` → one row per job:
    `{ jobName, driver, days: { sun: { start, hours, miles }, … }, description, weekHours, seniority }`.
  - `flattenJob` (fields like `driver`, `mon.start`, `weekHours`) and `fieldGroup`
    (driver / times / description / seniority).
  - Tested on a CSV download of the tab: 213 jobs, with drivers, times and seniority
    matching the sheet.
- [x] **Storage.** `lib/db/sheetJobs.js`:
  - `sheet-jobs`: the current snapshot, one doc per `jobName`, in sheet order. A job that
    leaves the sheet gets `removedAt`; it isn't deleted.
  - `sheet-job-changes`: one row per field that changed, plus added/removed jobs:
    `{ jobName, kind, field, group, from, to, seenAt, source }`.
  - The first refresh is a baseline and records no changes.
  - A job name listed twice keeps its first row; the repeats are noted in `sync-state`.
  - `sync-state` `{ _id: 'jobs', lastSyncedAt, lastSource, duplicates }` records each read.
    Stage 3's lock and ping times go in the same collection.
  - For stage 3: `countJobChangesSince(iso)` and `latestJobChange()`.
  - Indexes in `scripts/createIndexes.js`.
- [x] **Shared refresh.** `refreshJobsTab({ source })` in `lib/onCallSheetSync.js`.
- [x] **Routes:**
  - `POST /api/sheet-jobs/refresh`: admin-only, rate-limited.
  - `GET /api/sheet-jobs/changes?before=&beforeId=&job=&group=`: newest first, 100 per
    page. One refresh's changes share a `seenAt`, so paging also uses the id.
- [x] **Page.** `app/admin/jobs/page.jsx`:
  - A server component reading Mongo; the panel renders in the browser (`HydrationGuard`)
    so times are local.
  - Refresh button with "Last checked …".
  - A **Changes** feed grouped by day, with filter chips (All / Driver / Times /
    Description / Seniority) and "Show older". Tapping a change opens its job.
  - **All jobs**, searchable by job, driver or route: a table when wide, cards on a phone.
  - A job dialog with details, schedule (start / hours / miles) and that job's history.
  - Components are in `components/admin/sheetJobs/`.
- [x] **Navigation.** `['/admin/jobs', 'Jobs']` in `PAGE_TITLES`; `/admin` already links
  to it.

## Stage 3 — Your script, automatic sync and job-change alerts (in progress)

The admin runs the Apps Script from their own Google account; the guide is
`docs/on-call-sheet-apps-script.md`. When the `Jobs` tab or a dated tab is edited, the
script pings the app, and the app re-reads that part of the sheet. Jobs changes raise an
alert; cover weeks update quietly.

- [x] **Guide.** `docs/on-call-sheet-apps-script.md`:
  - A standalone script with two installable triggers:
    - `onSheetEdit` sends `{ tab }`, only for `Jobs` or a dated tab;
    - `onSheetChange` sends `{ changeType }` for added or removed rows, columns or tabs.
  - **The webhook must match it:**
    - `POST https://slics.vercel.app/api/webhooks/on-call-sheet`;
    - header `x-sheet-secret` (the script property `APP_SECRET`);
    - answers 200 when done, 202 when queued behind a running sync, 401/403 for a missing
      or wrong secret.
  - Until the webhook ships, `testPing` gets 404.
- [x] **Webhook.** `app/api/webhooks/on-call-sheet/route.js` (POST, `maxDuration` 60):
  - Checks the secret against `ON_CALL_SHEET_WEBHOOK_SECRET` with `crypto.timingSafeEqual`
    on SHA-256 hashes (401 when missing, 403 when wrong).
  - Has a global `checkRateLimit` (120/min) and records `lastPingAt` and the ping's body in
    `sync-state` `{ _id: 'ping' }` (`recordSheetPing`).
  - `{ changeType: 'TEST' }` (the script's `testPing`) reads nothing and answers 200.
  - Otherwise it calls `syncFromSheet(hint)` (`lib/onCallSheetSync.js`). The body is only a
    hint about what to re-read. Data always comes from the sheet:
    - `{ tab: 'Jobs' }` → `refreshJobsTab({ source: 'ping' })`.
    - `{ tab: '<date>' }` → `refreshCoverWeek` for that week, only if its Saturday is today
      or later (America/New_York). Older weeks are ignored.
    - Any other tab → nothing.
    - No tab → Jobs plus every dated tab from this week on (one tab list for all).
  - Automatic cover refreshes pass `replaceUploaded: false` and no user. `'uploaded'` means
    "skip this week": it's recorded as the outcome, not as an error, with no alert.
  - Answers 202 only when every target was already being read.
- [x] **Sync lock.** `lib/db/syncState.js`, used by `syncTarget` in `lib/onCallSheetSync.js`:
  - Each target (`jobs`, `week:YYYY-MM-DD`) has a 60 s lease in its `sync-state` doc
    (`acquireSyncLock`: an upsert whose duplicate-key error means "held").
  - A ping that finds it held sets `pending: true` and gets 202. If the holder let go in
    between, it tries once more to take it.
  - `releaseSyncLock` only lets go when `pending` is unset; otherwise it renews the lease
    and the holder reads again. At most 3 passes; after that the flag stays set for the
    next ping or the cron.
  - Records `lastRunAt`, `lastOutcome` and `lastError` (`{ message, at }` or null) per
    target. The Jobs doc keeps its `lastSyncedAt` / `lastSource` from stage 2.
  - Tested 2026-10-10 on a scratch build against a throwaway database: 401/403, SHIFTERS
    and a past week read nothing, `TEST` reads nothing, a full ping read Jobs and three
    weeks in 2.8 s, and two Jobs pings at once gave one 202 and one 200 with 2 passes.
- [x] **Daily backstop.** `vercel.json` cron → `GET /api/cron/on-call-sheet-sync`, at
  10:00 UTC (6 AM Eastern in summer, 5 AM in winter). Hobby runs crons once a day, at
  some point within the scheduled hour, and only on the production deployment.
  - It checks `Authorization: Bearer ${CRON_SECRET}` (`secretsMatch`, `lib/secretsMatch.js`,
    shared with the webhook) and does the same full refresh as a ping with no tab
    (`syncFromSheet({}, { source: 'cron' })`).
  - Tested 2026-10-10 on a scratch build against a throwaway database: no token, a wrong
    token or the bare secret → 401, POST → 405, the right token read Jobs and three weeks
    in 3.1 s with `lastSource: 'cron'`.
- [ ] **Alerts (Jobs tab only):**
  - **Seen marker:** `jobChangesSeenAt` on the admin's `users` doc (server-side, so phone
    and desktop agree), set through `lib/db/users.js`. `null` means everything since the
    baseline is new.
  - **`GET /api/sheet-jobs/unseen`** (admin-only) → `{ count, jobs, latest: [3] }`, from
    `countJobChangesSince`.
  - **`POST /api/sheet-jobs/seen` `{ upTo }`:** marks seen up to the newest change the page
    *rendered*, not "now", so a change arriving at the same moment isn't cleared unseen.
  - **Banner on `/admin`:** `components/admin/sheetJobs/JobChangesNotice.jsx`, a
    `SoftNotice`:
    - "**3 job changes** since you last looked (LV56, BE11)", the latest 3 on one line
      each, and "View changes" → `/admin/jobs`.
    - Nothing when the count is 0.
  - **Menu badge** (`components/header/UserMenu.jsx`, admins only):
    - A numbered `Badge` on the Admin row and a dot on the menu button.
    - The text changes too ("3 job changes"), not color alone.
    - The count lives in `lib/jobChangesStore.js` (the `lib/tipsStore.js` pattern),
      fetched from `/unseen` when the path changes.
  - **Clearing:** opening `/admin/jobs` POSTs `/seen` with its newest change's `seenAt`
    and zeroes the store. The feed puts a "New" label on changes after the previous
    `jobChangesSeenAt`.
- [ ] **Health on `/admin/jobs`:** "Sheet last pinged … · last synced …", `lastError` as an
  inline Alert, and a warning after 2 days with no ping ("your sheet script may be off").
- [ ] **Env** (`.env.example`):
  - [x] `ON_CALL_SHEET_WEBHOOK_SECRET` (`openssl rand -hex 32`; the same value is the
    script's `APP_SECRET`): in `.env` and on Vercel since 2026-10-10.
  - [ ] `CRON_SECRET`: in `.env.example` and `.env`; still to be set on Vercel. Until then
    the cron route answers 500.
- [x] **Install.** The admin installed the script on 2026-10-10; `testPing` answered 200.
  - [ ] A heads-up to their superior.

## Stage 4 — Cleanup (after stage 1 has run for a few weeks)

- [ ] **Delete the photo upload.**
  - `BidSheetUploader.jsx` and `BidSheetSourceViewer.jsx`, plus the uploaded-page branch in
    `CoverBidJobReviewDialog.jsx`.
  - `app/api/cover-bid-jobs/extract` and its `coverBidJobs/extract` alias.
  - `@google/genai` and `GEMINI_API_KEY`.
- [ ] **Docs.** Update `CLAUDE.md`'s cover bid jobs section and `.env.example`.

---

## Verifying

- **Stage 1:**
  - `npm run sheet:preview -- 2026-10-17 --tabs` reads only the requested dated tab, with
    `SHIFTERS` listed as not read.
  - Its jobs and picks match the sheet.
  - In the app:
    - A refresh shows the week and its calendar dot.
    - A second refresh reports no pick changes.
    - A week with no tab shows the "no tab" message.
    - A week with uploaded jobs asks before replacing them.
    - Reloading the page makes no Google call.
- **Stage 2:**
  - `npm run sheet:preview -- --jobs` shows 213 jobs.
  - The first refresh saves them as a baseline with no changes.
  - A second refresh reports "no changes".
  - A later refresh after a real edit shows only that edit.
- **Stage 3:**
  - `curl` the webhook:
    - no secret → 401, wrong → 403;
    - `{tab:'SHIFTERS'}` → 200, nothing read;
    - `{tab:'Jobs'}` → Jobs re-read;
    - two at once → one 202, then one extra pass.
  - The cron route without the bearer token → 401.
  - Once a real Jobs change comes in, the `/admin` banner and the menu badge show it, and
    opening `/admin/jobs` clears both.
    - `.env` points at production, so a hand-made test change goes in only with the
      admin's OK, and is deleted after.
  - Never make test edits to the sheet.

## Worth knowing

The sheet is shared as "anyone with the link can edit". That's the owner's decision, not
the app's. If someone wipes it, stage 2's history shows a burst of "removed" and the
snapshot keeps the last values.
