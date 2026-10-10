# BMC-SUPPORT.md

Buy Me a Coffee support: record it, show it to the admin, thank people, and show what the
app does without asking for money. The design is `RECOMMENDATIONS.md` #2. This file is the
plan and the checklist.

## Status (2026-10-10)

- **Stage 1 built:** every webhook delivery is saved, and the webhook is hardened.
- **Stages 2–4 not started.**
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

## Stage 2 — Admin Supporters page

- `/admin/supporters`: totals by month, current members, and recent support with its
  messages.
- An **unmatched** list: events whose email has no account. Linking one to an account fixes
  "my membership didn't apply" (`OPERATIONS.md`).

## Stage 3 — Thank-you notice

- On a supporter's next visit, a one-time `SoftNotice`: "Thanks for the coffee, Tiago."
- Dismissing it stamps `thankedAt` on the event.
- Optional and opt-in: "Supporter since …" on their profile.

## Stage 4 — Show what the app does

- Live numbers on `/about` and the membership page: "Drivers looked up N SLICs this month
  and shared M tips" (one aggregate over `slicViews` and `comments`).
- The "what it takes" card, and one dismissible ask after a driver's 50th lookup, never on
  the lookup path.

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
