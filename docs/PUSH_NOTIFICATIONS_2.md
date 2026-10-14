Ready for review
Select text to add comments on the plan
Push notifications, stage 2: every signed-in driver (tip and place replies)
Context
Stages 1 and 1b of docs/PUSH-NOTIFICATIONS.md are live, but only for admins. Drivers still see a reply to their tip only when they happen to look up that SLIC again. Stage 2 lets every signed-in driver turn notifications on and sends them a push when someone replies in their tip threads on SLICs or comments in their threads on Places.

Decided with the user (2026-10-13):

Rollout: behind a "Notifications for every driver" switch on /admin/super/features, off by default. Turning it off again is the rollback, and it also stops sends to drivers.
Sign out turns this device off: unsubscribe, delete the row, unregister the worker.
Places: a reply goes to the thread's earlier commenters. A new top-level comment goes to the driver who added the place.
Discovery: a nudge right after a driver posts, plus the /profile line and a /help guide. Never a prompt on page load.
Driver kinds are on by default. A driver has already opted in by turning the device on, and with the kinds off a device that's on would get nothing.

1. The switch and the gate
constants.js: PUSH_OPEN = false as the default.
lib/db/appSettings.js: add pushOpen to FEATURE_DEFAULTS, labels and the reader, the same way as coversOpen. Add the switch to the /admin/super/features UI, which writes admin_audit like the others.
auth.js: put pushOpen in session.features, including the fallback object.
lib/authz.js: add canUsePush(session) (an admin, or anyone once pushOpen is on). Add requirePush(), which is requireUser() plus a 403 { error } when the gate is closed. Model both on canUseCovers/requireCovers.
Switch app/api/users/me/push-subscriptions, push-test and push-prefs from requireAdmin() to requirePush().
In push-prefs, an audience: 'admin' kind from a non-admin answers 403, the same way a super-admin kind from another admin already does.
app/profile/[id]/page.jsx: load getPushPrefs when canUsePush(session) is true and pass canUsePush down. In ProfileData.jsx, change the role === 'admin' check around <PushNotifications> to canUsePush.
2. Driver kinds
constants.js PUSH_TYPES: add two kinds first, so a driver's list and an admin's list both open on them:
tipReplies: group Your tips, label Replies. Description: "Someone replies to your tip, or after you in a thread." audience: 'driver', defaultOn: true.
placeComments: group Places, label Comments. Description: "A comment on a place you added, or a reply after you in a thread." audience: 'driver', defaultOn: true.
lib/db/users.js:
pushTypesFor({ admin, superAdmin }) offers driver kinds to everyone, admin kinds to admins and super-admin kinds to super admins.
resolvePushPrefs and getPushPrefs take admin.
Update the callers: the profile page, the push-prefs route, and lib/db/pushOverview.js (admins, so admin: true).
New getDriverPushAudience(key, userIds) in lib/db/users.js: one query over _id ∈ userIds with pushPrefs.<key> ≠ false. It adds role: 'admin' unless pushOpen is on (getAppSettings, which is cached), so closing the switch stops driver sends too. getPushAudience stays admin-only and is never called with a driver kind.
PushTypeSwitches.jsx needs no change. It already renders whatever keys prefs holds, grouped in PUSH_TYPES order.
3. Who gets a reply push
lib/db/comments.js:
createComment also returns threadId (the top-level comment's _id).
New getThreadParticipants(threadId): an aggregate with $match on { $or: [{ _id }, { parentId }], deleted: { $ne: true } } and $group on userId. Stable API strict has no .distinct(). It returns { authorId, userIds }, where authorId is the top-level tip's author and is null for a deleted placeholder.
lib/db/places.js:
addPlaceComment also returns threadId.
New getPlaceThreadParticipants(threadId), the same shape as getThreadParticipants.
The place's createdBy comes from getPlaceById.
lib/pushEvents.js: two new notifyX() functions. Each send is per user, through a payload function, and never includes a name, text or address.
notifyTipReply({ numSlic, threadId, except }):
Recipients are the thread's participants minus the replier.
Title: New reply on SLIC 1809.
Body: "Someone replied to your tip." for the tip's author, and "Someone replied after you." for everyone else.
url is /home?slic=… and tag is reply-<threadId> (30 characters, so it also works as the Topic).
It sends to getDriverPushAudience('tipReplies', ids) through sendPush(ids, fn, { type: 'tipReplies', source: 'event' }), and returns the ids it targeted.
notifyPlaceComment({ placeId, threadId, isReply, except }):
A reply goes to the thread's participants, with "Someone replied after you."
A top-level comment goes to the place's createdBy, with "A driver commented on a place you added."
Title: New comment on Places. url is /places and tag is place-<placeId>.
Add both to SAMPLES, so /admin/super/notifications can send them.
No double push for an admin: sendPushToAdmins takes except as an id or an array. The routes run the driver send first and then the admin kinds (notifyTip, notifyPlace), passing except: [replier, ...replyRecipients]. An admin who is also the tip's author gets one push, not two.
Routes call them inside the existing after() blocks:
app/api/comments/route.js: only when parentId is set and the SLIC exists, the same check notifyTip already uses.
app/api/place-comments/route.js: every new comment, top-level or reply.
4. Signing out turns the device off
Move the device teardown out of hooks/usePushNotifications.js disable() into an exported helper, turnOffThisDevice(). It finds the existing registration, gets its subscription, DELETEs the endpoint, then unsubscribes and unregisters. It is wrapped in try/catch and capped at about 3 seconds, so a slow network never blocks sign-out. The hook's disable() calls the same helper.
components/header/UserMenu.jsx: the sign-out form's action becomes a client function that runs await turnOffThisDevice() and then await signOutAction(). React 19 allows a client function to call a server action this way. The DELETE runs while the session still exists.
profile/DeleteAccountDialog.jsx: call the same helper before signOut. The server already deletes the rows, so this only unregisters the worker on that device.
The helper never calls register(). When a device has no registration, it does nothing.
5. Discovery
New components/push/PushNudge.jsx (or utility/, whichever fits better): a utility/SoftNotice reading "Get a notification when someone replies.", with a Turn on button and a dismiss.
It renders only after a successful post, in comments/Comments.jsx and places/PlaceComments.jsx. Mounting it then means the hook runs only for drivers who just posted.
It shows only when canUsePush is true (from useSession().data.features and role), the hook's state is off, and the driver hasn't dismissed it. The dismissal is in localStorage under slics.pushNudgeDismissed, with every read and write in try/catch.
Turn on calls enable() inside the tap. When it succeeds, the notice changes in place to "Notifications on" with a polite live region and tapHaptic(), not a toast.
It doesn't show for needs-install, blocked or unsupported; /profile explains those.
Before building it, check that the hook's mount path never calls register(). The ground rule is that the worker is registered only by the tap.
components/help/guides.jsx: add a "Notifications" guide. It covers turning them on from Profile, that an iPhone needs the home-screen app, what they say, and how to turn them off. Use the button names exactly as the page labels them.
/profile: the line under the switch stays "On this device." The kinds below it explain the rest.
6. Super admin view
lib/db/pushOverview.js and its page: add a "Drivers" summary showing how many non-admin accounts have a device on and how many devices that is. It shows counts only, with no driver list. The per-kind rows for the driver kinds show admins only, which is fine.
/admin/super/features: the new switch (step 1).
7. Words and docs (same commits as the code they describe)
app/privacy/page.jsx, the notifications paragraph (around line 117):
Remove "admin-only today".
Say that it keeps one push address per device a driver turns on.
Say what a notification can show: a SLIC number and "someone replied", never who or what.
Say that signing out or turning the switch off deletes that address.
docs/PUSH-NOTIFICATIONS.md: Status, tick the stage 2 boxes, record the sign-out decision, and update "Verifying". In particular, the stage 1 line saying a driver's POST answers 403 now depends on the switch.
CLAUDE.md, the PWA section: replace "Admin-only so far" with the switch and canUsePush, the driver kinds, and sign-out turning the device off.
docs/DATA-MODEL.md: the users.pushPrefs keys and app-settings.pushOpen.
docs/OPERATIONS.md: what sends notifications.
docs/TODOS.md: the stage 2 line.
Commit order (each shippable, switch off throughout)
The switch, canUsePush/requirePush, the routes and the profile gate. Drivers see nothing yet.
The driver kinds, pushTypesFor/resolvePushPrefs, and getDriverPushAudience.
Tip reply sends, place comment sends, the admin dedupe and the samples.
Sign-out teardown, turnOffThisDevice.
The nudge and the /help guide.
The overview counts and the privacy wording.
Docs.
Flip the switch on only after the phone checks below pass.

Verification
Run npm run lint, then npm run build in a scratch copy, never while next dev runs.
Run getThreadParticipants/getPlaceThreadParticipants and getDriverPushAudience read-only against Mongo with jiti (see the memory note). Print only counts, never ids or names.
With the switch off, as a driver account: no toggle on /profile, no nudge after posting, no service worker registered, and the three /api/users/me/push-* routes answer
With the switch off, as an admin: the "Your tips" and "Places" kinds appear above the admin kinds. A second account replies to the admin's tip, and exactly one push arrives (the reply push, not also "Tips"). Check push-log for a tipReplies row.
Flip the switch on (desktop Chrome on localhost, then Android, then the iPhone home-screen app):
A driver turns the device on and kinds default on.
A reply from another account arrives on the lock screen with the SLIC number only.
The replier gets nothing.
A busy thread replaces its notification instead of stacking.
Places: another account's top-level comment on a place you added notifies you, and a reply notifies the earlier commenters.
Sign out: the device's row is gone from push-subscriptions and navigator.serviceWorker.getRegistrations() is empty. Sign-out still completes with the network throttled or offline.
Nudge: shows after posting with the device off. "Turn on" asks permission and changes in place. Dismiss keeps it away. It never appears on page load. Check light and dark at phone width.
Rollback: flip the switch off with a driver's device still on, then reply to their tip. No push goes out, and the push-log shows nothing for them.