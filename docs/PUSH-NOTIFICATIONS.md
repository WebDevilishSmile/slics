# PUSH-NOTIFICATIONS.md

Plan and checklist for web push notifications: the admin first, then drivers' tip
replies, then cover bidding. Built in stages; check items off as they ship.

**How to use this:** stages go in order. Each item says where the code lives. Run
`npm run build` (in a scratch copy, never while `next dev` runs) before shipping any item.
The app is used daily in production.

## Status (2026-10-10)

**Not started.** Planned on 2026-10-10 and parked until it's needed. Nothing here is built.

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

- **Push only, never a cache.** `public/sw.js` handles `push` and `notificationclick` and
  nothing else. It has **no `fetch` handler, ever**, so it never comes between a page and
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

- [ ] **Keys:** `npx web-push generate-vapid-keys` once. Add
      `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT`
      (`mailto:` the admin address) to `.env`, Vercel, `.env.example` and
      `OPERATIONS.md` → Configuration and Secrets. Rotating the private key invalidates
      every subscription, so note that under Secrets.
- [ ] **Dependency:** `npm i web-push`.
- [ ] **`public/sw.js`:**
  - `push` shows `{ title, body, url, tag }` with the app icon.
  - `notificationclick` focuses an open app window and navigates it to `url`, or opens
    one.
  - The middleware matcher already skips paths with a dot, so `/sw.js` isn't redirected
    to sign-in.
- [ ] **`lib/db/pushSubscriptions.js`:** collection `push-subscriptions`, rows
      `{ userId: ObjectId, endpoint, keys: { p256dh, auth }, createdAt, lastSentAt }`.
  - Functions: `savePushSubscription`, `deletePushSubscription(endpoint, userId)`,
    `getPushSubscriptions(userIds)`, `deleteUserPushSubscriptions(userId)`.
  - Indexes in `scripts/createIndexes.js`: unique `endpoint`, and `userId`.
  - Add the collection to `DATA-MODEL.md`.
- [ ] **`lib/push.js` (server):** `sendPush(userIds, { title, body, url, tag })` and
      `sendPushToAdmins(payload)`.
  - Deletes rows the push service answers 404/410 for.
  - `console.error`s anything else and never throws.
- [ ] **`/api/users/me/push-subscriptions`:**
  - `POST` saves the subscription. It checks that `endpoint` is an `https:` URL and the
    keys are strings, and it's rate-limited per user.
  - `DELETE` removes one by `endpoint`, only if it's the caller's.
  - Stage 1 checks `requireAdmin()`.
- [ ] **`hooks/usePushNotifications.js`:** reports the state (`unsupported`,
      `needs-install` on an iPhone outside the home-screen app, `blocked`, `off`, `on`)
      and offers `enable()` and `disable()`.
  - `enable()` registers `sw.js`, asks for permission, subscribes with the public key,
    and POSTs.
  - `disable()` unsubscribes, DELETEs and unregisters.
- [ ] **Toggle on `/profile`** (`components/profile/`, admins only for now): soft style,
      one line on what it sends, and a "Send a test" button.
  - `needs-install` opens `install/IosInstallDialog.jsx`.
  - `blocked` explains where the phone's setting is.
- [ ] **Triggers:**
  - **Job changes:** after `refreshJobsTab` saves changes (`lib/onCallSheetSync.js`),
    push the admins "N job changes on the Jobs tab", linking `/admin/jobs`. Reuse one
    `tag` so a burst of sheet pings replaces the notification instead of stacking.
  - **SLIC reports:** after `createSlicReport` in `app/api/slic-reports/route.js`, push
    "New report on SLIC 1809", linking `/admin/reports`.
- [ ] **Account deletion:** `deleteUserAccount` (`lib/db/users.js`) calls
      `deleteUserPushSubscriptions`.
- [ ] **`CLAUDE.md` → "PWA":** replace "no service worker" with the ground rules above
      (push only, no `fetch` handler, registered on opt-in).

## Stage 2 — Drivers: replies to their tips

- [ ] Show the toggle to every signed-in driver, and switch the subscription routes to
      `requireUser()`.
- [ ] **Per-type switches** on the user row (`pushPrefs: { tipReplies: true }`), shown
      under the toggle, applied to all of a driver's devices. Each later type adds a key.
- [ ] **Tip replies:** when `createComment` (`lib/db/comments.js`) saves a reply, push
      "New reply on your tip at SLIC 1809" to the top-level tip's author and to the
      thread's earlier repliers, never to the replier. Link `/home?slic=1809`. Use one
      `tag` per thread, so a busy thread is one notification.
- [ ] **Places:** the same for place comments (`lib/db/places.js`) once
      `/whip-it-in-and-out` is open to drivers.
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
