# BMC-SUPPORT.md

Buy Me a Coffee support: record it, show it to the admin, thank people, and show what the
app does without asking for money. The design is `RECOMMENDATIONS.md` #2. This file is the
plan and the checklist.

## Status (2026-10-10)

- **Stage 1 built:** every webhook delivery is saved, and the webhook is hardened.
- **Stage 2 built:** the admin Supporters page.
- **Stage 3 built:** the thank-you notice.
- **Stage 4 mostly built:** the impact line. Left: the "what it takes" card, which
  needs the real monthly costs.
- **SuperAdmin role:** deferred until there's a second admin (`TODOS.md`).

## Why

The webhook used to flip `users.bmcMember` by exact email and keep nothing else. Nobody
could see who supported the app, how much, or what they wrote. One-time coffees weren't
handled at all. And the handler had the gaps in `SECURITY.md` #14: a non-constant-time
signature check, no replay protection, and an exact-case email match.

## Ground rules

- **Amounts, emails and messages are personal.** Only the admin sees them. The privacy
  page says what's kept (updated 2026-10-10).
- **Every signed delivery is saved, even an unfamiliar one.** BMC's payload isn't
  documented in public. Each row keeps the payload's field *names* (never values) under
  `fields`, so a new event type shows its shape without logging anything personal.
- **A repeat does nothing.** `key` is a SHA-256 of the exact body, and a unique index on
  it makes a retry or a replayed request a no-op (200, "Already processed").
- **Accounts are matched by email, case-insensitively, then changed by `_id`.** Logs name
  the account id, never the email.
- **Account deletion unlinks, it doesn't delete.** A deleted driver's events stay as the
  record of support, with `userId: null`.

## Stage 1 — Record every event (built)

- [x] `lib/db/bmcEvents.js`:
  - `parseBmcEvent` reads the fields from `data` (the membership shape the old handler was
    fixed against) or `response` (a shape seen in a blog post), under the names seen in
    the wild.
  - Amount is `amount`/`total_amount`, or coffees × price.
  - Also here: `findUserIdByEmail`, `recordBmcEvent`, `setBmcMember`.
- [x] `app/api/webhooks/buymeacoffee/route.js`:
  - IP rate limit (60 a minute).
  - HMAC compared through `secretsMatch`.
  - Saves the event. `membership.started` / `.cancelled` / `.canceled` also set
    `bmcMember` on the matched account.
  - An event with no email is saved now, where it used to be rejected with a 400.
- [x] Indexes in `scripts/createIndexes.js`: `key` (unique), `receivedAt`,
  `userId + receivedAt`. **Run `npm run db:indexes` once.** Until then, a check before
  each insert still catches repeats; the unique index closes the race between two
  deliveries arriving together.
- [x] `deleteUserAccount` unlinks the user's events.
- [x] Privacy page: what BMC sends us, and how long it's kept.
- [ ] **When the first one-time coffee arrives,** look at its row's `type` and
  `fields.data`. Check that `amount`, `currency` and `message` were read; if not, add the
  field names to `parseBmcEvent`.

Not done from `SECURITY.md` #14:
- **No freshness check.** The payload's timestamp field isn't known yet.
- **No `emailVerified` requirement.** It waits on #8.
- **No `admin_audit` row.** It waits on #17. The event row and the log line record the
  change in the meantime.

## Stage 2 — Admin Supporters page (built)

- [x] `/admin/supporters` (`components/admin/supporters/SupportersView.jsx`, data from
  `getSupportOverview`):
  - **By month:** totals per month and currency.
  - **Recent:** the last 50 events, each with its message. A known type gets a label;
    any other type shows as BMC named it.
  - **No matching account:** grouped by email.
  - **Members now:** from `users.bmcMember`, so it includes members switched on by hand.
- [x] The page checks the admin role itself, not only the layout (`SECURITY.md` #7).
- [x] Linked from `/admin` and titled in the header.
- [ ] Later, maybe: a "link to account" action on an unmatched email. Today the fix is to
  switch membership on by hand in Users.

## Stage 3 — Thank-you notice (built)

- [x] `/home` shows `support/SupportThanks.jsx` when the driver has support not yet
  thanked (`getUnthankedSupport`).
  - It counts a coffee or a new membership, never a cancellation.
  - The text is "Thanks for the coffee, John." or "Thanks for becoming a member, John.",
    then "Support like yours keeps SLICs running for every driver."
- [x] Dismissing it calls `POST /api/users/me/thanks` (`markSupportThanked`), which
  stamps `thankedAt` on every waiting event. It's once per visit's worth of support, not
  once per event.
- [x] Only events saved since stage 1 count, so nobody gets a backdated thank-you.
- [ ] Optional and opt-in: "Supporter since …" on their profile.

## Stage 4 — Show what the app does (mostly built)

- [x] `support/ImpactLine.jsx`: "In the last 30 days, drivers looked up 2,482 SLICs and
  shared 12 tips."
  - **Where:** under The Community on `/about`, and above the Buy Me a Coffee button in
    the membership prompt.
  - **How it counts:** `getImpactNumbers` (`lib/impact.js`) counts `slicViews` rows (hidden
    ones included) and non-deleted `comments` (by `_id` time, because `created_at` formats
    vary). It's cached for an hour.
  - **When it hides:** under 50 lookups, or if the counts fail.
  - It reads the last 30 days, not "this month", so the 1st of the month doesn't show a
    tiny number.
- [x] The ask after value already exists. The search shows a support notice tied to the
  driver's lookup count, snoozed for 30 days (`home/SlicsSearch.jsx`).
- [ ] The "what it takes" card: what hosting costs a month, that one driver builds the app
  in their own time, and what support goes toward next. It needs the real numbers from you.

## Verifying

- **Signed out, against any deploy:**
  - no signature → 401;
  - a wrong signature → 403.
- **With the secret, locally:**
  - a signed test body → 200, with one `bmc-events` row;
  - the same body again → 200 "Already processed", still one row;
  - delete the test row afterwards.

  This was done on 2026-10-10 against the production database, through the dev server,
  with an email that matches no account.
- **After a real delivery:** the row's `userId` is set, and for a membership event the
  user's `bmcMember` matches.
