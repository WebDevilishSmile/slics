# RECOMMENDATIONS.md

Ideas for where the app could go next, based on what it does today (2026-10-10). These
are suggestions, not commitments. When you decide to build one, move it to `TODOS.md`. If
it has stages, give it its own plan doc in the `ON-CALL-SHEET-SYNC.md` shape (Status, Why,
Ground rules, Stages, Verifying).

Part 1 works through the objectives already in `TODOS.md`. Parts 2–4 are new. Part 5 is
about this folder.

**Effort:** S = an evening or two · M = a few evenings · L = a project with stages.

| # | Idea | For | Effort | Builds on |
|---|---|---|---|---|
| 1 | My Daily Log | Drivers | L | `sheet-jobs`, `slics.alphaSlic`, `DayTimeField`, `/history` |
| 2 | Buy Me a Coffee: track support, thank people, show impact | Everyone | S–M | The BMC webhook, `SECURITY.md` #14 |
| 3 | Cover drivers and call-in times from the sheet (**built 2026-10-10**) | Admin | S–M | `cover-bid-picks`, the sheet sync |
| 4 | Embossed headings | Everyone | S | `sectionHeading`, `theme.soft` |
| 5 | "Something's wrong?" reports on a SLIC | Drivers → admin | S–M | The job-change alert pattern |
| 6 | Safety notes at the top of the card | Drivers | S–M | Tips, votes |
| 7 | Tip freshness | Drivers | S | Tips, votes |
| 8 | Pinned SLICs, filled from your job | Drivers | S | `archive/UI-SUGGESTIONS.md` #54, idea 1 |
| 9 | Share a SLIC | Drivers | S | `/home/[slic]` |
| 10 | "What's new" after a release | Drivers | S | `SoftNotice`, `BottomSheetDialog` |
| 11 | Faster cards on a weak signal | Drivers | S | `lib/recentLookups.js` |
| 12 | A data-health page | Admin | S | `slics` |
| 13 | An in-app usage page | Admin, README | S–M | `slicViews`, `comments` |
| 14 | An admin audit log | Admin | S | `SECURITY.md` #17 |
| 15 | A dev database | You | S | `SECURITY.md` #20 |
| 16 | A small test suite | You | M | The sheet parsers, `SECURITY.md` Part 3 |
| 17 | CI on GitHub Actions | You | S | `npm run build`, lint, knip |
| 18 | Schemas at the API boundary | You | M | `SECURITY.md` #10–#11 |
| 19 | Next 16 | You | M | `SECURITY.md` #3 |
| 20 | Error alerts | You | S | Vercel logs |

---

## Part 1 — The objectives in TODOS.md

### 1. My Daily Log

**Why.** The app already knows a driver's job (the Jobs tab names each job's driver), the
job's schedule (start, hours and miles per day) and every SLIC on its route. The job
routes are chains of alpha codes (`BETPA>BURMD>GAIMD>…`), and `BETPA` *is* a SLIC's
`alphaSlic` (Bethlehem Center, 1809). A log that pre-fills itself from the job turns the
app from "look up a stop" into "my shift". Every leg becomes a one-tap link to that stop's
card, tips and phone number.

**What a driver sees.**
- On `/history` (or a "Log" tab beside it): "You're on **BMEL**. Tonight: BETPA › BURMD ›
  GAIMD › EZRPA › ALLPA › BETPA. **Log today**".
- One tap creates the day, with the legs pre-filled from the job. Departure and arrival
  per leg use the 24-hour `TimeField` the cover jobs already use
  (`components/admin/coverBidJobs/DayTimeField.jsx`). The first departure can default to
  the job's start time for that day from `sheet-jobs`.
- Each stop is a chip linking to `/home?slic=<numSlic>`.
- Past days list under the same date headers `/history` already has.

**Linking a driver to a job.** Ask, never assume.
1. Find a candidate. Try the roster link first: `users.driverId` → `drivers.name` →
   `sheet-jobs.driver`, matching names after normalizing `LAST, FIRST` vs `First Last` and
   case. Fall back to the account name. Otherwise, let the driver pick from the job list.
2. Confirm: "Are you on BMEL?" A yes saves `users.job = { jobName, confirmedAt, source }`.
3. Re-ask when it changes. When `sheet-job-changes` records a new driver on their job
   (bids move people), the existing alert machinery can prompt "Your job changed. Still
   on BMEL?"

**Data.** A new `dailyLogs` collection, private to its driver:

