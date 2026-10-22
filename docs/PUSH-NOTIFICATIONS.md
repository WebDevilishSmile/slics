# PUSH-NOTIFICATIONS.md

Plan and checklist for web push notifications: the admin first, then drivers' tip
replies, then verified cover drivers' reminders and lists. Built in stages; check items
off as they ship.

**How to use this:** stages go in order. Each item says where the code lives. Run
`npm run build` (in a scratch copy, never while `next dev` runs) before shipping any item.
The app is used daily in production.

## Status (2026-10-22)

**Stage 1 live** for admins (working on the admin's phone as of 2026-10-12). **Stage 1b
built 2026-10-12** and shipped with the super admin hub (`TODOS.md` checked it off
2026-10-14): each admin chooses which kinds they get, with eight new kinds and a send
log. **Stage 2 built and deployed 2026-10-14 with its switch off** (below): admins
already get the two reply kinds; drivers get nothing until the super admin turns on
"Notifications for every driver", after "Verifying stage 2". **Stage 3 built 2026-10-22**
(below, not deployed yet): verified cover drivers can turn notifications on before that
switch, and get call-in reminders on bid day, their list's jobs taken, their call-in
time and the week's cover jobs. Its checks are "Verifying stage 3".

---

## Why

Today the app can only tell someone about something while they have it open: the `/admin`
banners and the header-menu badge for job changes and SLIC reports, and the "new since
last visit" count on Driver tips. A reply to a driver's tip waits until they happen to
look up that SLIC again, and cover bidding (`COVER-BIDDING.md`) will need a "your
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
      **Since 2026-10-16** each admin kind also names its `area`, the admin tool it's about
      (`STAFF-ROLES.md`): it's offered and sent to admins only while the Admin role has
      that tool, and always to super admins. Dispatchers get no notifications yet.
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
- [x] **Renewals** (2026-10-14): a renewal comes as `membership.updated`, and so does a
      failed charge. The push now says which, from the status and period BMC sends:
      "Membership renewed" with the amount, "Membership payment failed" with "The $5.00
      charge didn't go through.", or "Membership renewal paid" when a retry goes through
      (`UPDATE_TITLES` in `lib/pushEvents.js`; `BMC-SUPPORT.md`, "Renewals"). Other
      updates stay "Membership updated". Whether every event is ticked in BMC → Webhooks
      is still to check (monthly support's renewals would be `recurring_donation.updated`).
- [x] **The send log:** `sendPush` writes a `push-log` row for every send that reached a
      device, and for every test, sample and written message (`lib/db/pushLog.js`, TTL 90
      days). No recipient ids, no body text. Its `failed` includes gone devices (404/410),
      which `recordPushResults` removes; only `failed - gone` counts as a failure on the
      super admin's pages, and the super admin can clear those once looked at (Clear
      failures, `SUPER-ADMIN-HUB.md` stage C).

## Stage 2 — Every signed-in driver: tip and place replies (built 2026-10-14)

Stages 1 and 1b are live, but only for admins. Drivers still see a reply to their tip only
when they happen to look up that SLIC again. Stage 2 lets every signed-in driver turn
notifications on and sends them a push when someone replies in their tip threads on SLICs
or comments in their threads on Places.

**Decided with the user (2026-10-13):**

- **Rollout:** behind a "Notifications for every driver" switch on
  `/admin/super/features`, off by default. Turning it off again is the rollback, and it
  also stops sends to drivers.
- **Sign out turns this device off:** unsubscribe, delete the row, unregister the worker.
- **Places:** a reply goes to the thread's earlier commenters. A new top-level comment
  goes to the driver who added the place.
- **Discovery:** a nudge right after a driver posts, plus the `/profile` line and a `/help`
  guide. Never a prompt on page load.
- **Driver kinds are on by default.** A driver has already opted in by turning the device
  on, and with the kinds off a device that's on would get nothing.

**Built 2026-10-14** in the seven commits below, each built and deployed with the switch
off. Where the build differs from this plan:

- The cached reader is `getFeatures` (`lib/db/appSettings.js`); there's no
  `getAppSettings`.
- `addPlaceComment` returns the place's `placeCreatedBy` with `threadId`, so the send needs
  no second read of the place.
- `getThreadParticipants` and `getPlaceThreadParticipants` share one aggregate,
  `threadParticipants` in `lib/db/comments.js`. A comment's `userId` is a string, an old
  one's may be an ObjectId, and a deleted placeholder's is null; the ids come back as
  unique strings.
- The teardown is `lib/pushDevice.js` (a client helper, not a hook): `removeThisDevice()`,
  which throws, for the `/profile` switch, and `turnOffThisDevice()`, which never throws
  and gives up after 3 seconds, for sign-out and account deletion.
- The nudge is `components/push/PushNudge.jsx`. Inside a place's raised card it's a
  pressed-in well (`inset`). After a tap it says "Notifications on", or that the device
  blocked them.
- The `/help` guide ("Get a notification when someone replies", under Driver tips &
  reports) has `feature: 'pushOpen'`: `visibleHelpSections` shows it only while the switch
  is on.
- On `/admin/super/notifications`, "Drivers with a device" replaced "Devices on", whose
  count moved under the admins'.
- Admins get the reply kinds now, switch off or on: an admin who wrote in a thread gets
  "New reply on SLIC …".

### 2.1 The switch and the gate

- [x] `constants.js`: `PUSH_OPEN = false` as the default.
- [x] `lib/db/appSettings.js`: add `pushOpen` to `FEATURE_DEFAULTS`, labels and the reader,
      the same way as `coversOpen`. Add the switch to the `/admin/super/features` UI, which
      writes `admin_audit` like the others.
- [x] `auth.js`: put `pushOpen` in `session.features`, including the fallback object.
- [x] `lib/authz.js`: add `canUsePush(session)` (an admin, or anyone once `pushOpen` is
      on). Add `requirePush()`, which is `requireUser()` plus a 403 `{ error }` when the
      gate is closed. Model both on `canUseCovers`/`requireCovers`.
- [x] Switch `app/api/users/me/push-subscriptions`, `push-test` and `push-prefs` from
      `requireAdmin()` to `requirePush()`.
- [x] In `push-prefs`, an `audience: 'admin'` kind from a non-admin answers 403, the same
      way a super-admin kind from another admin already does.
- [x] `app/profile/[id]/page.jsx`: load `getPushPrefs` when `canUsePush(session)` is true
      and pass `canUsePush` down. In `ProfileData.jsx`, change the `role === 'admin'` check
      around `<PushNotifications>` to `canUsePush`.

### 2.2 Driver kinds

- [x] `constants.js` `PUSH_TYPES`: add two kinds first, so a driver's list and an admin's
      list both open on them:
  - `tipReplies`: group Your tips, label Replies. Description: "Someone replies to your
    tip, or after you in a thread." `audience: 'driver'`, `defaultOn: true`.
  - `placeComments`: group Places, label Comments. Description: "A comment on a place you
    added, or a reply after you in a thread." `audience: 'driver'`, `defaultOn: true`.
- [x] `lib/db/users.js`:
  - `pushTypesFor({ admin, superAdmin })` offers driver kinds to everyone, admin kinds to
    admins and super-admin kinds to super admins.
  - `resolvePushPrefs` and `getPushPrefs` take `admin`.
  - Update the callers: the profile page, the `push-prefs` route, and
    `lib/db/pushOverview.js` (admins, so `admin: true`).
- [x] New `getDriverPushAudience(key, userIds)` in `lib/db/users.js`: one query over
      `_id ∈ userIds` with `pushPrefs.<key> ≠ false`. It adds `role: 'admin'` unless
      `pushOpen` is on (`getAppSettings`, which is cached), so closing the switch stops
      driver sends too. `getPushAudience` stays admin-only and is never called with a
      driver kind.
- `PushTypeSwitches.jsx` needs no change. It already renders whatever keys `prefs` holds,
  grouped in `PUSH_TYPES` order.

### 2.3 Who gets a reply push

- [x] `lib/db/comments.js`:
  - `createComment` also returns `threadId` (the top-level comment's `_id`).
  - New `getThreadParticipants(threadId)`: an aggregate with `$match` on
    `{ $or: [{ _id }, { parentId }], deleted: { $ne: true } }` and `$group` on `userId`.
    Stable API strict has no `.distinct()`. It returns `{ authorId, userIds }`, where
    `authorId` is the top-level tip's author and is `null` for a deleted placeholder.
- [x] `lib/db/places.js`:
  - `addPlaceComment` also returns `threadId`.
  - New `getPlaceThreadParticipants(threadId)`, the same shape as
    `getThreadParticipants`.
  - The place's `createdBy` comes from `getPlaceById`.
- [x] `lib/pushEvents.js`: two new `notifyX()` functions. Each send is per user, through a
      payload function, and never includes a name, text or address.
  - `notifyTipReply({ numSlic, threadId, except })`:
    - Recipients are the thread's participants minus the replier.
    - Title: "New reply on SLIC 1809".
    - Body: "Someone replied to your tip." for the tip's author, and "Someone replied
      after you." for everyone else.
    - `url` is `/home?slic=…` and `tag` is `reply-<threadId>` (30 characters, so it also
      works as the Topic).
    - It sends to `getDriverPushAudience('tipReplies', ids)` through
      `sendPush(ids, fn, { type: 'tipReplies', source: 'event' })`, and returns the ids it
      targeted.
  - `notifyPlaceComment({ placeId, threadId, isReply, except })`:
    - A reply goes to the thread's participants, with "Someone replied after you."
    - A top-level comment goes to the place's `createdBy`, with "A driver commented on a
      place you added."
    - Title: "New comment on Places". `url` is `/places` and `tag` is `place-<placeId>`.
  - Add both to `SAMPLES`, so `/admin/super/notifications` can send them.
- [x] **No double push for an admin:** `sendPushToAdmins` takes `except` as an id or an
      array. The routes run the driver send first and then the admin kinds (`notifyTip`,
      `notifyPlace`), passing `except: [replier, ...replyRecipients]`. An admin who is
      also the tip's author gets one push, not two.
- [x] Routes call them inside the existing `after()` blocks:
  - `app/api/comments/route.js`: only when `parentId` is set and the SLIC exists, the
    same check `notifyTip` already uses.
  - `app/api/place-comments/route.js`: every new comment, top-level or reply.

### 2.4 Signing out turns the device off

- [x] Move the device teardown out of `hooks/usePushNotifications.js` `disable()` into an
      exported helper, `turnOffThisDevice()`. It finds the existing registration, gets its
      subscription, DELETEs the endpoint, then unsubscribes and unregisters. It is wrapped
      in try/catch and capped at about 3 seconds, so a slow network never blocks sign-out.
      The hook's `disable()` calls the same helper.
- [x] `components/header/UserMenu.jsx`: the sign-out form's action becomes a client
      function that runs `await turnOffThisDevice()` and then `await signOutAction()`.
      React 19 allows a client function to call a server action this way. The DELETE runs
      while the session still exists.
- [x] `profile/DeleteAccountDialog.jsx`: call the same helper before `signOut`. The server
      already deletes the rows, so this only unregisters the worker on that device.
- The helper never calls `register()`. When a device has no registration, it does nothing.

### 2.5 Discovery

- [x] New `components/push/PushNudge.jsx` (or `utility/`, whichever fits better): a
      `utility/SoftNotice` reading "Get a notification when someone replies.", with a Turn
      on button and a dismiss.
  - It renders only after a successful post, in `comments/Comments.jsx` and
    `places/PlaceComments.jsx`. Mounting it then means the hook runs only for drivers who
    just posted.
  - It shows only when `canUsePush` is true (from `useSession().data.features` and
    `role`), the hook's state is `off`, and the driver hasn't dismissed it. The dismissal
    is in localStorage under `slics.pushNudgeDismissed`, with every read and write in
    try/catch.
  - Turn on calls `enable()` inside the tap. When it succeeds, the notice changes in place
    to "Notifications on" with a polite live region and `tapHaptic()`, not a toast.
  - It doesn't show for `needs-install`, `blocked` or `unsupported`; `/profile` explains
    those.
  - Before building it, check that the hook's mount path never calls `register()`. The
    ground rule is that the worker is registered only by the tap.
- [x] `components/help/guides.jsx`: add a "Notifications" guide. It covers turning them on
      from Profile, that an iPhone needs the home-screen app, what they say, and how to
      turn them off. Use the button names exactly as the page labels them.
- `/profile`: the line under the switch stays "On this device." The kinds below it explain
  the rest.

### 2.6 Super admin view

- [x] `lib/db/pushOverview.js` and its page: add a "Drivers" summary showing how many
      non-admin accounts have a device on and how many devices that is. It shows counts
      only, with no driver list. The per-kind rows for the driver kinds show admins only,
      which is fine.
- [x] `/admin/super/features`: the new switch (2.1).

### 2.7 Words and docs (same commits as the code they describe)

- [x] `app/privacy/page.jsx`, the notifications paragraph (around line 117):
  - Remove "admin-only today".
  - Say that it keeps one push address per device a driver turns on.
  - Say what a notification can show: a SLIC number and "someone replied", never who or
    what.
  - Say that signing out or turning the switch off deletes that address.
- [x] This file: Status, tick the stage 2 boxes, and update "Verifying". In particular,
      the stage 1 line saying a driver's POST answers 403 now depends on the switch.
- [x] `CLAUDE.md`, the PWA section: replace "Admin-only so far" with the switch and
      `canUsePush`, the driver kinds, and sign-out turning the device off.
- [x] `DATA-MODEL.md`: the `users.pushPrefs` keys and `app-settings.pushOpen`.
- [x] `OPERATIONS.md`: what sends notifications.
- [x] `TODOS.md`: the stage 2 line.

### Commit order (each shippable, switch off throughout)

1. The switch, `canUsePush`/`requirePush`, the routes and the profile gate. Drivers see
   nothing yet.
2. The driver kinds, `pushTypesFor`/`resolvePushPrefs`, and `getDriverPushAudience`.
3. Tip reply sends, place comment sends, the admin dedupe and the samples.
4. Sign-out teardown, `turnOffThisDevice`.
5. The nudge and the `/help` guide.
6. The overview counts and the privacy wording.
7. Docs.

Flip the switch on only after the phone checks below pass.

### Verifying stage 2

Done 2026-10-14, before deploying: lint and build for every commit; the audience and
thread queries read-only against production (5 admins of 25 accounts with the switch
off; the one place thread with a reply gave its 2 writers; no SLIC tip had a reply yet);
the nudge's states and the `/help` guide at 390px in light and dark on a scratch preview;
signed out, the push routes answer 401 and `/help` has no Notifications guide. Still to
do, on phones:

- Run `npm run lint`, then `npm run build` in a scratch copy, never while `next dev` runs.
- Run `getThreadParticipants`/`getPlaceThreadParticipants` and `getDriverPushAudience`
  read-only against Mongo with jiti. Print only counts, never ids or names.
- **With the switch off, as a driver account:** no toggle on `/profile`, no nudge after
  posting, no service worker registered, and the three `/api/users/me/push-*` routes
  answer 403.
- **With the switch off, as an admin:** the "Your tips" and "Places" kinds appear above
  the admin kinds. A second account replies to the admin's tip, and exactly one push
  arrives (the reply push, not also "Tips"). Check `push-log` for a `tipReplies` row.
- **Flip the switch on** (desktop Chrome on localhost, then Android, then the iPhone
  home-screen app):
  - A driver turns the device on and kinds default on.
  - A reply from another account arrives on the lock screen with the SLIC number only.
  - The replier gets nothing.
  - A busy thread replaces its notification instead of stacking.
  - Places: another account's top-level comment on a place you added notifies you, and a
    reply notifies the earlier commenters.
  - Sign out: the device's row is gone from `push-subscriptions` and
    `navigator.serviceWorker.getRegistrations()` is empty. Sign-out still completes with
    the network throttled or offline.
  - Nudge: shows after posting with the device off. "Turn on" asks permission and changes
    in place. Dismiss keeps it away. It never appears on page load. Check light and dark
    at phone width.
- **Rollback:** flip the switch off with a driver's device still on, then reply to their
  tip. No push goes out, and the `push-log` shows nothing for them.

## Stage 3 — Verified cover drivers: reminders, their list and the week (built 2026-10-22)

Tiago asked (2026-10-22):

> I want to allow drivers that are verified and allowed to view covers to be able to turn
> on their notifications. Notifications about job changes, if their interest list picks
> are picked, when its their turn to bid (sometime prior 15min, 2hr, etc... ), and I (as
> the superAdmin) want to be able to see the covers page like a cover driver would.
> Obviously the bid time that comes from the Google Sheet would have to say something
> generic or maybe a placeholder time.

**Decided with Tiago (2026-10-22):**

- **Bid day** is the Thursday 9 days before the week ends, which an admin can move. The
  saved picks showed W/E 10/24/2026 picked on Thu 10/15 from 7:00, in 15-minute call-in
  slots. Thanksgiving (Thu 11/26) is why it moves. Built in `COVER-BIDDING.md`, "Bid day".
- **The timer is a Vercel Pro cron.** A Hobby cron runs once a day, which can't remind
  anyone 15 minutes ahead. The team was already on Pro (checked 2026-10-22).
- **"Job changes"** means the week's cover jobs and the driver's own call-in time, not the
  Jobs tab.
- **Verified cover drivers also get the reply kinds** while "Notifications for every
  driver" is off: if you can turn notifications on, every switch you see works.
- **The super admin's preview** of `/covers` is in `COVER-BIDDING.md`.

**Built** in nine commits ("Covers notifications, part 1" to "part 9"):

- [x] **The gate:** `pushAllowed` (`lib/featureAccess.js`) lets in admins and verified
      cover drivers (`isCoverDriver`: verified, and Covers open to them), or everyone once
      the switch is on. `canUsePush`, the push nudge and the header menu share it.
      `pushAllowedFilter` / `coverDriverFilter` (`lib/db/users.js`) are the same rule as
      queries, used by `getDriverPushAudience` and `getCoverDriverAudience`.
- [x] **Four kinds** in `PUSH_TYPES`, `audience: 'coverDriver'`, group Covers, on by
      default, offered only to verified cover drivers (`pushTypesFor({ coverDriver })`;
      `push-prefs` answers 403 to anyone else). Every payload is in `lib/pushEvents.js` and
      links `/covers?week=…`; one tag per week, so a newer one replaces the last.

  | Kind | Sent | Says |
  |---|---|---|
  | `coverReminder` Call-in reminder | By the cron on bid day, at each time the driver chose before their call-in (`users.coverReminderLeads`: 15 min, 30 min, 1 hr, 2 hr; 15 min until they choose) | "Call in at 9:15, in 15 minutes" · "W/E 10/31/2026 · Cover 9. Your list: LV92, SH16, WA03." |
  | `coverListTaken` Your list | At once, from `refreshCoverWeek`, when a job on their list for a week that isn't over is picked (its NAME fills) or removed. Not to the driver whose linked name took it | "A job on your list was taken" · "W/E 10/31/2026: LV92 was taken. Next up: SH16 (2 left)." |
  | `coverCallIn` Your call-in time | By the cron, when a week's pick list first names them, or their place, time or bid day changes, or it drops them; only once the week's places have been quiet for 30 minutes, and not after their call-in has passed | "You're on the W/E 10/31/2026 pick list" · "Cover 9: call in Thu 10/22 at 9:00." |
  | `coverWeekJobs` Cover jobs | By the cron, 10 minutes after a week's last job change: posted, added, removed, times or description changed. Never picks, assigned drivers, cover reasons or hidden jobs (in the sheet, sleeper, or an admin's hide). Not to drivers off that week's list, nor to admins who get the admin Cover jobs kind | "Cover jobs changed" · "W/E 10/31/2026: BE11 description changed and LV92 times changed." |

- [x] **The lead times** are chips under "Call-in reminder" on `/profile`
      (`profile/CoverReminderLeads.jsx`, `PUT /api/users/me/cover-reminders`, verified
      drivers, rate-limited). The last one can't be unselected: the switch is the way to
      have none.
- [x] **The cron:** `GET /api/cron/cover-notifications` every minute (`vercel.json`,
      `CRON_SECRET`; `?all=1` runs every part now). `lib/coverNotices.js` runs the
      reminders every minute, and the call-in and cover-jobs notices every fifth. What
      it has told is `cover-notices` (`lib/db/coverNotices.js`): a reminder is claimed by
      inserting its unique key before it's sent, a change moves the last told state with
      a compare-and-set, so a repeated or doubled run tells nobody twice. The week
      notices' first run is a baseline (`weeks:baseline`): changes from before it aren't
      told. Every due lead is claimed and one push says the nearest, so a late run never
      sends two at once.
- [x] **The renumbering cascade** (Tiago's Inbox note: renumbering driver 27 moves every
      driver after them): nothing is sent when a slot changes. Reminders read the slot
      when they're due, and the call-in notice waits until the week's places have been
      quiet for 30 minutes (`cover-bid-picks.slotsChangedAt`), then sends each driver
      whose place or time ended up different one notice with the final time.
- [x] **The super admin's view:** samples of the four kinds on
      `/admin/super/notifications`, which counts the Covers kinds over verified drivers
      (counts only).
- [x] **Discovery:** after a verified driver's first list save on `/covers`, the nudge
      offers notifications inside the list card (`PushNudge topic='covers'`, never on page
      load); under Call dispatch the list says the reminder when it's on; `/help` has "Get
      a reminder before your call-in" (`feature: 'coversOpen'`).
- [x] **Words:** the privacy page says what a Covers alert can show and that the record
      of cover alerts sent is deleted four weeks after the week.

Still not built:

- [ ] **"Your pick is up"** when the driver before them picks waits for picking in the app
      (`COVER-BIDDING.md` stage 3). Until then the call-in time is the turn.
- The cover page stays the source of truth. A push that fails or arrives late never
  changes anyone's turn.

**Rollback**, each on its own:

- Take the cron line out of `vercel.json`: no more reminders, call-in or cover-jobs
  notices.
- `git revert` "part 4": no more list-taken pushes.
- `git revert` "part 1": verified drivers can't turn notifications on, and the Covers
  kinds are offered to nobody. Saved prefs and lead times stay, doing nothing.
- The data is all additive (`cover-bid-days`, `cover-notices`, `users.coverReminderLeads`,
  `cover-bid-picks.slotsChangedAt`, `cover-job-changes.sheetHidden`) and can stay.

### Verifying stage 3

Done 2026-10-22, before deploying: lint and a build of every commit; the audience query
and the JS rule agree on production (4 verified cover drivers: 3 admins and the
early-access account); the list lookup read-only; the engine run on a stubbed store and
stubbed sends against the real W/E 10/31 picks on its bid day (a reminder at 8:50 for a
9:00 call-in, nothing on a second run or on a Wednesday, a moved slot waiting out the
quiet window, a dropped driver told once, hidden, sleeper and pick changes left out, the
admin and an off-list driver skipped); `/covers?preview=driver` at 390px in light and
dark, with no pick names in the page and no list requests; the new routes answer 401
signed out. Still to do:

- Run `npm run db:indexes` once deployed (`cover-bid-days`, `cover-notices`).
- `vercel crons ls` lists `/api/cron/cover-notifications`; `cover-notices` gets its
  `weeks:baseline` within five minutes.
- Super admin, on the iPhone home-screen app and on Android: "Send me a sample" for each
  Covers kind on `/admin/super/notifications`.
- A verified driver with a device on (the early-access account, or an admin verified on
  the sheet): the Covers switches and the chips on `/profile`; on the next bid Thursday
  the reminder arrives at the chosen time and `push-log` has a `coverReminder` row.
- Move a week's bid day on `/admin/cover/jobs`, then back: `/covers` follows, and
  `admin_audit` has `coverBidDay.set` and `.reset`.

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
- **While "Notifications for every driver" is off, as a driver account that isn't a
  verified cover driver:** no toggle on `/profile`, no service worker registered, and
  `POST /api/users/me/push-subscriptions` answers 403.
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
