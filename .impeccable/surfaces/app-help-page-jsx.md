---
version: 1
slug: "app-help-page-jsx"
primary_target: "app/help/page.jsx"
related_targets: ["components/help/HelpGuide.jsx","components/help/guides.jsx"]
---

# /help surface brief

Scope: /help (app/help/page.jsx, components/help/). Visitor mode: Read. Public page.

Audience and job: BETPA Feeder drivers, mostly stuck on one task (directions, password, posting a tip), sometimes new drivers just told about the app. They want the answer for one button fast, on a phone, then back to the truck.

Constraints: the app's soft/embossed system (CLAUDE.md "Visual style"), evolved here with the user's approval: tighter emboss, left-aligned titles, a bigger type step. Guide copy names buttons exactly as the app labels them. Keep every guide anchor (/help#navigate etc.); they get texted to drivers. Keep the looping mark (user's choice, 2026-10-12).

Memorable moment: the example SLIC card with numbered pins; each guide for a card control shows that card again, dimmed, with only its control lit.

Decided 2026-10-12: the evolved style spreads to /privacy and /terms (components/legal/LegalPage.jsx, sections open on the page, a summary card and a contact card, a sticky section rail from lg). Unresolved: whether it spreads to the rest of the app.

## Direction contract

THESIS: Help that points at the real screen. Refuses the category's stack of same-size FAQ cards and chip indexes; the app's own SLIC card is the index.
OWN-WORLD: canvas #edf3fc / night #15181c, ink-blue #0172b5 as the only accent: solid blue pins, the solid Navigate button, links. Montserrat, 800-weight left-aligned titles at -0.02em. Soft emboss: raised cards, inset wells, round numbered discs; ghosted replica (other controls at low opacity) with one lit control ringed in blue.
STORY: The driver sees the card they already use, taps the number on the button they're stuck on, reads three short steps beside a picture of that button lit, and goes back. New drivers scroll the rest as a short course.
FIRST VIEWPORT: Blue header with back arrow. Left-aligned h1 "How to use SLICs" with a one-line lede ("Tap a number on the card to see how that button works"). The example card (EXAMPLE tag, OAKHB, address well with copy, Navigate, Call/PDF/Tips) with pins 1–5. Below it, "On this card": numbered rows linking to the five guides.
FORM: Show me on the screen, position 3 on my ordered list of seven, dealt as lead; seed key c4343a81. Raise from the brick-instructions challenger: replicas ghost everything but the step's control, with a call-out.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
