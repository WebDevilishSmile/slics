# MULTI-HUB.md

The roadmap for opening SLICs to other UPS Feeder hubs. Each hub has its own list of
SLICs it runs to, its own covers, jobs, drivers and admins, while every hub shares one
SLIC directory and its Driver tips. It's built in stages. Check items off as they ship.

**How to use this:** the stages go in order. The safety rules below apply to every item.
The app is used daily in production by BETPA's drivers, and none of this may change what
they see until a stage is finished, verified and deliberately merged.

## Status (2026-11-11)

- **Stage 0 is built on the `multi-hub` branch** (2026-11-11), not merged: the hub
  settings (`hub-configs`, `lib/hubScope.js`, `lib/db/hubConfigs.js`), the seed script,
  and the BETPA values behind optional arguments. Nothing a driver sees changes, and no
  `hub-configs` doc exists in production yet (`npm run hub:seed` has only been dry-run).
- This roadmap is on `main`. The building work happens on the `multi-hub` branch, in its
  own worktree (`../slics-multi-hub`), which isn't pushed; `main` gets none of the code
  until a stage is merged.

---

## Why

SLICs was made for one building, BETPA (about 270 drivers). `/about` (`about/Future.jsx`)
already invites drivers from other hubs to ask for it. When one does, adding them should
be a setup task on `/admin/super`, not a fork of the code.

## The three decisions (2026-11-11)

1. **One shared SLIC directory.** SLIC codes are UPS-wide: 1813 is the same Uline for any
   hub. `slics` stays one list, and Driver tips stay on the destination, so a tip about
   a customer helps every hub that runs there. Each hub has its own *list* of the SLICs it
   runs to (`slics.hubs`), and a code that isn't on the list is still found in the directory.
2. **One app, many hubs.** One deployment (www.slics.app) and one database, with a
   `hubId` on per-hub data. Every hub gets each fix at once, there's one set of crons, and
   a driver who changes buildings keeps their account.
3. **A local admin per hub.** Each hub has its own admins and dispatchers, who see only
   their own hub. Tiago stays super admin over every hub.

## Safety rules (every stage)

- **The branch is the boundary.** Work happens on `multi-hub` in its worktree. `main` gets
  nothing until a stage is finished and verified and Tiago chooses to merge it, because
  merging is a deploy.
- **Previews never touch production data.** Before the branch is pushed (which makes a
  Vercel preview deployment), Vercel's **Preview** environment gets its own `MONGODB_URI`
  pointing at the dev database (`DEV-DATABASE.md`). Until then the branch stays local.
- **Data changes are additive and reversible.** Each one is a script with `--dry-run` and
  `--undo`, like `pdfs:migrate` / `pdfs:rollback`. It runs on the dev database first, and on
  production only when its stage is merged.
- **A missing `hubId` means BETPA.** Readers go through `hubFilter(hubId)`, which for
  the default hub also matches docs with no `hubId`. Old docs, and a rolled-back deploy
  that writes none, keep working. The fallback is removed only after the backfill is checked.
- **Unique indexes change in three steps:** create the new compound index, verify it, and
  only then drop the old one.
- **BETPA doesn't change.** After every stage, BETPA looks and behaves exactly as before.
  Headless phone screenshots of `/home`, `/covers`, `/profile` and `/admin`, taken before
  and after, prove it.

## Names (avoiding a clash)

"Hub" already means two other things in the code: the super admin's hub (`/admin/super`,
`lib/db/hub.js`) and the Covers hub (`/admin/cover`, `lib/db/coverHub.js`). The `allHubs`
collection is the list of UPS hubs behind `/hubs`. So the new pieces are named:

- `hub-configs`: the collection with one doc per building using SLICs;
- `lib/db/hubConfigs.js` (`getHubConfig`, `getHubConfigFresh`, `describeHubConfig`) and
  `lib/hubScope.js` (`DEFAULT_HUB_ID`, `DEFAULT_HUB`, `hubFilter`, `assertHubId`,
  `hubConfigFrom`, `publicHub`);
- `hubId`: a lowercase alpha code (`'betpa'`) on per-hub docs and on `users`.

