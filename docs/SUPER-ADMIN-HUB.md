# SUPER-ADMIN-HUB.md

The super admin's hub at `/admin/super`: one place to read and manage the whole app. It
covers the numbers, usage over time, everything happening, push notifications, the
system's health and the feature switches. Admins and Supporters stay where they were, as
cards on the hub. Built in stages; check items off as they ship.

Since 2026-10-16 the Admins page is also where staff roles are managed
(`STAFF-ROLES.md`): a switch per admin tool for the Admin and Dispatch roles, admins and
dispatchers listed apart, and adding someone as either. The hub's Admins card counts
dispatchers too.

**How to use this:** each stage can be deployed on its own, in order. Feature switches are
last because they touch the Covers gate. Run `npm run build` in a scratch copy, never while
`next dev` runs, before shipping any of it. The app is used daily in production.

## Status (2026-10-12)

**Stages A–F built 2026-10-12, not deployed.** Lint and a scratch build pass. Every data
function was run read-only against the database; the activity feed paged 120 rows with no
gaps or repeats. Signed out, every new route answers 401 and every page redirects.

Before it ships:
- Run `npm run db:indexes`. It creates `slicViews.viewedAt`, the `push-log` TTL and, from the
  cover-list work, three on `cover-preferences`. `/admin/super/health` lists any still
  missing.
- Restart `next dev` after pulling: `@mui/x-charts` was added.
- Go through "Verifying" signed in as the super admin, on a phone.

## Why

The super admin's view of the app was spread across `/admin` banners, two pages under
`/admin/super`, the Vercel and Atlas dashboards, and three constants that needed a deploy to
change. Push notifications had one switch per device and two fixed kinds. The admin asked
for more kinds, a way to choose them, and then for `/admin/super` to become "a central hub
for managing and reading data and features in our entire app" (2026-10-12).

## Ground rules

