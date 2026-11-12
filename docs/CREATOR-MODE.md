# Creator mode

Made-up data on the lookup screen, so videos of the app (the `/help` tutorials in
[`tutorials/VIDEO-SCRIPTS.md`](tutorials/VIDEO-SCRIPTS.md), posts, demos) never show a
real address, phone number, driver or tip.

## Status

- **Stage 1, the lookup screen:** built 2026-11-12. Not yet tried on a phone.
- Stage 2 (more pages) is an idea, below.

## Why

Recording the real app means blurring names and picking a SLIC whose only tips are your
own. A separate demo page would drift from the real one and wouldn't look like it in a
video (its address, its header title). So the real pages run on made-up data instead: the
same components, the same URL, the same header.

## How it works

- **The switch.** "Creator mode" in the header menu, under Dark mode
  (`creator/CreatorModeSwitch.jsx`), shown only to the super admin. It sets the
  `slics-creator` cookie on this device (`lib/creatorMode.js`) and opens `/home`. The
  cookie lasts 12 hours, so a switch left on is off by the next shift. Flip it again to
  turn it off.
- **The server.** `getCreatorMode(session)` (`lib/authz.js`) is true only for a super
  admin with the cookie; anyone else's cookie is ignored. While it's true:
  - `/home` and `/hubs` render `slic/SlicLookupPage.jsx` with `creator`: the made-up SLICs
    from `lib/creatorData.js`, a made-up lookup count, and none of /home's notes and
    nudges (welcome, thank-you, install, new icon, comment prompt). Nothing is read from
    the database.
  - The header menu (`header/Header.jsx`) shows a made-up verified driver, Alex Rivera,
    with no Admin or Dispatch rows and no alert badge.
- **The browser.** `creator/CreatorMode.jsx`, first on the page, swaps `window.fetch` for
  `lib/creatorFetch.js`, which answers the lookup screen's API calls from the made-up
  data: the tips thread, posting, replying, editing, deleting, votes and voters, the
  lookup counter, directions, reports and route suggestions. Changes live in memory, so a
  video can show posting a tip, and a reload starts over. Leaving the page gives the real
  `fetch` back.
  - Page navigations and `/api/auth/` (sign out) go to the server as usual.
  - Any other `/api/` call is answered without being sent: a read gets a 404, a write gets
    `{ success: true }`. Nothing real shows up and nothing real is written while recording.
- **Per-device lists.** While it's on, recent lookups, tips seen and the comment prompt
  use their own localStorage keys (`creatorStorageKey`), so made-up SLICs never land in
  the real ones.

## The made-up data

`lib/creatorData.js`, pure, shared by the server page and the browser. Edit it freely to
stage a video.

- Six centers and five customers, with 555-01xx phone numbers (reserved for fiction) and
  stock sample company names (Fabrikam, Northwind, Contoso, Acme, Tailspin).
- **Oakdale Hub (1234, OAKHB, 100 Example Road)** is the same made-up SLIC the landing
  page and `/help` show. It has everything: a phone, arrival notes, directions with two
  ways and a way back, and a thread with replies, a pin and one of Alex's own tips. Use it
  for the tutorials.
- Directions on 1234, 1240, 1277 and 4027. Tips dated from now, so they always read as
  recent.

## Limits

- **Only the lookup screen.** `/places`, `/covers`, `/profile`, `/history` and the admin
  pages stay real, and the menu's Profile link opens your real profile. Record those
  pages with care, or build stage 2 first.
- **Directions documents** (photos, the railyard map) aren't made up: the documents call
  answers with none.
- Turning notifications on from the nudge after posting would subscribe the device for
  real; the server just isn't told until the next real page load.

## Stage 2 (idea)

The same pattern for Places (made-up places and comments) and Covers (a made-up week, as
the super admin's driver preview, `covers/CoverPreview.jsx`, already does with
placeholders): a `creator` branch on the server page, its calls added to
`lib/creatorFetch.js`.

## Checklist

- [x] Lint and a production build (scratch copy), 2026-11-12
- [x] The stand-in API, in Node: thread order, a reply to a reply filed under its top tip,
      vote toggling, the "Comment deleted" placeholder, routes parsing into their ways,
      unknown reads refused, writes never sent, `/api/auth/` and navigations passed
      through, and the real `fetch` back after
- [ ] On a phone, signed in as the super admin: turn it on, look up 1234, open Directions,
      post a tip, reply, vote, edit and delete it, open Votes, then turn it off and check
      that `/home`'s recent lookups are the real ones again
