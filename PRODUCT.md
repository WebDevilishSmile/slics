# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

UPS Feeder drivers at the BETPA hub, a building of about 270 drivers. Dispatch gives a driver a SLIC (a short code for the destination) on their IVIS, the company handheld. SLICs runs on the driver's own phone, so a lookup means reading the code off one device and typing it into the other, before leaving the yard or while parked. The maintainer, also a Feeder driver at BETPA, is the app's only admin.

## Product Purpose

SLICs replaces the paper binder of destination addresses. A driver types a SLIC and gets the address, a tap-to-open maps link, a tap-to-call phone number, a directions PDF where one exists, and tips other drivers left about that location (real entrances, low bridges, who to call). Success is a driver getting from code to directions in seconds, every shift, without asking dispatch.

## Positioning

Built and run by a driver in the same building, from what drivers there actually need. The tips are local knowledge no official address list carries. It is independent: not made, endorsed or operated by UPS.

## Operating Context

- Used daily in production since early 2025; about 200 of the building's drivers have used it.
- Phones, often one-handed, in a truck cab or the yard, day and night; never while the vehicle is moving.
- Drivers also use Places (fuel, food, restrooms found by other drivers), lookup history (supporters), and, for verified drivers, the weekly cover bid (admin-only until rollout).

## Capabilities and Constraints

- Free. Supporters on Buy Me a Coffee unlock extra features such as the History page.
- Sign in with Google or email and password. /, /help, /privacy and /terms are public.
- Changes to auth, data integrity and admin flows have real user impact; ship reversible changes.
- Terminology: SLIC (the code), "Driver tips" (comments on a SLIC), Places, covers, the on-call sheet.

## Brand Commitments

- The name SLICs and the S mark (public/slics-icon.svg).
- Plain, short, driver-to-driver language. Button names quoted exactly as the app labels them.

## Evidence on Hand

- Usage numbers in README.md (Vercel Analytics plus the app database). Update them; don't invent new ones.
- No testimonials, screenshots or press exist. Don't fabricate any.

## Product Principles

1. Seconds matter: the answer comes before anything else on the screen.
2. Written for drivers, by a driver: their words, not software words.
3. Local knowledge is the product's edge; protect its accuracy and the drivers who share it.
4. Never compromise privacy between drivers (no names, picks or ids leak).

## Accessibility & Inclusion

Phone-first at 390px, touch targets of 40–48px, WCAG AA contrast in light and dark, readable at night, reduced motion respected.
