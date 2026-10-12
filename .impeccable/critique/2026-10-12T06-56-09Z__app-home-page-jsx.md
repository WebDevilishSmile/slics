---
target: /home
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\LocalFiles\\WebDevelopment\\slics\\app\\home\\page.jsx"
target_fingerprint: "sha256:d0803249c5109b679ecad41c7deef02a4a648c6e97304611cbce21dbd618dec6"
target_path: "C:\\LocalFiles\\WebDevelopment\\slics\\app\\home\\page.jsx"
timestamp: 2026-10-12T06-56-09Z
slug: app-home-page-jsx
---
# Critique: /home (app/home/page.jsx, slic/SlicLookupPage, home/, comments/, install/)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | First paint has no search/card; a pick isn't announced |
| 2 | Match System / Real World | 3 | "Comment deleted" in "Driver tips" |
| 3 | User Control and Freedom | 2 | Clearing wipes card + URL; keyboard stays up |
| 4 | Consistency and Standards | 3 | "Navigate … Google Maps" reads as a split button |
| 5 | Error Prevention | 2 | Enter takes a substring match; 32px vote count beside vote button |
| 6 | Recognition Rather Than Recall | 3 | Recent repeats the SLIC on screen |
| 7 | Flexibility and Efficiency | 2 | No blur/enterKeyHint; ~167 KB RSC per lookup |
| 8 | Aesthetic and Minimalist Design | 3 | H1, notices, 7 chips before content |
| 9 | Error Recovery | 1 | "No options" dead end, unannounced; offline nothing |
| 10 | Help and Documentation | 3 | Rotating tips, /help |
| **Total** | | **25/40** | **Acceptable** |

## Design Specificity Verdict
Card authored for the job; page around it generic (H1 under a branded header, stacked equal panels). Detector: source clean; URL scan impossible (session). Browser: placeholders 2.53 light (search, composer), "Newest" 4.47, footer focus ring 1:1 in light (app-wide), tips h2→h6, rotating tip in aria-live polite, dangling listbox aria-labelledby.

## Priority Issues
- [P1] First paint has no search or card: HydrationGuard (utility/HydrationGuard.jsx:11-14, SlicLookupPage.jsx:28-34) server-renders a blank div; card pops in and pushes tips. Fix: skeleton + static search shell, or drop the guard. Command: harden, optimize.
- [P1] Keyboard stays up after a pick (no blurOnSelect, no enterKeyHint); card change not announced. Fix: blurOnSelect, enterKeyHint search, polite announcement or focus card h2. Command: adapt.
- [P1] Search: clearing runs router.push('/home') (SlicsSearch.jsx:199) and eats keystrokes; filterAll (:112) unranked substring + autoHighlight picks wrong SLIC; "No options" unannounced dead end. Fix: clear only via ✕, prefix-first ranking, helpful no-match text in a live region. Command: harden, clarify.
- [P2] Door buried: pinned spot at y≈1373/812 under 7 chips + always-open composer + Add pin (Comments.jsx:249-258). Fix: thread first, composer behind "Add a tip", top pinned spot on the card. Command: layout, distill.
- [P2] Notices above search (page.jsx:65-68, donation SoftNotice) and modal CommentPrompt on visibilitychange (CommentPrompt.jsx:62-69); hub copy bug (line 53). Fix: one notice at a time below the card, inline prompt, drop H1, branch prompt copy. Command: quieter, clarify.

## Persona Red Flags
- Alex: substring Enter, destructive clear, Recent repeats, round trip per lookup.
- Sam: no announcement on pick or no-match; h2→h6; rotating live region; invisible footer focus ring.
- Casey: keyboard over Navigate; <44px targets (copy 36, chips 32, sort/Add pin 37, vote counts 32×31); address weaker than headline; placeholders 2.53.
- Night driver: door 1.7 screens down; Navigate to street; 12px tip times.

## Minor Observations
- Dangling aria-labelledby; groups without role=group.
- tel: not normalized; customers never get Call.
- NoSlicComments 24rem panel with one sentence.
- 0-tip Tips tile; recent chips lack number; dark sort emphasis inverted; title never includes SLIC; "slics" lowercase.

## Questions to Consider
1. Navigate to the drivers' pinned entrance?
2. /home as search + card only, tips behind a disclosure?
3. Lookups without the network from a local snapshot?
