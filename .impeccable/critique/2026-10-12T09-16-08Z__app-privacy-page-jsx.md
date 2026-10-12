---
target: /privacy
total_score: 19
max_score: 36
na_heuristics: 5
p0_count: 0
p1_count: 1
target_identity: "file:C:\\LocalFiles\\WebDevelopment\\slics\\app\\privacy\\page.jsx"
target_fingerprint: "sha256:0fb4f41e7e3fa80bced7d05a218a1941c9969b39380bc65e7bb275b85c50d80f"
target_path: "C:\\LocalFiles\\WebDevelopment\\slics\\app\\privacy\\page.jsx"
timestamp: 2026-10-12T09-16-08Z
slug: app-privacy-page-jsx
---
# Critique: /privacy (app/privacy/page.jsx, components/legal/)
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility | 1 | 11 screens, no TOC/anchors |
| 2 | Real world | 3 | "comments" vs app's "Driver tips" |
| 3 | Control | 2 | No linkable sections |
| 4 | Consistency | 2 | Structure unlike /help; vocabulary drift |
| 5 | Error prevention | n/a | Read-only |
| 6 | Recognition | 2 | Section titles barely outrank body |
| 7 | Flexibility | 1 | No summary/skim path |
| 8 | Minimalist | 3 | Tight prose, equal weight everywhere |
| 9 | Error recovery | 2 | Deletion only by email (self-service exists) |
| 10 | Help | 3 | Contact in three places |
| **Total** | | **19/36** | **Acceptable (53%)** |
## Priority issues (shared run across /help, /privacy, /terms)
1. [P1] Privacy "Your choices" omits self-service account deletion (privacy/page.jsx:232-247); also stale: local-storage list (6 keys missing, says "comment" not "tip"), tip pins absent from location/info sections, push subscriptions unmentioned, "anyone can see votes" overstates. Fix + bump EFFECTIVE_DATE. ($impeccable clarify)
2. [P1] /help has no exit when stuck: "Ask the SLICs admin" with no contact, password recovery buried as note 2 of guide 1, no "Still stuck?" close, footer has no Help link. ($impeccable onboard / clarify)
3. [P2] Legal pages: no h1 (sectionHeading renders h2), sections h3 styled h6 regular weight (LegalSection.jsx:23) — flat hierarchy, broken outline. ($impeccable typeset)
4. [P2] Long-doc wayfinding: legal 9.3k/8.9k px with no TOC/anchors; /help 12.6k px, index ~1.5 screens, no back-to-guides. ($impeccable layout)
5. [P2] /help logo loops forever above the title (page.jsx:20, `loop`): WCAG 2.2.2, distracts on a page people reach confused. ($impeccable quieter)
Minor: Tap labels look like links (guides.jsx:23); HelpGuide ol listStyle none + aria-hidden numbers loses list semantics in VoiceOver; fontSize 1.0625rem one-off (HelpGuide.jsx:92); terms "Ending your account" 8-item paragraph; terms third parties omit Apple Maps/Resend; contact gmail hardcoded in 3 files; "comments" (legal) vs "Driver tips" (app).
Detector: CLI 0 findings; browser overlay only `overused-font` (Montserrat, app-wide, not page-specific).
