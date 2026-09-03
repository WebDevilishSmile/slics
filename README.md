<!--
  TODO before publishing:
  - Replace every [ADD: ...] placeholder below
  - Confirm with your employer that it's OK to publicize this (see "A note before this goes public")
  - Scrub any real addresses, phone numbers, or internal system names from screenshots and sample data
-->

# SLICs

**Instant destination lookups for UPS Feeder drivers — no more digging through a binder.**

[Live demo link coming soon] · [https://github.com/WebDevilishSmile]

---

## The Problem

Before a Feeder driver leaves the building, dispatch hands them a SLIC — a short code identifying their destination (e.g. `1809`). To actually get there, the driver then had to either flip through a printed binder of addresses or ask dispatch to look it up and print a slip with the address and phone number. It worked, but it was slow, paper-dependent, and repeated the same manual lookup hundreds of times a week across the building.

## What It Does

SLICs replaces the binder with a single search bar. A driver types (or scans) a SLIC and instantly gets:

- The destination's address and phone number
- A one-tap link that opens the address directly in Google Maps
- A tappable phone number that calls the destination's dispatch right from the app
- Driver-added comments on each SLIC, so drivers can share firsthand knowledge that never makes it into an official address — where the actual entrance is, which roads to avoid (height/weight restrictions), who to contact on-site if there's an issue, and other details you only learn by having been there
- An admin panel (built for myself, as the maintainer) to add, edit, or remove SLICs as locations and details change — no redeploy needed

## Real-World Impact

This isn't a demo project — it's used daily by drivers in a building of roughly 270. A few numbers from production analytics:

- [ADD: current unique-driver count, e.g. from `COUNT(DISTINCT driver)` in the database]
- Averaging roughly 130 combined lookups/day across both live deployments as of September 2026
- Individual destination pages see far more repeat visits than unique visitors over the same period — drivers are coming back to the same lookups again and again as part of their regular routes, not just trying it once

_(Numbers pulled from Vercel Analytics + app database — update periodically rather than treating as fixed.)_

## Tech Stack

_(Adjust below if this doesn't match your actual setup)_

- **Framework:** Next.js / React / TypeScript
- **Database:** MongoDB
- **Auth:** Google sign-in / Email/password
- **Hosting/Analytics:** Vercel

## Notable Engineering Details

- **Built for one-handed, in-cab use** — the Maps and click-to-call links exist specifically because a driver mid-route doesn't want to copy an address or dial a number manually.
- **Admin CRUD without redeploys** — location data changes constantly (new stops, updated phone numbers), so the admin panel lets data stay current without touching code.
- **Fast search over a growing dataset** — built to return a match instantly even as the number of stored SLICs has grown.
- **Crowdsourced local knowledge** — official address data can't capture a hidden entrance, a bridge with a low clearance, or who to actually call when a dock is closed. Letting drivers comment directly on a SLIC turns the app from a static directory into a shared knowledge base built from what drivers have actually experienced on that route.

## Screenshots

[ADD: 2–4 screenshots — search bar + result card, the Maps/call links, and the admin panel]

## Why I Built This

I'm a Class A Feeder driver — this wasn't a coding exercise, it was a problem I ran into on the job every day. I built it, shipped it, and kept improving it based on what other drivers in my building actually needed.
