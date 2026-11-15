// "Your turn" on bid day (docs/PUSH-NOTIFICATIONS.md, "Up next"): who should
// be told that the driver before them has picked. Pure and import-free, like
// lib/sheetChangeWords.js, so the cron (runUpNextNotices in
// lib/coverNotices.js) and a replay of past bid days share one rule.
//
// Dispatch types each pick into the driver's pick-list status cell ("Job /
// status") as the call ends, and the sheet sync records it as a `job` event
// in `cover-bid-pick-events`. The rule:
//   - A pick is a driver's status going from blank to filled on bid day, no
//     earlier than UP_NEXT_PICK_WINDOW_MINUTES before their own call-in: a
//     status typed the day before, or a leave typed in the morning for an
//     evening driver, isn't one.
//   - It counts once it has held UP_NEXT_SETTLE_MINUTES and the status is
//     still filled, so a typo cleared at once tells nobody.
//   - Who's up: the first driver after the picker whose own status is still
//     blank. A no-show doesn't stop the queue: the next pick moves past them.
//   - Never more than UP_NEXT_MAX_EARLY_MINUTES before that driver's own
//     call-in: until then they wait.
// Cover 1 is never up (nobody is before them; their call-in reminder is their
// turn). Telling each driver once a week is the caller's (`cover-notices`).

export const UP_NEXT_PICK_WINDOW_MINUTES = 90;
export const UP_NEXT_SETTLE_MINUTES = 1;
export const UP_NEXT_MAX_EARLY_MINUTES = 60;

const MINUTE = 60_000;

const filled = (value) => String(value ?? '').trim() !== '';
const toMs = (value) => (value instanceof Date ? value.getTime() : typeof value === 'string' ? Date.parse(value) : value);

// When `key` last picked (ms), or null: their latest blank → filled event no
// earlier than `windowMs` before their call-in.
function pickedAt(events, key, callInAt, windowMs) {
  let at = null;
  for (const event of events) {
    if (event.key !== key || filled(event.from) || !filled(event.to)) continue;
    const time = toMs(event.at);
    if (time >= callInAt - windowMs && (at === null || time > at)) at = time;
  }
  return at;
}

// Who's up at `now`, and due to be told.
//   queue:  [{ key, job, callInAt (ms), … }] in pick order (upNextQueue in
//           lib/coverDrivers.js, with each call-in on bid day as a time),
//           `job` being the status cell as it stands at `now`.
//   events: the week's `job` events on bid day, [{ key, from, to, at }];
//           any after `now` are ignored.
// → the queue entries that are up, in queue order.
export function whoIsUpNext({
  queue,
  events,
  now,
  windowMinutes = UP_NEXT_PICK_WINDOW_MINUTES,
  settleMinutes = UP_NEXT_SETTLE_MINUTES,
  maxEarlyMinutes = UP_NEXT_MAX_EARLY_MINUTES,
}) {
  const nowMs = toMs(now);
  const heard = events.filter((event) => toMs(event.at) <= nowMs);
  const up = new Set();
  queue.forEach((driver, index) => {
    if (!filled(driver.job)) return;
    const at = pickedAt(heard, driver.key, driver.callInAt, windowMinutes * MINUTE);
    if (at === null || at > nowMs - settleMinutes * MINUTE) return;
    const next = queue.findIndex((other, later) => later > index && !filled(other.job));
    if (next === -1) return;
    if (nowMs >= queue[next].callInAt - maxEarlyMinutes * MINUTE) up.add(next);
  });
  return [...up].sort((a, b) => a - b).map((index) => queue[index]);
}