- **Super admin only, checked everywhere.** Every page under `/admin/super` calls
  `isSuperAdmin(await getSession())` before reading anything. The layout's redirect isn't
  the boundary (`SECURITY.md` #7). Every new route starts with `requireSuperAdmin()`.
- **Read-only, except what's named.** The only writes are samples and written notifications
  (Stage C) and the feature switches (Stage F). Each written notification and each switch
  goes to `admin_audit` before it happens.
- **One section failing never breaks the page.** Each hub part loads on its own and shows an
  inline Alert in its place. A health check that throws becomes an error in its own card.
- **Keys are set or not set, never values.** The health page is HTML like any other. Not even
  a value's length is shown.
- **Each admin chooses their own notifications.** The hub shows every admin's devices and
  kinds but doesn't change them (decided 2026-10-12).
- **Driver text is text.** Tip and comment snippets in the feed are plain text, rendered as
  text (`SECURITY.md` #2).
- **Lock screens aren't private.** Every payload is written in `lib/pushEvents.js`: a SLIC
  number or a week and what happened. Never a name, email, address, phone number, or tip or
  note text. Buy Me a Coffee shows the kind and the amount (decided 2026-10-12).
- **Stable API strict.** The shared client (`lib/db/client.js`) rejects commands outside
  Stable API v1, like `distinct`. Count distinct values with a `$group`.
- **Times are New York's.** The hub formats in `America/New_York`
  (`admin/hub/format.js`), so the server's render and the phone's hydration print the same
  text.

---

## Stage A — Notification choices and new kinds (built 2026-10-12)

The detail is in `PUSH-NOTIFICATIONS.md` stage 1b.

- [x] `PUSH_TYPES` (`constants.js`), `users.pushPrefs`, `getPushAudience` /
      `getPushPrefs` / `setPushPref` (`lib/db/users.js`), and
      `PATCH /api/users/me/push-prefs`.
- [x] `lib/pushEvents.js` writes every payload. `sendPushToAdmins(type, …)` sends to the
      admins who chose that kind.
- [x] Ten kinds:
  - on by default: job changes, SLIC reports;
  - off by default: cover jobs, cover picks, tips, driver claims, sign-ups, Places, SLIC
    edits by another admin, Buy Me a Coffee (super admin).
- [x] `profile/PushTypeSwitches.jsx` under the device switch on `/profile`.
- [x] `/admin/cover/jobs?week=YYYY-MM-DD` opens on that week (the cover notifications link
      there).
- [x] The first Buy Me a Coffee renewal: label its `type` (`PUSH-NOTIFICATIONS.md`).
      It came 2026-10-14 as `membership.updated`, which also carries a failed charge;
      `BMC-SUPPORT.md`, "Renewals".

## Stage B — Hub, At a glance and usage (built 2026-10-12)

- [x] `app/admin/super/page.jsx` → `admin/hub/HubView.jsx`. It has four sections:
  - **At a glance**, in `HubTiles.jsx`:
    - lookups today, this week and in 30 days;
    - active drivers;
    - accounts, and how many are new;
    - tips;
    - open reports;
    - pending claims;
    - members;
    - SLICs and PDFs;
    - Places.

    A tile with a page to go to is a link.
  - **Manage:** a `HubCard.jsx` each for Notifications, Activity, System health, Features,
    Admins and Supporters, each with a live line and, where it matters, a status.
  - **Usage:** described in the next item.
  - **Latest activity:** the 8 newest rows, with "See all".
- [x] **Usage charts** (`UsageCharts.jsx`, `@mui/x-charts` 8):
  - Lookups per day over 30 days.
  - Sign-ups per week over 12 weeks, the weeks ending on Saturday.
  - Both use the scheme's blue with no legend (one series each), a tooltip per column, and
    a Table toggle.
  - Both blues pass the `dataviz` validator against their surfaces.
  - **Most looked-up SLICs** (`TopSlics.jsx`) is a ranked list with inline bars, not a
    chart: ten long names read better that way on a phone.
- [x] **Data:** `lib/db/hub.js`.
  - Sign-ups and tips are dated by `_id`, because `created_at` types vary.
  - Active drivers is a `$group`, not `distinct` (the Stable API).
  - Weeks use `$dateTrunc` in New York time.
- [x] **Smaller pieces:**
  - The Supporters card's line is `getSupportSummary` (`lib/db/bmcEvents.js`): the last 30
    days, cancellations and refunds left out.
  - New index: `slicViews.viewedAt`.

## Stage C — Notifications (`/admin/super/notifications`, built 2026-10-12)

- [x] **`push-log`** (`lib/db/pushLog.js`), written by `sendPush`. It logs every send that
      reached a device, and every test, sample and written message. TTL 90 days.
- [x] **`NotificationsView.jsx`** has these sections:
  - **Overview:** status, admins with a device, devices, and sends today and this week.
    **Clear failures** (since 2026-10-13) acknowledges the failures so far: the warning
    here, on the hub card and in System health counts only failures this week after the
    mark (`open` from `getPushStats`). The log rows stay, their errors shown in gray with
    "cleared". The button turns to **Undo** for 10 seconds. Both are written to
    `admin_audit` (`push.failuresCleared`, `push.failuresClearUndone`), and the mark is the
    `app-settings` doc `push`. A gone device (404/410) is never a failure: it's
    `failed - gone` that counts.
  - **Admins and devices:** each device's push service, read from the endpoint's host (the
    endpoint itself never leaves the server), when it was turned on and when it last
    received something. Plus the kinds each admin chose.
  - **Kinds:** for each, who it reaches, how many went out this week, when it last went out,
    and **Send me a sample**. The sample goes to your own devices with made-up details and
    "(Sample)".
  - **Write a notification** (`ComposeNotification.jsx`):
    - a title (60 characters at most), text (180 at most), and the page it opens, which must
      be a path on this site (`safeCallbackUrl`);
    - sent to every admin with a device, or to one;
    - it asks first, and it's recorded as `push.composed`.
  - **Recent sends:** with Load more.
- [x] **Routes**, all behind `requireSuperAdmin()`: `GET /api/push-log?before=`,
      `POST /api/push/sample`, `POST /api/push/compose`, `POST`/`DELETE /api/push-log/clear`.
      Each is rate-limited.

## Stage D — Activity (`/admin/super/activity`, built 2026-10-12)

- [x] **`lib/db/activity.js` `getActivity({ before, kinds, limit })`:** each source reads up
      to `limit + 10` rows at or before the cursor. The rows are merged and sorted by
      (time, id), and the cursor is `<ISO>|<id>`, so rows sharing a time are neither lost nor
      repeated.
- [x] **Sources:**
  - sign-ups;
  - tips and replies;
  - SLIC reports;
  - claims, filed and decided;
  - SLIC history;
  - Jobs-tab changes, one row per read;
  - cover pick changes, one row per read per week;
  - Places and place comments;
  - Buy Me a Coffee;
  - `admin_audit` (`auditText`, exported from `lib/db/admins.js`);
  - `push-log`.

  A source that fails is logged and left out; the rest still show. Sources dated by ISO
  strings only read ISO rows, so an old `MM/DD/YY` string can't sort among them.
- [x] **`ActivityFeed.jsx`:** filter chips (`ACTIVITY_KINDS` in `constants.js`) in one row
      above the list, and Load more. `GET /api/activity?before=&kinds=`.

## Stage E — System health (`/admin/super/health`, built 2026-10-12)

- [x] **`lib/systemHealth.js` `getSystemHealth()`:** each check is `ok`, `warning`, `error`
      or `info`, shown as an icon and a word.
  - **Deploy:** the Vercel environment, commit, branch and region.
  - **Database:** a ping.
  - **Keys:** every key in `.env.example`, grouped, set or not.
  - **On-call sheet:**
    - the Jobs tab's last read (a warning past 26 hours, meaning the daily cron missed);
    - the last ping;
    - the current weeks;
    - failed reads.
  - **Push:** the keys, devices, and failures this week.
  - **Email:** the Resend key. Sends aren't logged by the app.
  - **PDF migration:** how many SLICs are still on Supabase.
  - **Indexes:** the live indexes compared with the list.
  - **Unused collections:** row counts for `cover` and `bid-jobs`.
- [x] **The index list moved** to `lib/db/indexSpecs.mjs`, plain data.
      `scripts/createIndexes.js` keeps its name and loads it with `import()`.
- [x] **`HealthView.jsx`:** one card per check, with "Check again", which reruns them on the
      server.

## Stage F — Feature switches (`/admin/super/features`, built 2026-10-12)

- [x] **`app-settings`** (`lib/db/appSettings.js`): `coversOpen`, `placesNewUntil`,
      `iconChangedAt`.
  - The `constants.js` values are the defaults: a missing doc or field uses them, and
    deleting the doc is the rollback.
  - `getFeatures()` is cached 5 minutes across requests and dropped by `revalidateTag` on
    every change. A failed read uses the defaults, so Covers fails closed.
- [x] **The session carries them.** `auth.js`'s jwt callback adds
      `features: { coversOpen, placesNewUntil }`, and the session callback copies them to
      `session.features`. This means:
  - `canUseCovers` / `coversOpen(session)` (`lib/authz.js`) stay synchronous, so no call
    site changed.
  - The header menu gets them through `Header` → `HeaderBar` → `UserMenu`.
  - `/profile` passes `coversOpen`.
  - `isIconNoticeDue` reads `iconChangedAt`.
  - The Edge config is untouched, because the middleware doesn't gate Covers.
- [x] **`FeaturesView.jsx`:**
  - **Covers for every driver:** a switch with a confirm that names what opens and points
    at `COVER-BIDDING.md`'s rollout checklist.
  - **Places "New" until:** a date, Save, and End now.
  - **New-icon notice:** Ask again, with a confirm.
  - Each row shows who last changed it and when, or "The code's default".
  - Every change is `feature.changed` in `admin_audit`.
- [x] **`PATCH /api/features { key, value }`:** `requireSuperAdmin()`, validated
      (`validateFeature`), rate-limited.
- [ ] The landing page still leaves Covers off by hand. Opening Covers doesn't add it there.

---

## Verifying

- **Signed out** (done 2026-10-12 on a scratch build): the six new routes answer 401, and
  `/admin/super` and its pages redirect to sign-in.
- **As an admin who isn't super:** `/admin/super/*` redirects to `/admin`. The hub's routes
  answer 403. `PATCH /api/users/me/push-prefs` with `support` answers 403.
- **As the super admin, desktop and phone, light and dark:**
  - **The hub:**
    - the tiles match what `/admin/users` and `/admin/reports` say;
    - the charts show 30 days and 12 weeks;
    - Table toggles each chart;
    - each card opens its page.
  - **`/profile`:**
    - with the device on, the kinds show;
    - flip Tips on, reload, and it stays on;
    - post a tip from a driver account and it arrives; turn Tips off and it doesn't.
  - **Notifications:**
    - "Send me a sample" arrives with "(Sample)" and shows in Recent sends;
    - a written notification to yourself arrives;
    - an outside URL in "Opens" is refused;
    - an `admin_audit` row is written.
  - **Activity:** Load more has no gaps or repeats, the chips filter, and a tip with
    `<b>` in it shows the tag as text.
  - **Health:** after `npm run db:indexes` the Indexes card is OK, and no key value appears
    in the page source.
  - **Features:**
    - Places "New" to yesterday, then the menu on another browser loses "New" within 5
      minutes;
    - set it back;
    - don't flip Covers until the rollout checklist is done.
- **Cron:** `GET /api/cron/on-call-sheet-sync` with `CRON_SECRET` has no actor, so the
  admins who chose cover jobs and cover picks get them.
- **Buy Me a Coffee:**
  - Send a signed local test body (`donation.created`, $5, an email that matches no
    account), the way it was tested on 2026-10-10. The super admin should get "New coffee ·
    $5.00".
  - Send it again: nothing.
  - Delete the test rows (`bmc-events`, `push-log`) afterwards.
