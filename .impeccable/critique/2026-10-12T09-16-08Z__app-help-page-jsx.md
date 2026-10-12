---
target: /help
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\LocalFiles\\WebDevelopment\\slics\\app\\help\\page.jsx"
target_fingerprint: "sha256:565f6a3d10ebcd133c17dca02553e813eaa799df53a5dad3f2352d7038da7b58"
target_path: "C:\\LocalFiles\\WebDevelopment\\slics\\app\\help\\page.jsx"
timestamp: 2026-10-12T09-16-08Z
slug: app-help-page-jsx
---
# Critique: /help (app/help/page.jsx, components/help/)
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility | 2 | 15-screen page, no location cue or back-to-top |
| 2 | Real world | 4 | Driver vocabulary throughout |
| 3 | Control | 2 | No way back to the index after a jump |
| 4 | Consistency | 3 | Bold blue Tap labels look like links |
| 5 | Error prevention | 3 | Good "Good to know" notes |
| 6 | Recognition | 3 | No visuals of the controls named |
| 7 | Flexibility | 2 | No search across 14 guides |
| 8 | Minimalist | 3 | Chip index ~1.5 screens before content |
| 9 | Error recovery | 2 | Password recovery buried; no admin contact |
| 10 | Help | 3 | No "Still stuck?" close |
| **Total** | | **27/40** | **Acceptable** |
## Priority issues (shared run across /help, /privacy, /terms)
1. [P1] Privacy "Your choices" omits self-service account deletion (privacy/page.jsx:232-247); also stale: local-storage list (6 keys missing, says "comment" not "tip"), tip pins absent from location/info sections, push subscriptions unmentioned, "anyone can see votes" overstates. Fix + bump EFFECTIVE_DATE. ($impeccable clarify)
2. [P1] /help has no exit when stuck: "Ask the SLICs admin" with no contact, password recovery buried as note 2 of guide 1, no "Still stuck?" close, footer has no Help link. ($impeccable onboard / clarify)
3. [P2] Legal pages: no h1 (sectionHeading renders h2), sections h3 styled h6 regular weight (LegalSection.jsx:23) — flat hierarchy, broken outline. ($impeccable typeset)
4. [P2] Long-doc wayfinding: legal 9.3k/8.9k px with no TOC/anchors; /help 12.6k px, index ~1.5 screens, no back-to-guides. ($impeccable layout)
5. [P2] /help logo loops forever above the title (page.jsx:20, `loop`): WCAG 2.2.2, distracts on a page people reach confused. ($impeccable quieter)
Minor: Tap labels look like links (guides.jsx:23); HelpGuide ol listStyle none + aria-hidden numbers loses list semantics in VoiceOver; fontSize 1.0625rem one-off (HelpGuide.jsx:92); terms "Ending your account" 8-item paragraph; terms third parties omit Apple Maps/Resend; contact gmail hardcoded in 3 files; "comments" (legal) vs "Driver tips" (app).
Detector: CLI 0 findings; browser overlay only `overused-font` (Montserrat, app-wide, not page-specific).