```js
{
  userId: ObjectId,          // like slicViews
  date: '2026-10-12',        // the day the shift starts, America/New_York
  jobName: 'BMEL',
  route: ['BETPA', 'BURMD', 'GAIMD', 'EZRPA', 'ALLPA', 'BETPA'], // copied, not re-derived
  legs: [
    { from: 'BETPA', to: 'BURMD',
      dep: '2026-10-12T22:50:00.000Z', arr: '2026-10-13T02:05:00.000Z', note: '' },
    // …
  ],
  note: '',
  created_at, updated_at,    // ISO strings
}
```

- **Overnight shifts.** The example in `TODOS.md` crosses midnight (22:15 → 23:45, then
  00:10). Store real timestamps, and compute them on save from the shift date and the
  typed `HH:MM`: a time earlier than the one before it is the next day. Display stays
  24-hour `HH:MM`. Durations and weekly totals then just work.
- **Copy the route onto the log** when the day is created. A later bid or sheet edit
  must not rewrite last week's history.
- **Unique index** on `{ userId, date, jobName }`, and a `userId` index for account
  deletion.

**Unknowns to settle first.**
- The exact format of the route in the Jobs tab. Read a handful of real
  `sheet-jobs.description` values (or `npm run sheet:preview -- --jobs`). Parse leniently:
  any token that matches a known `alphaSlic` is a stop, and the rest stays free text.
  Some SLICs store `alphaSlic` as a number (`lib/recentLookups.js` notes this), so compare
  as strings.
- Is the log for everyone, or a member perk like `/history`? Either works. As a perk it
  gives membership a clear "why" (idea 2).

**Later.**
- Weekly hours from the log next to the job's `weekHours` from the sheet: a record a
  driver can point to if a paycheck looks short.
- Suggest leg times from that night's lookups (`slicViews` already timestamps every one).
- "Turn this note into a tip": a leg note about a dock delay is often tip material.
- Pin the job's SLICs automatically (idea 8).

**Privacy.** A driver's schedule is personal. Keep it private to that driver. Decide, and
write down, whether the admin can see logs (recommendation: no, as with history notes).
Add a `deleteUserAccount` line, a retention decision and a privacy-page line in the same
change (`SECURITY.md` Part 3).

**Stages.**
1. Job link and confirm.
2. Log a day: pre-fill and edit legs.
3. The list on `/history`, plus weekly totals.
4. The "later" list.

Write it up as `DAILY-LOG.md` when you start.

### 2. Buy Me a Coffee: track support, thank people, show impact

**Today** the webhook (`app/api/webhooks/buymeacoffee`) handles only membership
started/cancelled, flips `users.bmcMember` by exact email, and keeps nothing else.

**Record every event.** Add a `bmc-events` collection: event id, type, normalized email,
amount and currency, the supporter's message if any, `receivedAt`, and the matched
`userId` (or `null`).
- A unique index on the event id gives replay protection for free. Swap the `!==`
  signature check for `lib/secretsMatch.js` in the same change. That's most of
  `SECURITY.md` #14.
- Store only the fields you'll use, not the raw payload.
- Confirm the event names and fields in BMC's webhook settings first. One-time support
  arrives as a different event type from memberships, which is why it isn't tracked today.

**An admin "Supporters" page.**
- Totals by month, current members, and recent support with its messages.
- An **unmatched** list: support from an email with no account. That's also how to fix
  "my membership didn't apply" (`OPERATIONS.md`).

**Thank people, quietly.**
- On a supporter's next visit, show a one-time `SoftNotice`: "Thanks for the coffee,
  Tiago." Dismissing it stamps `thankedAt` on the event, so it shows once per support.
- Optional and opt-in: "Supporter since March 2026" on their profile, and a supporters
  line on `/about` with first names only.

**Show significance without asking.**
- **Live impact numbers** on `/about` and the membership page: "Drivers looked up 3,900
  SLICs this month and shared 41 tips." It's one aggregate over `slicViews` and `comments`
  (idea 13). The README quotes these numbers by hand today.
- **An honest "what it takes" card:** what hosting costs a month, that one driver builds
  it in their own time, and what support goes toward next (for example, the daily log).
  People give to a person and a purpose.
- **Ask only after value, and only once.** After a driver's 50th lookup, show one
  dismissible card, snoozed like the install nudge. Never on the lookup path itself.

