---
target: sign in page
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\LocalFiles\\WebDevelopment\\slics\\app\\sign-in\\page.jsx"
target_fingerprint: "sha256:a2dc59aa5c8fac3ec90c0811f3f9a1e9c824398f31be641c688161540b4d0b04"
target_path: "C:\\LocalFiles\\WebDevelopment\\slics\\app\\sign-in\\page.jsx"
timestamp: 2026-10-12T05-36-59Z
slug: app-sign-in-page-jsx
closed: true
---
# Critique: /sign-in (app/sign-in/page.jsx, components/signIn/)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Error Alert above the form, can be off-screen on a phone; no Google pending state; heading/title never change with the mode |
| 2 | Match System / Real World | 3 | Membership "click the link below"; Sign In / Sign in casing |
| 3 | User Control and Freedom | 2 | Mode not in URL; email dropped between sign-up and sign-in |
| 4 | Consistency and Standards | 2 | Reset has show-password, sign-in/up don't; two contained buttons in Membership; hardcoded 8 |
| 5 | Error Prevention | 2 | Confirm field instead of reveal; no Google-only hint |
| 6 | Recognition Rather Than Recall | 3 | Must remember Google vs password |
| 7 | Flexibility and Efficiency | 3 | No name attrs; email not username |
| 8 | Aesthetic and Minimalist Design | 3 | Redundant intro line |
| 9 | Error Recovery | 1 | Errors not tied to fields; Google-only dead ends |
| 10 | Help and Documentation | 3 | Help link and forgot fallback are good |
| **Total** | | **24/40** | **Acceptable** |

## Design Specificity Verdict
Generic auth template in the SLICs skin. Landing page's Google data promise missing at the handoff; H1 static across modes. Forgot-password fallback copy is the product-specific high point. Detector: source clean; URL scan overused-font (Montserrat, false positive). Overlay blocked by CSP; CDP fallback measurements confirmed no aria-invalid / describedby on errors, focus to body on mode switch, static h1/title, 20px link-buttons, min contrast 4.62.

## Priority Issues
- [P1] Errors far from the field and not tied to it; Alert above the form (EmailAuth.jsx:133-137) scrolls off-screen on a phone sign-up; native bubbles; no aria-invalid. Fix: field-level error/helperText, server errors above submit or scroll+focus. Command: harden.
- [P1] Google-only driver dead ends: "Invalid email or password." (EmailAuth.jsx:61), register 409 (register/route.js:62-67). Fix: name the Google path in both errors, "Sign in instead" carrying the email. Command: clarify.
- [P1] Focus lost on every mode switch; h1 (page.jsx:33-35), intro and title static; Google section stays on forgot; mode not in URL. Fix: per-mode heading focused on switch, ?mode=, hide Google on forgot. Command: harden.
- [P2] No show-password; Confirm Password; no name attrs; email not username; hardcoded 8. Fix: reuse reset form's visibility toggle, drop confirm, PASSWORD_MIN_LENGTH, name + autocomplete username. Command: adapt.
- [P2] Google handoff without reassurance or pending state; text link-buttons 20px tall. Fix: "Opening Google…" pending state, data line + Privacy link, 44px hit areas. Command: polish.
- Bug: EmailAuth.jsx:108-110 "Account created. Please sign in." is cleared by switchMode, and would be a red error.

## Persona Red Flags
- Jordan: title says only Sign in; Create one near the bottom; donation pitch after sign-up.
- Sam: focus to body on mode switch; native bubbles, no aria-invalid; RedirectMember h2 without h1, status not announced; "See how to sign in" default 1px focus ring.
- Casey: no Google feedback; 20px links; two password fields, no reveal; reload loses mode and fields.
- Google-months-ago driver: invalid → Create one → already exists → Forgot → email.

## Minor Observations
- Non-members get "Welcome to SLICs / Now that you have an account…" and a donation pitch after every sign-in.
- RedirectMember: 500ms delay, "SLIC lookup" copy wrong for /history.
- Membership.jsx:14-34 dead branch; lib/callbackUrl.js:5 stale comment.
- "or continue with email" divider weak; header "Sign In" vs h1 casing; help step 1 says "Sign in" vs landing "Sign in or sign up".

## Questions to Consider
1. Membership prompt after every sign-in, once, or only on /history?
2. Email + password behind "Use email instead"?
3. Tell a Google-only account so on the page?
