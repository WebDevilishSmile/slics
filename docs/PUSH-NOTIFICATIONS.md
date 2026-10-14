# PUSH-NOTIFICATIONS.md

Plan and checklist for web push notifications: the admin first, then drivers' tip
replies, then cover bidding. Built in stages; check items off as they ship.

**How to use this:** stages go in order. Each item says where the code lives. Run
`npm run build` (in a scratch copy, never while `next dev` runs) before shipping any item.
The app is used daily in production.

## Status (2026-10-12)

**Stage 1 live** for admins (working on the admin's phone as of 2026-10-12). **Stage 1b
built 2026-10-12, not deployed:** each admin chooses which kinds
they get, with eight new kinds and a send log. Before it ships, run `npm run db:indexes`
(the log's TTL). Stages 2 and 3 aren't started.

---

## Why

Today the app can only tell someone about something while they have it open: the `/admin`
banners and the header-menu badge for job changes and SLIC reports, and the "new since
last visit" count on Driver tips. A reply to a driver's tip waits until they happen to
look up that SLIC again, and cover bidding (`TODOS.md` → Features → User) will need a "your
pick is up" that reaches a driver who isn't looking at the app.

Web push does this from the web app, with no App Store, no native app and no Apple
developer account.
- **Android:** works in Chrome, installed or not.
- **iPhone:** works from iOS 16.4, but only in the app added to the home screen, never in
  a Safari tab.
- **Desktop:** Chrome, Edge, Firefox and Safari all work.
- **Cost:** the push services (Apple's, Google's, Mozilla's) are free. The `web-push` npm
  package does the sending.

## Ground rules

- **Push only, never a cache.** `public/sw.js` handles `push` and `notificationclick`, plus
  the two lifecycle lines (`install` → `skipWaiting`, `activate` → `clients.claim`, so a
  fix takes over at once and a tap can navigate the page that turned them on). It has **no `fetch` handler, ever**, so it never comes between a page and
  the network. That avoids the stale-cache failure that kept the app from having a
  service worker (`CLAUDE.md` → "PWA").
- **Opt-in only.** The service worker is registered inside the tap that turns
  notifications on, never on page load, so a driver who doesn't opt in never downloads it.
  Turning them off cancels the subscription, deletes its row and unregisters the service
  worker.
- **Ask with a reason, on a tap.** Never call `Notification.requestPermission()` on page
  load. A "Don't Allow" sticks, and undoing it means a trip into the phone's settings.
- **A nudge, never the only way.** Everything a push says is also in the app: the
  banners, the badge, the thread, the cover page. If a push doesn't arrive, nothing is
  lost, and nobody is skipped in a bid because a push failed.
- **Lock-screen safe.** A notification shows a SLIC number and what happened, and nothing
  more: no addresses, no phone numbers, no other driver's name. Payloads are encrypted in
  transit, but a lock screen isn't private.
- **Sending never breaks the request that triggered it.** `lib/push.js` never throws, and
  routes send it inside `after()` (`next/server`) so the response doesn't wait. It
  fails open, like `lib/rateLimit.js`.
- **One row per device.** A subscription belongs to one browser on one device, not to
  the account. A driver with a phone and a tablet has two rows. Rows the push service
  reports as gone (404/410) are deleted on the next send.

---

## Stage 1 — Admin-only: job changes and SLIC reports

Only admins see the toggle, and the routes are `requireAdmin()`. Drivers' devices are
untouched.

- [x] **Keys:** `npx web-push generate-vapid-keys` once. Done for `.env`, `.env.example` and
      `OPERATIONS.md` (2026-10-10), and on Vercel (stage 1 shipped 2026-10-11, `TODOS.md`). Add
      `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT`
      (`mailto:` the admin address) to `.env`, Vercel, `.env.example` and
      `OPERATIONS.md` → Configuration and Secrets. Rotating the private key invalidates
      every subscription, so note that under Secrets.
- [x] **Dependency:** `npm i web-push` (3.6.7).
- [x] **`public/sw.js`:**
  - `push` shows `{ title, body, url, tag }` with the app icon.
  - `notificationclick` focuses an open app window and navigates it to `url`, or opens
    one.
  - The middleware matcher already skips paths with a dot, so `/sw.js` isn't redirected
    to sign-in.
  - `next.config.mjs` serves it with `Cache-Control: no-cache` and adds `worker-src 'self'`
    to the CSP.
- [x] **`lib/db/pushSubscriptions.js`:** collection `push-subscriptions`, rows
      `{ userId: ObjectId, endpoint, keys: { p256dh, auth }, createdAt, lastSentAt }`.
  - Functions: `savePushSubscription`, `deletePushSubscription(endpoint, userId)`,
    `getPushSubscriptions(userIds)`, `deleteUserPushSubscriptions(userId)`.
  - Indexes in `scripts/createIndexes.js`: unique `endpoint`, and `userId`.
  - Add the collection to `DATA-MODEL.md`.
  - `validatePushSubscription` only accepts endpoints on the browsers' push services
    (FCM, Mozilla, Apple, WNS). The server POSTs to the endpoint on every send, so any
    other URL would let a caller aim it anywhere.
  - Saving an endpoint that's already there moves it to the caller, so a shared device
    follows its latest account. `recordPushResults` deletes the gone ones and stamps
    `lastSentAt`.
- [x] **`lib/push.js` (server):** `sendPush(userIds, { title, body, url, tag })` and
      `sendPushToAdmins(payload)`.
  - Deletes rows the push service answers 404/410 for.
  - `console.error`s anything else and never throws.
  - The payload can be a function of the user id, so each admin's job-change count is
    their own. A `tag` also sets the push service's `Topic`, so an undelivered push is
    replaced too: since 2026-10-14 the Topic is a 32-character hash of the tag, because
    Apple refused some tags as they were ("Worth knowing"). TTL is 12 hours.
- [x] **`/api/users/me/push-subscriptions`:**
  - `POST` saves the subscription. It checks that `endpoint` is an `https:` URL and the
    keys are strings, and it's rate-limited per user.
  - `DELETE` removes one by `endpoint`, only if it's the caller's.
  - Stage 1 checks `requireAdmin()`.
  - "Send a test" is `POST /api/users/me/push-test`: it sends to all of the caller's
    devices and answers `{ sent, failed }`.
- [x] **`hooks/usePushNotifications.js`:** reports the state (`unsupported`,
      `needs-install` on an iPhone outside the home-screen app, `blocked`, `off`, `on`)
      and offers `enable()` and `disable()`.
  - `enable()` registers `sw.js`, asks for permission, subscribes with the public key,
    and POSTs.
  - `disable()` unsubscribes, DELETEs and unregisters.
  - `enable()` asks for permission *first*, while the tap still counts (iOS asks only
    inside one), then registers and subscribes. A failed save unsubscribes and
    unregisters again, so nothing is left behind.
  - When it finds the device on, it re-saves the subscription quietly. That restores a row
    the server dropped, and on a shared device it moves the row to whoever is signed in.
    A subscription made with an old public key counts as off, and `enable()` replaces it.
- [x] **Toggle on `/profile`** (`components/profile/`, admins only for now): soft style,
      one line on what it sends, and a "Send a test" button.
  - `needs-install` opens `install/IosInstallDialog.jsx`.
  - `blocked` explains where the phone's setting is.
  - Built as `profile/PushNotifications.jsx`, an inset well under the details.
- [x] **Triggers:**
  - **Job changes:** after `refreshJobsTab` saves changes (`lib/onCallSheetSync.js`),
    push the admins "N job changes on the Jobs tab", linking `/admin/jobs`. Reuse one
    `tag` so a burst of sheet pings replaces the notification instead of stacking.
    Built: the body is each admin's own unseen changes (`getUnseenJobChangeRows` since
    their `jobChangesSeenAt`), and nobody is sent one with nothing new. The admin who
    pressed Refresh isn't sent one. Since 2026-10-14 it names them ("LV93 driver changed
    and LV57 times changed", or "7 jobs added, 1 removed, 2 changed" past three jobs)
    instead of "3 new changes on the Jobs tab".
  - **SLIC reports:** after `createSlicReport` in `app/api/slic-reports/route.js`, push
    "New report on SLIC 1809", linking `/admin/reports`. Built: the body is the kind
    ("Wrong phone number"), never the driver's note. A driver re-reporting the same thing
    (which updates their open report) sends nothing, and an admin filing one isn't sent
    their own.
- [x] **Account deletion:** `deleteUserAccount` (`lib/db/users.js`) calls
      `deleteUserPushSubscriptions`.
- [x] **`CLAUDE.md` → "PWA":** replace "no service worker" with the ground rules above
      (push only, no `fetch` handler, registered on opt-in).

## Stage 1b — Admin notification choices (built 2026-10-12)

Each admin picks which kinds they get. Still admin-only; the kinds are things only admins
see in the app. The super admin's view of all of it is `/admin/super/notifications`
(`SUPER-ADMIN-HUB.md` stage C).

- [x] **The kinds:** `PUSH_TYPES` in `constants.js`, each `{ key, label, description, group,
      audience, defaultOn }`. Job changes and SLIC reports are on by default, so nothing
      changed for anyone. Every new kind is off until an admin turns it on, so no admin was
      flooded. Buy Me a Coffee is `audience: 'superAdmin'`, offered and sent to super admins
      only.
- [x] **Per account, not per device:** `users.pushPrefs[key]`, missing meaning the default.
      `getPushAudience(key)` (`lib/db/users.js`) is one query for the admins who get a kind;
      `sendPushToAdmins(type, payload, { except })` uses it.
- [x] **`PATCH /api/users/me/push-prefs { key, on }`:** `requireAdmin()`. An unknown key is
      400, and a super-admin kind from another admin is 403. Rate-limited per admin.
- [x] **On `/profile`:** once the device is on, `profile/PushTypeSwitches.jsx` lists the kinds
      under "Send me", grouped, each a whole-row switch that saves on its own (put back with
      an Alert if the save fails) and speaks "Tips on" in the live region. The line under the
      device switch is now "On this device."
- [x] **One file writes every payload:** `lib/pushEvents.js`, one `notifyX()` per kind, so
      the lock-screen rule is checked in one place. Routes call them inside `after()`, and
      the admin whose action set one off never gets it.
- [x] **The new kinds and where they fire:**
  - **Cover jobs:** `refreshCoverWeek` when a week's jobs change ("posted" when the week had
    none). Links `/admin/cover/jobs?week=…`, which now opens on that week. Since
    2026-10-14 it's on by default and works like job changes: each admin's unseen
    `cover-job-changes`, week by week ("W/E 10/24/2026: SH16 added and LV92 times
    changed."), one tag for all weeks, with a banner and badge behind it
    (`ON-CALL-SHEET-SYNC.md`, "Alerts for cover weeks"). Job numbers only: a cover job's
    name is a driver's.
  - **Cover picks:** `refreshCoverWeek` when picks change, as a count of drivers, never
    names. One tag per week, so a live bid updates one notification.
  - **Tips:** `POST /api/comments`, tips and replies, only for a SLIC that exists. Never the
    text. One tag per SLIC.
  - **Driver claims:** `POST /api/driver-claims`, a new claim only, not an edit.
  - **Cover list disputes** (on by default, added 2026-10-12): `POST /api/cover-disputes`,
    "This is a mistake" on `/covers`, a new dispute only. Never the name or the note.
  - **Sign-ups:** `POST /api/auth/register` and `auth.js` `events.createUser` (Google).
  - **Places:** `POST /api/places` and `POST /api/place-comments`.
  - **SLIC edits** by another admin: create, edit (only when something changed), delete and
    the PDF.
  - **Buy Me a Coffee:** every new signed webhook event, with the kind and the amount
    (decided 2026-10-12), never the supporter's name, email or message. Known types get a
    label; any other goes out as "Buy Me a Coffee: <type>", so a renewal arrives whatever
    BMC calls it.
- [ ] **Renewals:** BMC doesn't publish its event names, and no renewal has reached the app
      yet. Tick every event in BMC → Webhooks, and when the first renewal arrives, add its
      `type` to `SUPPORT_TITLES` in `lib/pushEvents.js` (and `TYPE_LABELS` in
      `admin/supporters/SupportersView.jsx`). If BMC sends no webhook for a renewal, the app
      can't know about it.
- [x] **The send log:** `sendPush` writes a `push-log` row for every send that reached a
      device, and for every test, sample and written message (`lib/db/pushLog.js`, TTL 90
      days). No recipient ids, no body text. Its `failed` includes gone devices (404/410),
      which `recordPushResults` removes; only `failed - gone` counts as a failure on the
      super admin's pages, and the super admin can clear those once looked at (Clear
      failures, `SUPER-ADMIN-HUB.md` stage C).

## Stage 2 — Drivers: replies to their tips

- [ ] Show the toggle to every signed-in driver, and switch the subscription routes (and
      `push-test`) to `requireUser()`.
- [ ] **Signing out on a shared device:** the device's row stays with the account that
      turned it on until someone signed in opens `/profile`. In stage 1 only admins hold
      rows. Once drivers do, decide whether signing out should unsubscribe the device.
- [ ] **Per-type switches:** built for admins in stage 1b (`PUSH_TYPES`, `users.pushPrefs`,
      `profile/PushTypeSwitches.jsx`). For drivers, add `audience: 'driver'` kinds (a
      `tipReplies` key), let `pushTypesFor` offer them to everyone, and open the prefs route
      to `requireUser()`.
- [ ] **Tip replies:** when `createComment` (`lib/db/comments.js`) saves a reply, push
      "New reply on your tip at SLIC 1809" to the top-level tip's author and to the
      thread's earlier repliers, never to the replier. Link `/home?slic=1809`. Use one
      `tag` per thread, so a busy thread is one notification.
- [ ] **Places:** the same for place comments (`lib/db/places.js`). Places (`/places`)
      opened to every driver on 2026-10-12, so this no longer waits on it.
- [ ] **Privacy page** (`app/privacy/page.jsx`): what's kept (one push address per device
      a driver turns notifications on for), and how to turn it off.