## Where BETPA is wired in today

What stage 0 replaces with hub config, each item falling back to today's value:

| What | Where |
|---|---|
| The dispatch phone's SLIC, `DISPATCH_NUM_SLIC = '1809'` (gone since stage 0: `dispatchNumSlic`) | `constants.js`; `app/covers/page.jsx`; the "BETPA" text in `covers/CoverList.jsx` |
| The one on-call sheet, `ON_CALL_SHEET_ID` | `lib/googleSheets.js`, `lib/onCallSheetSync.js`, `scripts/previewSheetWeek.mjs`, `lib/systemHealth.js` |
| The webhook secret, `ON_CALL_SHEET_WEBHOOK_SECRET` | `app/api/webhooks/on-call-sheet/route.js` |
| New York time | `lib/bidDay.js`, `lib/db/hub.js`, `lib/onCallSheet.js` (`todayInNewYork`) |
| Bid day: the Thursday 9 days before the week ends | `lib/bidDay.js` (`BID_DAY_OFFSET_DAYS`) |
| The cover drivers are picks 1–20 | `lib/coverDrivers.js` (`COVER_POSITIONS`) |
| An `ER` job number is a sleeper job | `lib/coverBidJobRow.js` (`SLEEPER_JOB`) |
| The sheet's layout | `lib/coverSheetParser.js`, `lib/jobsSheetParser.js`, `lib/onCallSheet.js` |
| Global switches and staff tools | `app-settings` `features` and `roles` (`lib/db/appSettings.js`) |
| One staff role per account | `users.role`, `users.superAdmin` |
| Unique across the whole app | `users.driver.key`, `cover-bid-picks.weekEnding`, `sheet-jobs.jobName` |
| Global keys | `sync-state` `_id`s (`'jobs'`, `'week:…'`, `'ping'`); `cover-notices` keys |
| Copy | `PRODUCT.md`, the landing page (`components/landing/`), `about/Future.jsx`, `/help` (`help/guides.jsx`), `/privacy`, `/terms` |

## The model

**`hub-configs`**, one doc per building:
```
{ _id: 'betpa', name: 'Bethlehem Center', alphaSlic: 'BETPA', numSlic: '1809',
  dispatchNumSlic: '1809', timeZone: 'America/New_York',
  covers: { enabled: true, layout: 'betpa-v1', coverDriverCount: 20,
            bidDayOffsetDays: 9, sleeperPattern: '^ER\\d' },
  sheet: { id, webhookSecretHash },      // optional, server-only
  seededAt, seededBy, updatedAt }
```
- BETPA's values live in the code as `DEFAULT_HUB` (`lib/hubScope.js`, pure and
  import-free). `hubConfigFrom` lays a stored doc over them one field at a time, keeping
  the code's value for a missing or malformed field. Another hub starts from BETPA's rules
  with Covers off.
- It's read behind a 5-minute `unstable_cache` with a tag (`getHubConfig`), like
  `lib/db/appSettings.js`. BETPA's read never throws: a failure is the code's values.
- `bidDayOffsetDays` is the bid day's distance before the week's Saturday (9 is the
  Thursday before), so no weekday needs storing.
- `sheet` is optional and stays on the server (`publicHub` drops it). Without it, BETPA
  reads `ON_CALL_SHEET_ID` and `ON_CALL_SHEET_WEBHOOK_SECRET` as before. Once it's saved
  (`npm run hub:seed -- --with-sheet`) it wins over the env keys, so rotating the webhook
  secret means re-saving its hash. The secret is stored as a SHA-256, like reset tokens,
  and the cache never holds an env value.

**Shared** (never filtered by hub):

| Collection | Note |
|---|---|
| `slics` | Gains `hubs: ['betpa', …]`, the hubs whose list it's on (indexed array) |
| `slic_history` | Gains a `hubId` stamp: which hub's staff made the change |
| `comments` (tips) | Tips belong to the destination. An author's hub could later show as a small label |
| `slicViews` | A driver's own history |
| `places`, `placeComments` | Places are geographic and already sorted by distance (an open question below) |
| `gyms`, `gymComments` | The super admin's own list |
| `users`, `accounts`, `push-subscriptions`, `push-log`, `bmc-events`, `password-resets`, `email-confirmations`, `rateLimits` | Accounts are app-wide |
| `admin_audit` | Gains a `hubId` stamp |
| `allHubs` | The UPS hubs list behind `/hubs` |

