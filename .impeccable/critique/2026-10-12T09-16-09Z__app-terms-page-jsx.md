---
target: /terms
total_score: 22
max_score: 36
na_heuristics: 5
p0_count: 0
p1_count: 0
target_identity: "file:C:\\LocalFiles\\WebDevelopment\\slics\\app\\terms\\page.jsx"
target_fingerprint: "sha256:8fe2b862ca8dd0f5239fe50cd279b3dec3d707ea7ec691a750efd44d19ddb9cd"
target_path: "C:\\LocalFiles\\WebDevelopment\\slics\\app\\terms\\page.jsx"
timestamp: 2026-10-12T09-16-09Z
slug: app-terms-page-jsx
---
# Critique: /terms (app/terms/page.jsx, components/legal/)
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility | 1 | 19 sections, ~10.5 screens, no TOC |
| 2 | Real world | 4 | "The short version" opener |
| 3 | Control | 2 | No anchors |
| 4 | Consistency | 2 | Tip placeholders described only for places |
| 5 | Error prevention | n/a | Read-only |
| 6 | Recognition | 2 | Weak h6 section titles |
| 7 | Flexibility | 2 | Short version doesn't link into sections |
| 8 | Minimalist | 3 | Lean |
| 9 | Error recovery | 3 | Exact deletion steps + email fallback |
| 10 | Help | 3 | Contact at end |
| **Total** | | **22/36** | **Acceptable (61%)** |
## Priority issues (shared run across /help, /privacy, /terms)
1. [P1] Privacy "Your choices" omits self-service account deletion (privacy/page.jsx:232-247); also stale: local-storage list (6 keys missing, says "comment" not "tip"), tip pins absent from location/info sections, push subscriptions unmentioned, "anyone can see votes" overstates. Fix + bump EFFECTIVE_DATE. ($impeccable clarify)
2. [P1] /help has no exit when stuck: "Ask the SLICs admin" with no contact, password recovery buried as note 2 of guide 1, no "Still stuck?" close, footer has no Help link. ($impeccable onboard / clarify)
3. [P2] Legal pages: no h1 (sectionHeading renders h2), sections h3 styled h6 regular weight (LegalSection.jsx:23) — flat hierarchy, broken outline. ($impeccable typeset)
4. [P2] Long-doc wayfinding: legal 9.3k/8.9k px with no TOC/anchors; /help 12.6k px, index ~1.5 screens, no back-to-guides. ($impeccable layout)
5. [P2] /help logo loops forever above the title (page.jsx:20, `loop`): WCAG 2.2.2, distracts on a page people reach confused. ($impeccable quieter)
Minor: Tap labels look like links (guides.jsx:23); HelpGuide ol listStyle none + aria-hidden numbers loses list semantics in VoiceOver; fontSize 1.0625rem one-off (HelpGuide.jsx:92); terms "Ending your account" 8-item paragraph; terms third parties omit Apple Maps/Resend; contact gmail hardcoded in 3 files; "comments" (legal) vs "Driver tips" (app).
Detector: CLI 0 findings; browser overlay only `overused-font` (Montserrat, app-wide, not page-specific).