- [ ] **Telling drivers about it:** a line in the profile and in a "What's new"
      (`RECOMMENDATIONS.md` #10). Never a prompt on page load.

## Stage 3 — Cover bidding: "your pick is up"

This waits on driver verification and in-app bidding (`TODOS.md` → Features → User).

- [ ] **"Your pick is up":** when the driver before them picks, triggered by the event
      itself. That's the sheet webhook (`syncFromSheet`) while picks happen in the sheet,
      or the in-app pick once bidding moves here. No timer is needed.
- [ ] **"Your pick is in about 10 minutes"** needs a scheduler. The Vercel cron here runs
      once a day (`vercel.json`), and running every minute may need a paid plan. Decide
      when stage 3 starts, or leave this one out.
- [ ] The cover page stays the source of truth. A push that fails or arrives late never
      changes anyone's turn.

---

## Verifying

- **Desktop Chrome on `localhost`:** push works over `http://localhost`. In DevTools →
  Application → Service workers, the "Push" button fires a test without the server.
- **Android:** Chrome on the deployed site (a preview deployment is fine).
- **iPhone:** add the deployed site to the home screen, open it from there, turn
  notifications on, send a test, then lock the phone. This can't be tested on
  `localhost`.
- **Turning off:** the row is gone from `push-subscriptions`, and
  `navigator.serviceWorker.getRegistrations()` is empty.
- **During stage 1, as a driver account:** no toggle on `/profile`, no service worker
  registered, and `POST /api/users/me/push-subscriptions` answers 403.
- **Expired subscriptions:** remove the home-screen app or revoke the permission, trigger
  a send, and check that the row was deleted.
- **A failing send:** with a bad private key, a SLIC report still saves and answers
  normally, and the error is in the logs.
- `npm run lint` and `npm run build`.

## Worth knowing

- **iPhone:** iOS 16.4 or later, and only from the home-screen app. The install nudge on
  `/home` and the menu's install entry are how drivers get there.
- **Sticky permission:** a "Don't Allow" can't be asked again from the app.
- **Delivery isn't guaranteed.** Do Not Disturb, Focus modes and Android's battery
  saving can delay or drop a push, and there's no delivery receipt.
- **The keys identify the server, not an account.** No Apple or Google sign-up is
  involved. A subscription made with one public key only works with its private key.
- **Apple decodes the `Topic` header** (found 2026-10-14). A topic must be base64url, and
  a length that leaves 1 when divided by 4 can't be base64, so Apple answers
  `400 {"reason":"BadWebPushTopic"}`. The tags `driver-claims` (13 characters) and
  `cover-jobs-2026-10-24` (21) were sent as they were, so those two kinds failed on
  every iPhone from 2026-10-12 while Android and desktop got them: `push-log` showed
  "sent 1, failed 3" on each. `cover-picks-…` (22) and `sign-ups` (8) happened to pass.
  `lib/push.js` now hashes every tag into a 32-character topic. If one kind fails on a
  single platform, check the reason in the Vercel logs ("Push to web.push.apple.com
  failed").