**Per hub** (every read and write is scoped by `hubId`):

| Collection | Unique index changes |
|---|---|
| `drivers` | `employeeId` → `(hubId, employeeId)`; `sheetKey` → `(hubId, sheetKey)` |
| `driver-claims` | pending per user stays as it is (a user has one hub) |
| `cover-bid-jobs`, `cover-bid-pick-events`, `cover-job-changes` | — |
| `cover-bid-picks` | `weekEnding` → `(hubId, weekEnding)` |
| `cover-bid-job-hides` | `(weekEnding, jobKey)` → `(hubId, weekEnding, jobKey)` |
| `cover-preferences` | stays `(userId, weekEnding)` |
| `cover-list-totals`, `cover-bid-days` | `weekEnding` → `(hubId, weekEnding)` |
| `cover-disputes`, `cover-reports` | — |
| `cover-notices` | keys gain a `<hubId>:` prefix |
| `sheet-jobs` | `jobName` → `(hubId, jobName)` |
| `sheet-job-changes` | — |
| `sync-state` | `_id`s gain a `<hubId>:` prefix |
| `slic-reports` | the reporter's hub, so it lands in that hub's queue |

**Users and staff:**
- `users.hubId` is the driver's home hub; a missing value means `betpa`.
- `users.role` and the areas apply to that hub only, so a local admin is a driver of their
  hub with admin tools there.
- `users.driver.key` becomes unique per `(hubId, driver.key)`.
- The super admin has every hub. A hub switcher in the header menu sets an `activeHub`
  cookie, honored only when `isSuperAdmin`.

**Session:** `auth.js` puts `session.hub = { id, name, alphaSlic, features }` on every
session, fresh like `role`. `lib/authz.js` reads the hub from there and nowhere else, and
never from a request body.

**Switches:**
- `app-settings` gains `features:<hubId>` (`coversOpen`, `pushOpen`) and `roles:<hubId>`.
- Each falls back to the current global `features` / `roles` doc, then to `constants.js`.
- Icon and Places dates stay global.

---

## Stage 0: groundwork (no behavior change)

Built 2026-11-11 on `multi-hub`; not merged.