**Privacy.** Amounts and emails are personal. Make them admin-only, and add a privacy-page
line ("we keep a record of support you send through Buy Me a Coffee").

### 3. Cover drivers and call-in times from the sheet

**Built 2026-10-10**, from the pick order, with no new sheet read. What the check found:
- The yellow fill isn't reliable. On 10/3 and 10/10 only 15 rows were yellow, though the
  sheet's owner counts 1–20 as cover drivers every week.
- The numbers are the rule. A cover driver who's out keeps their row, grayed, without a
  number, so the numbers skip.
- The column A time in the pick section is the call-in time.
- One week (10/24) skips 20 with three non-cover rows in the gap, so the page shows that
  position as empty instead of guessing.

The rule is in `lib/coverDrivers.js`, the page in `components/covers/CoverDriversFromSheet.jsx`.
The page also lists the on-call drivers, everyone after driver 20. The hand-edited list
and its route were deleted the same day; its rows stay in the `cover` collection for now.
Older tabs (10/3, 10/10) list out drivers unnumbered without skipping a number, so they
show in the cover table without a position. Available days weren't found in the sheet;
`TODOS.md` has the follow-up. The rest of this section is the original note.

**Before** `/admin/cover/drivers` read the hand-edited `cover` collection.

**Try the pick order before the colors.** The dated tab's pick section already gives
every driver a pick order, and it's saved in `cover-bid-picks`. If "yellow = cover drivers
1–20, the rest on-call" lines up with pick order 1–20, the page can be built from data the
app already has, with no new sheet read. Check a few weeks against the sheet.

**If the yellow fill is the only signal,** the Sheets API can return cell colors through
the same read-only key: `spreadsheets.get` with a narrow `ranges=` and
`fields=sheets.data.rowData.values.effectiveFormat.backgroundColor`. It's still only dated
tabs, and one extra request per refresh. It's fragile, though: a different shade of
yellow breaks it. So prefer the number if it works.

**Call-in times and availability.** First find where they live in the sheet. If they're
on the `ON CALL <date>` tab, reading it is a ground-rule change (today only `Jobs` and
whole-date tabs are read).
- Write that decision into `ON-CALL-SHEET-SYNC.md` → "Ground rules" before any code.
- Fetch only the columns needed through an A1 range, so a phone-number column never
  comes along.

**The page.** The week's cover list: position, name, job or status, call-in time, available
days, and "From the sheet, refreshed …". Keep the manual editor as a fallback until the
sheet version has proven itself, the same way the photo upload was kept.

### 4. Embossed headings

Make it one change in one place: the `sectionHeading` variant in `theme.js`.
- Add a text-emboss value per scheme next to the shadow pairs in `theme.soft`: a light
  highlight on one side and a soft, brand-tinted shadow on the other in light mode, and a
  much subtler pair in dark (the dark emboss is subtler by design).
- Every heading picks it up, and no call site changes.
- Check it at 390px in both schemes. Keep the shadow tight (1px offsets), or large text
  blurs on a phone in sunlight.
- Leave the `h1` app name alone, or give it the same treatment on purpose. Don't let the
  two drift.

---

## Part 2 — For drivers

### 5. "Something's wrong?" reports on a SLIC

The whole product is correct addresses and phone numbers, and drivers are the first to
know when one changes.
- Add a small link on the card. It opens a sheet: wrong phone / wrong address / closed or
  moved / other, plus a note.
- Reports go to an admin queue with the same banner and menu badge as job changes
  (`JobChangesNotice`, `lib/jobChangesStore.js`). Resolving one opens the edit form, so
  the fix lands in `slic_history`.
- Rate-limit it per driver.

### 6. Safety notes at the top of the card

Low bridges, no-truck roads and a closed dock belong above the fold, not in a thread.
- Let the admin promote a tip to a "Heads up" line on the card, or set one directly on
  the SLIC.
- It's the same text, shown first, and it changes through `updateSlic` so history records
  it.
- Don't store gate or door codes. They'd be the most sensitive thing in the database.

### 7. Tip freshness

Construction ends, and docks move. Show a tip's age ("2 years ago"). After 6 months, ask
"Still right?" with a yes/no tap that feeds a "confirmed by 3 drivers this year" line.
Sort stale and contradicted tips down.

### 8. Pinned SLICs, filled from your job

`archive/UI-SUGGESTIONS.md` #54, already in `TODOS.md`. With idea 1, a confirmed job can
pin its route's SLICs automatically, so a driver's own stops lead the search list and the
empty state.

