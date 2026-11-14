# Creator mode

Made-up data on every driver page, so videos of the app (the `/help` tutorials in
[`guides/VIDEO-SCRIPTS.md`](guides/VIDEO-SCRIPTS.md), posts, demos) never show a
real address, phone number, driver, tip, job or lookup.

## Status

- **Stage 1, the lookup screen** (/home, /hubs): live 2026-11-12.
- **Stage 2, the other driver pages** (Profile, History, Covers, Places): built
  2026-11-12. Not yet tried on a phone.
- Admin and Dispatch pages stay real (decided 2026-11-12); the creator menu hides them.
  Help, About, Privacy and Terms have no personal data.

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
  admin with the cookie; anyone else's cookie is ignored. While it's true, each driver page
  has a branch near the top that reads nothing from the database and renders the real
  components with made-up props from `lib/creatorData.js`:
  - `/home` and `/hubs` (`slic/SlicLookupPage.jsx` with `creator`): the SLICs and a lookup
    count, without /home's notes and nudges (welcome, thank-you, install, new icon,
    comment prompt).
  - `/profile/<your id>`: Alex's profile, his tips, a supporter date, the notification
    switches at their defaults, and the This week card, covering a job this week and on
    the list next week.
  - `/history`: about 90 lookups over six weeks, a few with notes. The membership gate
    still reads the real account (the middleware has no session lookup), which the super
    admin's is.
  - `/covers`: the page a verified cover driver gets: this week's and the bid week's
    jobs, Alex's place (cover #4, call-in 14:30), the bid day, a list, and the dispatch
    button on Oakdale Hub's phone. No preview link or notice.
  - `/places`: seven places with comments; one is Alex's, so Edit shows on it.
  - `/jobs` (since 2026-11-14, `JOBS-PAGE.md`): the Covers jobs as bid jobs, each with
    made-up hours, miles and a seniority number (`creatorJobs`). None is Alex's, and his
    menu has no Jobs row until the "Jobs for verified drivers" switch is on.
  - The header menu (`header/Header.jsx`) shows a made-up verified driver, Alex Rivera,
    with Covers through early access, no Admin or Dispatch rows and no alert badge.
- **The browser.** `creator/CreatorMode.jsx`, first on each of those pages, swaps
  `window.fetch` for `lib/creatorFetch.js`, which answers the pages' API calls:
  - tips (post, reply, edit, delete, vote, Votes), directions, reports and route
    suggestions;
  - the lookup counter and History (filters, paging, notes, Remove and Undo);
  - place comments (the same thread rules as tips) and adding, editing and deleting a
    place;
  - the cover list (`GET`/`PUT`), in the server's shape;
  - Edit profile. Deleting the account answers an error ("Account deletion is off in
    creator mode"), since the dialog would go on to sign out for real.

  Page loads, `/api/auth/` (sign out) and this device's notifications (turning them on or
  off, and the test push, which is about the device, not the account's data) go to the
  server as usual. Any other `/api/` call is answered without being sent: a read gets a
  404, a write gets `{ success: true }`. Nothing real shows up and nothing real is written
  while recording. Leaving for a page that isn't faked gives the real `fetch` back.
- **One copy per tab.** The made-up data lives in `lib/creatorStore.js`, made on first use
  and kept across client navigations, so a tip posted on /home shows under Your tips on
  the profile, a lookup shows in History, and a place or a list stays put. The pages read
  it through the wrappers in `creator/CreatorPages.jsx`, which also outlast a
  `router.refresh()` (that re-renders the same made-up props). A reload starts over.
- **Per-device lists.** While it's on, recent lookups, tips seen and the comment prompt
  use their own localStorage keys (`creatorStorageKey`), so made-up SLICs never land in
  the real ones.

## The made-up data

`lib/creatorData.js`, pure (it imports only pure modules: the browser loads it too),
shared by the server pages and the browser. Edit it freely to stage a video.

- Six centers and five customers, with 555-01xx phone numbers (reserved for fiction) and
  stock sample company names (Fabrikam, Northwind, Contoso, Acme, Tailspin).
- **Oakdale Hub (1234, OAKHB, 100 Example Road)** is the same made-up SLIC the landing
  page and `/help` show. It has everything: a phone, arrival notes, directions with two
  ways and a way back, and a thread with replies, a pin and one of Alex's own tips. Use it
  for the tutorials.
- Directions on 1234, 1240, 1277 and 4027. Tips, lookups and places are dated from now,
  so they always read as recent.
- Cover jobs OAK101–OAK114, routes between the made-up centers, so the This week card's
  stops link to their lookups. Covers dates come from the real `currentBidWeek` /
  `bidDateFor`, so the weeks turn over like the real page's.

## Limits

- **Directions documents** (photos, the railyard map) aren't made up: the documents call
  answers with none.
- Turning notifications on, off or sending the test reaches the server for real, as it's
  about the device.
- **Covers lists after a full reload** come from the made-up start again, like everything
  else.
- The admin and dispatch pages are real.

## Checklist

- [x] Lint and a production build (scratch copy), 2026-11-12, both stages
- [x] Stage 1's stand-in API, in Node: thread order, a reply to a reply filed under its
      top tip, vote toggling, the "Comment deleted" placeholder, routes parsing into their
      ways, unknown reads refused, writes never sent, `/api/auth/` and navigations passed
      through, and the real `fetch` back after
- [x] Stage 2, in Node: the This week card's stops all link to made-up SLICs; History's
      search, type, notes, date and sort filters and paging; a lookup adds a row (a repeat
      doesn't); notes, Remove and Undo; a tip posted shows in Your tips; the place thread
      rules, adding (sorted by state), editing and deleting a place with its comments; the
      cover list keeps only the week's jobs; Edit profile sticks; account deletion is
      refused; the notification calls pass through; the data outlives leaving and coming
      back
- [ ] On a phone, signed in as the super admin: turn it on and go through every page:
  - /home: look up 1234, open Directions, post a tip, reply, vote, edit and delete it,
    and open Votes;
  - Profile: the This week card, Your tips (the tip from /home), Edit profile;
  - History: the new lookup, a filter, a note, Remove and Undo;
  - Covers: the place and call-in, add jobs to the list and reorder them;
  - Places: add a place, comment, vote.

  Then turn it off and check that every page and `/home`'s recent lookups are real again.