- [x] `lib/hubScope.js`: `DEFAULT_HUB_ID = 'betpa'`, `DEFAULT_HUB` (BETPA's values),
      `hubFilter`, `assertHubId` (throws when a per-hub function is called without a hub),
      `hubConfigFrom`, `publicHub`.
- [x] `hub-configs` and `lib/db/hubConfigs.js`, cached, with the fallbacks above.
- [x] `scripts/seedHubConfig.mjs` (`npm run hub:seed`, `--dry-run`, `--undo`,
      `--with-sheet`): writes BETPA's doc from `DEFAULT_HUB`, and with `--with-sheet` the
      sheet's id and the webhook secret's hash from env. Undo deletes only a doc it wrote.
      Each change goes to `admin_audit` (`hubConfig.seeded`, `.sheetSaved`, `.removed`).
- [x] The hardcoded points now come from hub settings:
  - [x] `DISPATCH_NUM_SLIC` is gone: `/covers` reads `getHubConfig()` for
        `dispatchNumSlic`, and `CoverList` shows its `alphaSlic` (`dispatch={ name, phone }`).
  - [x] `lib/googleSheets.js` takes `{ spreadsheetId }` on every read (env when absent).
        `lib/onCallSheetSync.js` passes the hub's `sheet.id`.
  - [x] The webhook checks `sheet.webhookSecretHash` when saved (`secretMatchesHash`,
        `lib/secretsMatch.js`), else the env secret.
  - [x] Time zone, bid-day offset, cover-driver count and sleeper pattern read their
        defaults from `DEFAULT_HUB`. Each function that uses one takes it as a last,
        optional argument: `todayInNewYork(now, timeZone)`, `callInInstant(…, timeZone)`,
        `currentBidWeek` / `defaultBidDate` / `bidDateFor` / `weeksBiddingOn(…, offsetDays)`,
        `coverSpots` / `myCoverSpot` / `offListWeeks(…, positions)`,
        `autoHideReason(job, { sleeperPattern })`, `isJobHidden(…, rules)`. No caller passes
        one yet: stage 2 does, once there's a hub to pass.
- [x] `lib/systemHealth.js`: a "Hub settings" line in the sheet section says whether
      BETPA's settings, sheet id and webhook secret come from `hub-configs` or env.
- **Verified 2026-11-11:**
  - Every changed pure function gave the same answer as `main`'s for each day of
    2025–2027 (bid weeks, bid days, call-in instants, sleeper hides, cover places,
    today in New York).
  - Read-only against production, `getHubConfigFresh('betpa')` returns BETPA's values with
    the sheet from env, and another hub with no doc is null.
  - The seed script's `--dry-run`, `--with-sheet --dry-run` and `--undo --dry-run` print
    what they would do and write nothing.
  - `npm run lint` and `next build` pass.
  - Tiago compared the branch (`next dev -p 3001` in the worktree) with `main` (port
    3000) by hand: Call dispatch and "BETPA (phone)", bid day and call-in time on
    `/covers`, the sleeper and sheet-hidden jobs, This week on `/profile`, and the new
    "Hub settings" line on `/admin/super/health`. All the same, apart from the new line.
- **Left for the merge:** optionally, `npm run hub:seed` on the dev database, then
  production.

## Stage 1: tag the data (additive)

- [ ] Writers stamp `hubId` on every per-hub collection, and `createSlic` adds
      `hubs: [hubId]`. While only BETPA exists, the value is the default.
- [ ] `scripts/backfillHubId.mjs` (`--dry-run`, `--undo`): `hubId: 'betpa'` on every
      per-hub doc, and `hubs: ['betpa']` on every SLIC. The `--undo` removes only what it
      added, by a `hubIdBackfilledAt` marker.
- [ ] The compound indexes in `lib/db/indexSpecs.mjs`, added alongside the old ones.
- [ ] The prefixed `sync-state` and `cover-notices` keys: read both forms, write the new.
- **Verify:** read-only checks with jiti. The dry-run counts match `countDocuments`, and
  after the backfill (dev DB first) no per-hub doc is left without `hubId`.

## Stage 2: scope everything by hub (the big refactor)

- [ ] Every per-hub function in `lib/db/*.js` takes `hubId` first and calls `assertHubId`.
      A forgotten scope fails loudly instead of leaking. The main ones: `coverBidJobs.js`,
      `coverBidPicks.js`, `coverPreferences.js`, `coverBidJobHides.js`, `coverBidDays.js`,
      `coverDisputes.js`, `coverReports.js`, `coverJobChanges.js`, `coverListTotals.js`,
      `coverNotices.js`, `coverHistory.js`, `coverHub.js`, `driverClaims.js`,
      `drivers.js`, `driverWeeks.js`, `sheetJobs.js`, `syncState.js`, `slicReports.js`.
- [ ] `lib/authz.js`: `requireArea`, `getAreaSession`, `requireCovers` and
      `requireVerifiedDriver` return `hubId`. `lib/staffAreas.js` and `lib/featureAccess.js`
      read the hub's roles and features, and `coverDriverFilter` (`lib/db/users.js`) adds
      `hubId`.
- [ ] Sheet sync (`lib/onCallSheetSync.js`, `lib/sheetNotices.js`, `lib/coverNotices.js`)
      takes a hub. The crons (`/api/cron/on-call-sheet-sync`, `/api/cron/cover-notifications`)
      loop over hubs with `covers.enabled`. The webhook names its hub (`?hub=`) and checks
      that hub's secret.
- [ ] Push: `sendPushToAdmins(type, { hubId })` sends to that hub's staff.
      `getCoverDriverAudience` and `getDriverPushAudience` filter by hub.
- [ ] `GET /api/admin-alerts` and the `/admin` banners count the session's hub.
- [ ] `/home` lists the hub's SLICs (`slics.hubs`). A code that isn't on the list is found in
      the whole directory, marked "Not on your hub's list".
- [ ] The super admin's hub switcher. `/admin/super` stats per hub and for all hubs.
- [ ] The **hub isolation** item in `SECURITY.md` (below).
- [ ] Remove the missing-`hubId` fallback in `hubFilter` once production is backfilled and checked.
- **Verify:**
  - Each scoped reader returns the same counts and ids for `betpa` as before.
  - Every `collection('cover-…' | 'sheet-…' | 'driver…')` call sits in a function that takes
    a `hubId`.
  - The isolation test passes.
  - Screenshots show BETPA unchanged.

## Stage 3: onboarding a hub (when one asks)

- [ ] `/admin/super/hubs`: create a hub (name, alpha and number, dispatch SLIC, time
      zone), choose its first admin, and turn its features on and off. Every change goes
      to `admin_audit` first.
- [ ] The hub's SLIC list: tag SLICs already in the directory, or import a CSV through
      `createSlic` so history records each one.
- [ ] Joining:
  - [ ] an invite link `/join/<hubId>` sets `users.hubId` at sign-up;
  - [ ] existing accounts stay BETPA;
  - [ ] an admin moves a driver between hubs, which clears `users.driver` and goes to
        `admin_audit`.
- [ ] The landing page and sign-up name the hub when arriving from an invite.
- A hub without Covers has no Covers menu row. SLICs, tips, Places and history work
  from the first day.

## Stage 4: Covers for a new hub

- [ ] Read the hub's sheet with `scripts/previewSheetWeek.mjs --hub <id>`.
  - If it follows `ON-CALL-SHEET-CONVENTIONS.pdf`, it uses layout `betpa-v1`.
  - If not, add a parser layout chosen by `covers.layout`, and never loosen BETPA's.
- [ ] Set its sheet id, its webhook secret and its copy of the Apps Script
      (`on-call-sheet-apps-script.md`), then its bid-day rule, cover-driver count and
      sleeper pattern.
- [ ] Turn on its "Covers for every driver" switch, after an early-access trial like BETPA's.

## Stage 5: copy and legal

- [ ] `PRODUCT.md`, the landing page, `/about` (`Future.jsx`) and the `/help` guides talk
      about "your hub", not BETPA.
- [ ] `/privacy` and `/terms`: SLICs and Driver tips are shared across hubs, and each hub's
      admins see only their own hub's drivers, covers and claims.
- [ ] `DATA-MODEL.md`, `OPERATIONS.md` and `CLAUDE.md` change in the same commits as the
      code they describe.

## Security: hub isolation

To copy into `SECURITY.md` when stage 2 lands:

- A hub's admins and dispatchers never see another hub's drivers, picks, cover lists,
  claims, disputes, cover reports or Jobs tab.
- A hub comes from the session (`session.hub`, or the super admin's switcher) and never
  from a request.
- The check is an isolation test on the dev database: a fake second hub, `TESTPA`, with
  its own drivers, picks, a claim and a list.
  - Signed in as TESTPA's admin, `/admin/cover/*`, `/admin/driver-claims`,
    `/admin/drivers`, `/admin/jobs` and `/covers` show nothing from BETPA. The reverse
    holds too.
  - A tip posted from TESTPA on a shared SLIC does show for BETPA.

## Timing

- **Stages 0–1** are cheap and safe to build early, on the branch.
- **Stage 2** should land before the next large Covers feature (stage 3 of
  `COVER-BIDDING.md`, picking in the app). Every per-hub query written before it is one
  more to retrofit.
- **Stages 3–5** wait until a hub asks.

## Open questions

- Do Places stay shared, or get a "near your hub" filter?
- A SLIC on several hubs' lists: which hub's queue gets a report on it? For now, the
  reporter's hub.
- Does the super admin get every hub's admin notifications, or only BETPA's?
- Should a tip show its author's hub?
- Who edits a SLIC that's on several hubs' lists? For now, any admin of a hub whose list it's on, with history saying which hub made the change.