### 9. Share a SLIC

A share button on the card calls `navigator.share` with the `/home/<slic>` link, falling
back to copy. The recipient still has to sign in. Useful when a dispatcher or another
driver asks "where's that customer?"

### 10. "What's new" after a release

The app ships often, and drivers won't find pins, places or the log on their own.
- After a release with something driver-facing, show a one-time sheet
  (`BottomSheetDialog`) or a `SoftNotice` with two or three lines.
- Keep the last-seen version in localStorage.
- It also quietly shows how much work goes into the app (idea 2).

### 11. Faster cards on a weak signal

`lib/recentLookups.js` keeps the last six codes on the device. Keeping each one's address
and phone number too would let the card render instantly while the network catches up.
- This helps on a slow connection, not a dead one. Real offline needs a service worker,
  which the app avoids on purpose (`CLAUDE.md` → "PWA").
- It's a per-device convenience, like the rest of localStorage.

---

## Part 3 — For the admin

### 12. A data-health page

A short list under `/admin` that turns maintenance into a checklist:
- SLICs with no phone;
- SLICs with no PDF, or only a legacy Supabase PDF (migration progress, so you know when
  the fallback can go);
- SLICs not updated in a year;
- the most-viewed SLICs with no tips;
- duplicate `numSlic` or `alphaSlic`. That's also the precondition for the unique indexes
  in `SECURITY.md` #15.

### 13. An in-app usage page

Lookups per day, active drivers per week, top SLICs and tips per month, from `slicViews`
and `comments`. It replaces pulling the README's numbers by hand, feeds the impact line in
idea 2, and shows which features drivers actually use before you build the next one.
Aggregate counts only, no per-driver drill-down.

### 14. An admin audit log

`SECURITY.md` #17. Role and membership toggles, comment and SLIC deletions, roster edits:
who did what and when, on one read-only page. It's a safety net for a compromised session,
and a handy "what did I change last week".

---

## Part 4 — Platform

### 15. A dev database

`.env` points at production, so `npm run dev`, every script, and every "quick test" run
against live data. That's why so many checks in these docs needed a throwaway database or a
scratch build. A `slics-dev` database (same cluster, separate user), seeded from a
scrubbed export and used by Vercel Preview too, makes every later item safer to try.
`SECURITY.md` #20.

### 16. A small test suite

Two files would cover the riskiest code:
- **Sheet parsers** (`lib/coverSheetParser.js`, `lib/jobsSheetParser.js`,
  `lib/onCallSheet.js`) against saved CSV fixtures with the names swapped out. They were
  tested by hand on CSV downloads; capture those. A layout change in the sheet is the
  likeliest thing to break.
- **The route-enumeration auth test** from `SECURITY.md` Part 3: every route, no session →
  401; a plain user on admin routes → 403.

Use Vitest, and run it in CI (idea 17).

### 17. CI on GitHub Actions

On every push to a branch, run `npm ci`, `npm run build`, `npm run lint` and
`npm run lint:dead`, so `main` (which deploys itself) only ever gets green code. A dummy
`.env` is enough for the build.

### 18. Schemas at the API boundary

`SECURITY.md` #10 and #11: one zod schema per collection, parsed at the top of each
handler. Unknown keys become a 400 instead of a write. Start with it in the daily log
(idea 1) so the new collection is validated from day one.

### 19. Next 16

It clears the last two audit findings (the `postcss` that Next 15 pins) and the
deprecated `next lint` (`SECURITY.md` #3). Do it on a branch, with a full phone walk of
sign-in, tips, PDFs and the admin pages.

### 20. Error alerts

A 500 on a driver's phone should reach you before they mention it. Vercel can alert on
error spikes, or send logs to a free-tier tracker. Pair it with `SECURITY.md` #22, so the
logs carry ids, not emails.

---

## Part 5 — This folder

- **Keep the references honest.** Update `DATA-MODEL.md` and `OPERATIONS.md` in the same
  commit as the change that makes them wrong: a new collection, env var, cron or script.
- **One plan doc per staged feature,** like `ON-CALL-SHEET-SYNC.md`. The daily log is the
  next candidate.
- **Archive punch lists when they close** (`README.md` → "Conventions").
- **The root README** is the public face, and a portfolio piece. It needs the live link,
  three phone screenshots (search, a card with tips, the admin), current numbers (idea
  13), and a "How it's built" paragraph pointing at `docs/`.
