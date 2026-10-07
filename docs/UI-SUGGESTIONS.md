# UI-SUGGESTIONS.md

The punch list for the app's look, feel and front-end UX. It sits alongside
`SUGGESTIONS.md` (security/perf/quality) and `STRUCTURE.md` (where things live). This
file was called `THEME.md` until 2026-10-03. Item numbers are unchanged because code
comments and `CLAUDE.md` cite them (`#17`, `#18`, `#19`, …).

It has two parts:

- **[Part 1 — Theme plumbing](#part-1--theme-plumbing) (#1–#30).** This was the original
  `THEME.md`. It makes styling controllable from `utils/theme.js`. Items 1–19 are done,
  and #20's spacing half is done. Its other half (`fontSize` overrides) and #21–#30 are
  still open.
- **[Part 2 — UI review and modernization](#part-2--ui-review-and-modernization) (#31–#57).**
  A review of the app as drivers use it, done on 2026-10-03: accessibility defects,
  phone layout, the lookup screen, motion, and navigation. Start with
  [the suggested order](#suggested-order).

**How to use this:** every item is independent unless it says `Depends on:`. Pick one,
do it, check the box. Each item states its *blast radius* so you can judge risk before
starting.

**Before shipping any item:** there is no test suite in this repo. Run `npm run build`,
then click through the affected screens in **both light and dark mode** at phone width.
The app is used daily in production.

---

# Part 1 — Theme plumbing

## Why this list exists

The theme file is partly inert. Three defects mean edits you make in `utils/theme.js`
currently have **no visible effect** — those are items 1, 2 and 3, and they're why this
list starts where it does. Everything after that is about reducing the number of places a
styling decision can hide: today there are 373 `sx={{ }}` blocks across 120 files, plus a
second dead palette in `app/globals.css` that conflicts with the real one.

---

## Tier 0 — Broken right now

Defects, not preferences. Items 1–3 are the reason theme edits don't take.

### 1. `--font-font` is never defined, so the theme's font setting does nothing

- [x] **DONE.** **File:** `app/layout.jsx:29`

`Montserrat({ variable: '--font-font', ... })` is declared at line 13, but line 29 applies
only `` className={`${font.className}`} ``. In `next/font`, `font.variable` is the class
that *defines* the custom property; `font.className` merely sets `font-family` directly.
So `--font-font` never enters the cascade, and every `fontFamily: 'var(--font-font)'` in
`utils/theme.js` (lines 63, 103, 114, 126, 138, 153) resolves to an invalid value. Text
looks right only because `<body>` inherits Montserrat from `font.className`.

**Fix applied:** `className={font.variable}` — MUI's documented next/font pattern.

`font.variable` **alone**, not alongside `font.className`. Keeping both would define the
variable but not finish the job: `font.className` is a *class*
(`.__className_x { font-family: Montserrat }`) while CssBaseline sets the body font via an
*element* selector (`body { font-family: ... }`). The class outranks it, so the theme
still wouldn't control inherited text. With `variable` alone, nothing overrides
CssBaseline and the chain completes:

```
theme.typography.fontFamily  →  body { font-family: var(--font-font) }  →  Montserrat
```

**Verified in the running app**, not just by build:
- `.montserrat_…__variable { --font-font: "Montserrat", "Montserrat Fallback" }` is now on
  `<body>`, and 32 `var(--font-font)` references in the emitted CSS resolve.
- Temporarily setting `typography.fontFamily` to `'Comic Sans MS'` changed the served
  `body` rule to `font-family:Comic Sans MS`; reverting restored `var(--font-font)`.
  Before this fix that edit had no visible effect.

**To change the app's font now:** swap the `Montserrat(...)` loader in `app/layout.jsx:13`
(both the family and the `weight` array). `utils/theme.js` just points at the variable.

*Blast radius:* one line, but font rendering is global — worth a look at a real page.

### 2. `MuiButton` is declared twice; the first block is dead

- [x] **DONE.** **File:** `utils/theme.js:100` and `:109`

Two `MuiButton` keys in the same `components` object. The second (`variants`) silently
overwrote the first (`styleOverrides`), so the `styleOverrides.root` block never applied.

**What actually happened:** the three `variants` each repeated the same `fontFamily` /
`borderRadius` / `textTransform`, and those *are* valid CSS, so buttons did get the
intended radius and casing — just via three copies in the wrong place. Merging them back
into a single `styleOverrides.root` is therefore **visually identical**, confirmed below.

*Blast radius:* none in practice. Done together with #3.

### 3. Palette paths in `MuiButton.variants` never resolve

- [x] **DONE — but not the way this item originally proposed.** **File:**
  `utils/theme.js:117, 129, 141` (and the `&:hover` blocks below each)

`color: 'text.light'` and `backgroundColor: 'primary.dark'` were `sx` shorthand written
into a **plain CSS** context. MUI does not resolve palette paths in `variants[].style`, so
the browser received literal `color:text.light` and discarded it. Verified in the served
HTML: **8 invalid declarations** on the home page alone, plus 4 hover rules that were
empty after the browser dropped their only declaration.

**This item originally said to resurrect them with a theme callback. That would have been
a regression** — three reasons:

1. `color: text.light` (`#f7f7f7`) on the `text` and `outlined` variants is near-white
   text on a light background. Invisible buttons.
2. `backgroundColor: primary.dark` on hover applied to *all* contained buttons would turn
   the 10 `color="error"` delete buttons **blue** on hover.
3. For `contained`, the intent is already MUI's default. The emitted CSS proves it:
   ```
   :hover{--variant-containedBg:var(--mui-palette-primary-dark); …}
   ```
   MUI already darkens to `primary.dark` on hover — and does it *per color prop*, so an
   error button darkens to error-dark. The hardcoded override would have destroyed that.

**Fix applied:** deleted the color/hover rules rather than reviving them, and merged the
surviving `fontFamily` / `borderRadius` / `textTransform` into one `styleOverrides.root`
(item 2). A comment in `theme.js` records why the color rules must not come back.

**Verified by diffing served CSS before/after:**

| | before | after |
|---|---|---|
| `color:text.light` (invalid) | 4 | **0** |
| `background-color:primary.dark` (invalid) | 4 | **0** |
| `border-radius:1.5rem` | 4 | 4 |
| `text-transform:none` | 4 | 4 |
| rendered button elements | 4 | 4 |
| `MuiButton` `:hover` rules | 20 | 16 (the 4 empty ones) |

*Blast radius:* none — appearance is unchanged; 8 invalid declarations and 4 dead rules
are simply no longer shipped. `npm run build` passes.

**If you did want themed button colors**, that's a new decision rather than a bug fix —
scope it per variant and per color prop, or set it at the call site as
`footer/Footer.jsx` and `header/UserMenu.jsx` already do.

### 4. Dark-mode branch mishandles `'system'`

- [x] **DONE.** **Files:** `app/components/comments/Comment.jsx:37`,
  `app/components/comments/CommentEditor.jsx:89, 101`, `app/globals.css`

These branched on `mode === 'light'`, but MUI's `mode` has three states — `'light'`,
`'dark'`, and `'system'` — plus `undefined` on the server and first client render.
Both non-`'light'` cases fell to the else branch and got the **dark** hex.

**This was worse than it looked.** `'system'` is not an edge case here — it is the
default. The theme defines both schemes, so MUI's provider resolves `defaultMode` to
`'system'` (`@mui/system/cssVars/createCssVarsProvider.js:92`), and the served
`InitColorSchemeScript` confirms it: `localStorage.getItem('mui-mode') || 'system'`.
So every driver who has never clicked the mode toggle was on `'system'`, and on a
light-OS device got a `#050505` editor with dark text. The `undefined` case also meant
the SSR HTML always carried the dark class and flipped on hydration.

**Fix applied.** `globals.css` gains one class that reads the palette variable MUI
already emits (`--mui-palette-background-comment`, redefined under `.dark` by
`cssVariables: { colorSchemeSelector: 'class' }`):

```css
.comment-surface {
  background-color: var(--mui-palette-background-comment);
}
```

The tiptap element (`CommentEditor.jsx:88`) uses it in place of the two `bg-[#…]`
classes — tiptap renders that element itself, so it's the one place `sx` can't reach.
The Tailwind layout utilities on it are untouched. `useColorScheme()` and the `mode`
branches are gone from both components.

**Not the way this item originally sketched it, in two respects:**

1. The `border-[#…]` classes on the two `Paper`s were deleted, not replaced. Both are
   elevation variants, and Tailwind's preflight sets `border-width: 0` on everything,
   so those classes never painted a single pixel. Hence no `border-color` in
   `.comment-surface` — it would be a dead declaration on an element with
   `border-none`.
2. The `Paper`s keep their existing `sx` `bgcolor: 'background.comment'` rather than
   taking the class. Emotion's style tags are appended after `globals.css`, so a plain
   global class of equal specificity would lose to `MuiPaper-root`'s own
   `background-color`. `sx` has no such ordering risk; the class is only for the
   element MUI doesn't style.

**Verified against the served output, not by reading code:**
- The variable is defined at `:root,.light{…}` and redefined at `.dark{…}` in the
  emitted CSS — document-global, so it resolves where tiptap renders (the caveat below).
- Headless Chrome, using the *served* variable rules and the *served* init script,
  computed the background of a `.comment-surface` element in all four states:

  | stored `mui-mode` | `prefers-color-scheme` | `<html>` class | computed background |
  |---|---|---|---|
  | (none → `system`) | light | `light` | `rgb(234, 248, 254)` = `#eaf8fe` ✔ (was `#050505`) |
  | (none → `system`) | dark | `dark` | `rgb(5, 5, 5)` = `#050505` ✔ |
  | `light` | — | `light` | `#eaf8fe` ✔ |
  | `dark` | — | `dark` | `#050505` ✔ |

- The comment editor is only rendered behind auth, so the two components were syntax-
  checked by transpiling them rather than via the dev bundle. `npm run lint` currently
  fails at config level on every directory (`eslint.config.mjs` serialization) —
  pre-existing and unrelated.

*Caveat (retained from the original item, now satisfied):* the variable is defined
where tiptap renders — see above.

*Blast radius:* comment editor and comment cards, both schemes. Explicit light/dark
users see no change; `system`+light-OS users get a readable editor for the first time.

### 5. Code blocks in comments are invisible in light mode

- [x] **DONE — the premise was off, and the fix is broader than the file list.**
  **Files:** `app/globals.css:47-85`, `app/components/comments/Comment.jsx:52`,
  `app/components/comments/CommentEditor.jsx:88`

The tiptap styles referenced four CSS variables that were **never defined anywhere**:
`--black`, `--white`, `--gray-2`, `--gray-3` — copy-pasted from the tiptap starter
template, which defines them; this app never did.

**What was actually happening**, measured with the served CSS in headless Chrome rather
than assumed. An undefined `var()` makes the declaration *invalid at computed-value
time*, which does not mean "invisible": the property falls back to its initial value
(`background` → transparent) or its inherited value (`color`). So:

- Nothing was ever unreadable. Text kept the scheme's normal color in both modes.
- Code blocks, inline code and blockquotes were **indistinguishable from plain text** —
  no background, no left border. Only `<hr>` was truly invisible (`border: none` plus
  an invalid `border-top` → `0px none`).
- **And all of it applied only inside the editor.** `@tiptap/core` prepends the
  `tiptap` class to its own contenteditable element (`dist/index.js:4669`); nothing
  in `app/` puts it on a rendered comment. `Comment.jsx` renders the stored HTML via
  `html-react-parser` into a plain `Box`, so posted comments never had *any* of these
  rules — a `<blockquote>` was bare text, and `<hr>` was Tailwind preflight's hardcoded
  `1px solid #e5e7eb`, which ignores the color scheme.

**Fix applied.** The block is renamed `.comment-content` and both places comment
content renders carry that class — the tiptap element (alongside `comment-surface`
from item 4) and the rendered `Box` in `Comment.jsx` — so a code block looks the same
while typing and after posting. The four undefined variables became two translucent
MUI tokens, which sit correctly on any surface in either scheme:

| was | now | light | dark |
|---|---|---|---|
| `--black` (code / pre background) | `--mui-palette-action-selected` | `rgba(0,0,0,.08)` | `rgba(255,255,255,.16)` |
| `--gray-2`, `--gray-3` (hr / blockquote border) | `--mui-palette-divider` | `rgba(0,0,0,.12)` | `rgba(255,255,255,.12)` |
| `--black`, `--white` (code / pre `color`) | *dropped — inherits* | | |

Two smaller things went with it: `pre`'s `font-family: 'JetBrainsMono', monospace`
was deleted (that font is loaded nowhere, so it always fell through to the generic
family; now Tailwind preflight's `ui-monospace, …` stack applies uniformly), and the
placeholder rule `.tiptap p.is-editor-empty…` stays as-is — it is editor-only by nature.

**Verified by computed style, before and after, both schemes**, on markup containing
`<code>`, `<pre><code>`, `<blockquote>` and `<hr>` — once under `.tiptap` (editor) and
once as a bare rendered comment:

| | before (editor) | before (rendered) | after (both) |
|---|---|---|---|
| `code` / `pre` background | transparent | transparent | `action.selected` ✔ |
| `blockquote` border-left | `0px none` | `0px` | `3px solid divider` ✔ |
| `hr` border-top | `0px none` (invisible) | `1px solid #e5e7eb` (fixed grey) | `1px solid divider` ✔ |
| undefined `var()`s in served CSS | 5 | | **0** |

Rendered and editor now compute identically in each scheme.

*Blast radius:* larger than the original line said — it now includes **posted**
comments that contain code, quotes or rules, which pick up a background/border for the
first time. Those elements only arise from StarterKit's markdown-style shortcuts
(backtick-wrapped text, a triple-backtick fence, a leading `>`, a `---` line) since the
editor has no toolbar, so expect few. Plain paragraphs are untouched. To revert only the
display half, remove `className='comment-content'` from `Comment.jsx`.

### 6. Theme toggle is asymmetric

- [x] **DONE — cleanup, not a behavior change.** **File:**
  `app/components/layout/ModeSwitch.jsx:13-24`

The second `if` was missing `else`, so after the `system`+dark branch fired, the
`light`/`dark` chain below was evaluated again. **It was harmless in practice:** that
chain compared the function *parameter* `mode`, still `'system'`, so nothing matched
and nothing double-fired. The four branches were correct, just written as if
`setMode` were synchronous.

**Fix applied:** one expression over the resolved scheme —

```js
const toggleMode = () => setMode(colorScheme === 'dark' ? 'light' : 'dark');
```

`colorScheme` is already what `system` resolves to (`useColorScheme` derives it from
`systemMode` when `mode === 'system'`), and it is never `undefined` when `mode` is
truthy, which the existing `if (!mode) return null` guard guarantees before the button
can be clicked. It is the same source of truth the icon already used.

**Verified by clicking the real button** on the running app over the DevTools Protocol,
starting from a cleared `mui-mode` (i.e. `system`) under each OS preference:

| start | initial | 1st click | 2nd click |
|---|---|---|---|
| system + OS light | `html.light`, moon icon | `html.dark`, stored `dark` | `html.light`, stored `light` |
| system + OS dark | `html.dark`, sun icon | `html.light`, stored `light` | `html.dark`, stored `dark` |

The same test against the **original** four-branch code produced identical output,
confirming this is a pure simplification.

*Blast radius:* none — the toggle button only, and its behavior is unchanged.

---

## Tier 1 — Named token block

The core change: one place to edit colors.

### 7. Introduce a `tokens` object at the top of `utils/theme.js`

- [x] **DONE.** **File:** `utils/theme.js:5-23`

The dark scheme redefined colors by **copy-pasting hex values** — `#050505`, `#edf3fc`
and `#222222` each appeared in both the light `palette` and `colorSchemes.dark.palette`
(5, 6 and 5 times respectively), and `primary` was spelled out twice in full.

**Fix applied.** One named block at the top that both schemes read from, plus a single
shared `primary`:

```js
const tokens = {
  brand: lightBlue,   // primary shades + the light scheme's paper
  ink: '#222222',     // dark text
  chalk: '#f7f7f7',   // light text
  canvas: '#edf3fc',  // light page background; the dark scheme's "opposite"
  void: '#050505',    // dark page background; the light scheme's "opposite"
  comment: '#eaf8fe', // comment surface in the light scheme
};
```

The palette now contains **zero hex literals** — every raw color goes through `tokens`,
so changing one line changes both schemes. All palette keys and the two-scheme structure
are untouched, so no call sites change.

**Two deliberate departures from the sketch above:**

1. `paper` was renamed `canvas`. MUI already has `background.paper`, and in the light
   scheme that key is `lightBlue[50]` (`#e1f5fe`), *not* `#edf3fc` — a token literally
   named `paper` that isn't what `background.paper` resolves to would be a trap.
   `canvas` is the light **page** background, which is what `#edf3fc` is.
2. `chalk: '#f7f7f7'` was added. It appears once here (light `text.light`) so it wasn't
   a duplication problem, but leaving it as the only inline hex would undercut the
   "one place to change a color" rule. It's also the value item 26 wants five
   components to stop hardcoding, so it now has a name to point them at.

Not lifted, on purpose: `grey[300]`/`grey[800]`, `blue[300]`, `orange`, `green` were MUI
color-object references, not literals, and every one of them backed a key that item 8
marked as dead (`background.grey`, `containedButton`, `secondary`). Item 8 has since
deleted them all.

**Verified as a pure refactor by diffing the served output before and after:**

| | before | after |
|---|---|---|
| `--mui-palette-*` variables (`:root,.light` + `.dark`) | 430 | 430, **byte-identical** |
| emitted CSS rules (all `<style>` tags, boundary-independent) | 197 | 197, **0 added / 0 removed** |
| hex literals in emitted CSS | 182 | 182, identical multiset |
| hex literals in `theme.js` outside `tokens` | 18 | **0** |

The served bundle was confirmed to contain the new `tokens` module at the time of the
diff, so the comparison was against the refactored code, not a cached compile.

*Blast radius:* none — nothing the browser receives changed.

### 8. Prune or wire up the dead palette keys

- [x] **DONE.** **File:** `utils/theme.js`

Verified zero references across `app/` and `utils/`, and **deleted** from both schemes:

| Key | Was defined at | Uses |
|---|---|---|
| `palette.containedButton` | `:54-57` | 0 |
| `background.solid` | `:62`, `:38` (dark) | 0 |
| `background.grey` | `:63`, `:39` (dark) | 0 |
| `text.solid` | `:70`, `:44` (dark) | 0 |
| `text.dark` | `:67`, `:43` (dark) | 0 |

The `ink` token (`#222222`) and the `blue`/`grey` color imports only fed those keys, so
they went too. `containedButton` was *not* adopted for item 26: its values (`blue[300]`
on `#222222`) didn't match the Buy-Me-a-Coffee style anyway, so item 26 should add a
purpose-named key if it wants one rather than resurrect this.

`palette.secondary` turned out **not** to be unreferenced — the original claim missed
`DAY_COLORS.tue = 'secondary'` (`coverBidJobs/dayFormat.js`, duplicated in
`bids/BidsJobCard.jsx` and `bids/BidsTable.jsx`), which colors every Tuesday `Chip`. That
made the scheme divergence a visible defect: Tuesday was orange in light mode (same family
as Sun/Sat's `warning`) and green in dark mode (same as Wed's `success`). Both overrides
were removed so `secondary` is MUI's default purple in both schemes — distinct from every
other day color. Visible change: Tuesday chips are now purple. The `Calendar.jsx` comment
that justified `warning.main` for the today-ring by "secondary is green in dark mode" was
reworded to match.

Still load-bearing, unchanged: `background.opposite` / `text.opposite` (one consumer
each, `ModeSwitch.jsx`), `background.comment` (`Comment.jsx`, `CommentEditor.jsx`),
`text.light` (footer + `UserMenu.jsx`).

### 9. Correct the palette claim in `CLAUDE.md`

- [x] **DONE.** **File:** `CLAUDE.md`

It stated that `background.solid`, `text.dark` and `text.solid` were "used throughout" and
should be reused instead of hardcoding hex. Per item 8 they had **zero** uses and are now
deleted. The sentence now lists the four keys that actually exist (`background.opposite`,
`text.opposite`, `background.comment`, `text.light`), says what each is for, and points at
the `tokens` object for raw values. The "Known issues" paragraph that referenced this item
was replaced with the single-source-of-truth note from item 10.

### 10. Delete the shadow palette

- [x] **DONE.** **Files:** `app/globals.css:5-15`, `tailwind.config.mjs:10-13`

`globals.css` defined a full second palette — `--foreground`, `--background`, `--primary`,
`--secondary`, `--accent`, `--error`, `--warning`, `--info`, `--success` — that was
**referenced nowhere** and whose values *conflicted* with the real theme (`--primary:
#0070f3` vs the actual `lightBlue[600]` = `#039be5`). The Tailwind
`colors: { background, foreground }` extension that mapped to them was equally unused:
`bg-background`, `text-foreground`, `bg-foreground` and `text-background` appeared nowhere,
and neither did any `var(--primary)`-style reference (checked `app/` and `utils/` across
`.jsx`/`.js`/`.css`, including Tailwind arbitrary values).

**Removed:** the `:root` block and the `theme.extend.colors` mapping. **Tailwind stays** —
only the color mapping went, and a comment in the config says where colors do live.

Also removed the `./pages` and `./components` content globs — neither directory exists at
the repo root, so they were dead. `./app/**` is the only one that matched anything.

*Blast radius:* none — `npm run build` passes and the served CSS lost only the unused
custom properties.

### 11. Fold layout constants into the theme

- [x] **DONE.** **Files:** `utils/variables.js`, `utils/theme.js`, 19 consumers

`variables.js` mixed UI tokens with domain constants. `ELEVATION`, `MAX_WIDTH`,
`MIN_HEIGHT` and `BORDER_RADIUS` are gone from it; `SLICS_PER_PAGE` and
`COVER_BID_MONTHS_BACK` stay.

**Where they went:**

| Was | Now | Notes |
|---|---|---|
| `MAX_WIDTH = '32rem'` | `theme.layout.maxWidth` → since item 19, `theme.layout.width.panel` | |
| `MIN_HEIGHT = '24rem'` | `theme.layout.minHeight` | |
| `ELEVATION = 6` | `theme.layout.elevation` | |
| `BORDER_RADIUS = '6px'` (dead) | `theme.shape.borderRadius = 8` | see below |

**How consumers read them:** `import theme from '@/utils/theme'` and
`theme.layout.maxWidth` — the idiom `Comment.jsx` / `TablePaginationActions.jsx` already
used. This required dropping the `'use client'` directive from `utils/theme.js`: with it,
the nine consumers that are server components (`history/page.jsx`, `home/EmptySlic.jsx`,
`signIn/Membership.jsx`, …) would receive a client *reference* whose `.layout` is
unreadable on the server. The directive was never load-bearing — `Providers.jsx` is
already the client boundary, and `createTheme` is pure — so nothing else changes. Both
server and client components now import the same plain object.

MUI also emits every key as a CSS variable (`--mui-layout-width-panel: 32rem`,
`--mui-layout-minHeight: 24rem`, `--mui-shape-borderRadius: 8px`) so `globals.css` can
use them. Ignore `--mui-layout-elevation: 6px` — MUI suffixes numbers with `px`; it's a
prop value, not CSS.

**Radius decision:** `BORDER_RADIUS` had zero imports and three uncoordinated values were
in play (`'6px'` dead, `'8px'` ×2 on comment `Paper`s, `1.5rem` buttons). `shape.borderRadius`
is now **8** — the value the two live sites had chosen — and those two literal overrides
were deleted since `Paper` reads `shape.borderRadius` itself. Buttons keep their own pill
radius. **This is a visible, app-wide change:** every `Paper`, `Card`, `TextField`,
`Dialog`, `Menu` and `Alert` corner goes from MUI's default 4px to 8px. If that's not
wanted, it's now one number in `theme.js`.

Also: `admin/users/[id]/page.jsx` imported `MAX_WIDTH` without using it — that dead import
is gone rather than rewritten. The pre-existing dead `theme` imports in `Comment.jsx`,
`CommentEditor.jsx` and `TablePaginationActions.jsx` are item 23's and were left alone.

**Verified:** `npm run build` passes; the served `/signin` HTML carries the three
`--mui-layout-*` vars, `--mui-shape-borderRadius:8px`, and `max-width:32rem` on the
content column.

*Blast radius:* the radius change above. Everything else is value-preserving.

---

## Tier 2 — Component defaults

Each is a few lines in `theme.components`.

> **Applies to all of Tier 2:** an explicit prop at a call site still beats a theme
> default. These reduce *future* repetition, but produce no immediate visual change until
> the call sites are also cleaned up. Do each alongside its call-site pass, or expect
> nothing to look different.

### 12. `MuiPaper.defaultProps.elevation = 6`

- [x] **EVALUATED — not applied.** Superseded by item 17.

The 9 `elevation={theme.layout.elevation}` sites (`comments/CommentsContainer.jsx`,
`comments/NoSlicComments.jsx`, `home/EmptySlic.jsx`, `home/MemberDisplay.jsx`,
`home/SlicDetailsContainer.jsx`, `profile/ProfileComments.jsx`, `profile/ProfileImage.jsx`,
`admin/user-page/UserComments.jsx`, `app/history/page.jsx`) are the minority. A `Paper`
default reaches every Paper-derived component with no explicit prop, and **13 sites rely
on the implicit 1**: `admin/slics/SlicsTable.jsx`, `admin/comments/CommentsSection.jsx`,
`slicForm/FormContainer.jsx`, `profile/ProfileData.jsx`, `comments/Comment.jsx:17`, four
`TableContainer component={Paper}` (`admin/coverBidJobs/BidSheetUploader.jsx`,
`admin/coverBidJobs/CoverBidJobsEditTable.jsx`, `covers/DriversTable.jsx`,
`drivers/DriversTable.jsx`), three `Accordion`s (`admin/users/UserCard.jsx`,
`covers/Calendar.jsx`, plus `admin/comments/Comment.jsx`'s `Card`), and every
`Autocomplete` dropdown. Pinning `elevation={1}` on all of those to keep the app looking
the same would add more props than the default removes.

The 9 sites already share one value via `theme.layout.elevation` (item 11); the right
absorber for them is the `panel` variant in item 17, which can carry the shadow together
with the width/height they also share. The 7 literal sites (`elevation={3}` on
`about/AboutContainer.jsx` and `slicPage/CommentsPage.jsx:17`; `{0}` on nested
`Accordion`s/`Paper`s; `{1}` on `comments/Comment.jsx`) are deliberate nesting choices —
left as is.

### 13. `MuiTextField.defaultProps = { size: 'small', fullWidth: true }`

- [x] **EVALUATED — not applied.** The premise was off.

The "59× `size='small'`" count included `Button`, `IconButton` and `Select`. Of the **41
`TextField`s** in `app/`, only 12 pass both props. **18 have no `size`** at all — among them
the home page's `home/SlicsSearch.jsx`, every `slicForm/*Field.jsx`, `profile/EditProfileDialog.jsx`,
`comments/CommentsContainer.jsx`, `covers/CoverPosition.jsx`,
`drivers/newDriver/NewDriverField.jsx` — and would shrink to small. **~20 have no
`fullWidth`**, including inline filter rows (`bids/BidsFilters.jsx`,
`coverBidJobs/CoverBidJobsTable.jsx`) and the five `variant='standard'` cells in
`admin/coverBidJobs/CoverBidJobRowCells.jsx`, which would stretch. Keeping the current
look would mean pinning ~38 props to delete 24. Net negative, so the default stays MUI's.

If the app *should* move to all-small, all-full-width inputs, that's a design decision to
make on purpose — set the default and walk the 18 + 20 sites above — not a cleanup.

### 14. `MuiChip.defaultProps.size = 'small'`

- [x] **DONE.** Default set in `utils/theme.js`; `size='small'` removed from the 7 sites
  that had it (the 5 day-of-week chips plus `bids/BidsJobCard.jsx:65` and
  `admin/users/UserCard.jsx:124`). The one chip that had no size — the comment count on
  `home/TitleAddress.jsx` — is pinned `size='medium'` so the home page doesn't change.

  The shared `DayChip` idea was **not** done: the five day chips don't actually share
  their `sx` (`fontWeight: 700, minWidth: 48` ×2, `fontWeight: 600, fontSize: '0.7rem'`
  ×2, none ×1), so a component would just be a prop bag. `DAY_COLORS` is still duplicated
  in `bids/BidsJobCard.jsx` and `bids/BidsTable.jsx` — collapsing those onto
  `coverBidJobs/dayFormat.js` is a separate, non-styling cleanup.

### 15. `MuiCard.defaultProps.variant = 'outlined'`

- [x] **DONE.** Default set; `variant='outlined'` removed from
  `admin/coverBidJobs/CoverBidJobEditCard.jsx`, `bids/BidsJobCard.jsx`,
  `coverBidJobs/CoverBidJobCard.jsx`. **Visible change:** the fourth `Card`,
  `admin/comments/Comment.jsx`, was implicitly elevated and is now outlined like the rest.

### 16. `MuiSnackbar.defaultProps` for `autoHideDuration` + `anchorOrigin`

- [x] **DONE.** Default `autoHideDuration: 6000`, `anchorOrigin: top/center`. Both props
  removed from the four identical sites (`admin/slics/SlicOptions.jsx`,
  `home/TitleAddress.jsx`, `slicForm/FormActions.jsx`, `profile/ProfileData.jsx`); the
  redundant `anchorOrigin` also removed from `drivers/editDriver/EditDriverField.jsx` and
  `profile/CommentDelete.jsx`, which keep their explicit 3000/4000 ms — no reason to
  believe those aren't deliberate, and changing a toast's timing isn't a cleanup.

  One site needed pinning: `slicForm/Warning.jsx` had **no** `autoHideDuration`, i.e. it
  stayed up until dismissed (it even suppresses click-away). It now passes
  `autoHideDuration={null}` explicitly so the theme default can't start auto-closing it.

---

## Tier 3 — Absorb repeated blocks

### 17. A `panel` variant for `Paper`

- [x] **Highest-value item in this tier.** This block was near-verbatim in 5 files:

```js
width: '100%', maxWidth: MAX_WIDTH, minHeight: MIN_HEIGHT,
display: 'flex', flexDirection: 'column', alignItems: 'center',
mt: '2rem', py: '2rem', px: '1rem'
```

`comments/CommentsContainer.jsx`, `comments/NoSlicComments.jsx`, `home/EmptySlic.jsx`,
`home/MemberDisplay.jsx`, `home/SlicDetailsContainer.jsx`. (`profile/ProfileComments.jsx`
was originally listed too, but it had drifted into a comment *card* — `mt: 2, p: 2`, no
min-height/flex — and is the twin of `admin/user-page/UserComments.jsx`; that pair is
item 28, not this one.)

**Done:** `MuiPaper.variants` in `utils/theme.js` defines `variant="panel"` with only the
structural block; the five sites are now `<Paper variant='panel' sx={{ …delta }}>`.
Reconciled deliberately: padding defaults to `2rem` all round (the majority), the two
comments panels override `px: 2` so comment cards get the width; `justifyContent:
'center'` is content alignment, so the three text-centered panels set it themselves.
**Gotcha worth remembering:** `Paper` only applies its shadow and elevation overlay for
`variant="elevation"` (see `Paper.js`), so a custom variant must set `boxShadow` and
`backgroundImage` itself — the variant reads `theme.vars.shadows[6]` / `theme.vars.overlays[6]`,
the same vars MUI's own path uses, so it renders identically in both schemes.

*Blast radius:* five of the app's most visible surfaces. Check each in both schemes.

### 18. A `sectionHeading` typography variant

- [x] Replaced `app/components/layout/StyledHeading.jsx` (18 sites). Heading style is now
  a theme edit: `MuiTypography.variants` in `utils/theme.js` defines `sectionHeading` as
  `{ ...theme.typography.h2, fontWeight: 800, uppercase, centered, maxWidth, px }` inside
  a `({ theme })` callback, so it stays in lockstep with h2 — including the breakpoint
  sizes `responsiveFontSizes()` adds, which a static custom `typography.*` entry would
  have missed. `variantMapping` keeps the `<h2>` element. (`fontWeight` is a number now.)

  Reconciled while doing it: the two admin sub-page titles that used `heading='h3'`
  (`/admin/new`, `/admin/edit`) now use `sectionHeading` like every other admin title;
  and the landing page's app name is a plain `variant='h1'` like `/home`'s — the wrapper
  had been uppercasing it to "SLICS", against the brand casing.

### 19. Name the width scale

- [x] `MAX_WIDTH` (`'32rem'`, 16 importers) was one of about ten unnamed widths:
  `'30rem'` ×10 (form fields), `'40rem'` ×5 (prose), `'55rem'` ×4 (wide pages), plus
  `'52rem'`, `'50rem'`, `'45rem'`, `'22rem'`, `'12rem'`, `'600px'` ×2, `'1436px'`.

  **Done:** `theme.layout.width` is a five-step scale — `field` 30rem · `panel` 32rem (the
  old `layout.maxWidth`, renamed) · `prose` 40rem · `wide` 55rem · `page` 1436px — and
  every page-level `maxWidth` in the app (27 sites, 24 files) reads one of them. The
  hard-coded `'32rem'` in `admin/comments/CommentsSection.jsx` now reads `panel`.

  Snapped to the nearest step rather than given a sixth name (all desktop-only —
  on phones these are `width: 100%`): `FormContainer` 52→55 (`wide`), `SlicsTable`
  50→55 (`wide`), `NotMember` 45→55 (`wide`), `EmailAuth` 22→30 (`field`; the sign-in
  inputs are 8rem wider on desktop), `slicPage/CommentsPage` 600px→40rem (`prose`).
  Left alone: `global-error.jsx` (plain `style`, MUI-free by design) and the `'12rem'`
  in the dead `home/AllHubsButton.jsx` (STRUCTURE.md deletes it). Table-cell and icon
  widths (`width: '2rem'`, `minWidth: '7rem'`…) are component-local sizing, not this
  scale.

### 20. Pick one spacing dialect

- [x] **Spacing half done.** `theme.spacing` is MUI's default 8px and the root font size
  is the browser default 16px, so `mt: '1rem'` and `mt: 2` were the same pixel value
  written two ways. Every spacing prop in an `sx` object (`m*`, `p*`, `gap*`, the
  longhands, and responsive objects like `px: { xs: '1rem', sm: '2rem' }`) now uses the
  number dialect — 188 values across 69 files, `'1rem'` → `2`, `'2rem'` → `4`, etc. A
  scripted, zero-visual-change transform; the only non-grid values kept their exact
  fraction (`py: 0.8`, `mt: 0.6`). `app/global-error.jsx` keeps its rem strings on
  purpose — it uses plain `style`, where a number would mean px.

  **Rule going forward:** spacing props in `sx` take numbers, never rem strings. Widths,
  heights, offsets (`top`/`left`…) and `fontSize` still use rem strings — a bare number
  there is *pixels*, not spacing, so they're not part of this dialect (see 19 for widths).

- [ ] Still open from this item: ~20 `fontSize` overrides in `sx` that bypass the
  typography scale entirely.

### 21. Move `zIndex` literals into the theme

- [ ] Unmanaged and uncoordinated: `10` (`bids/BidsFilters.jsx:51`,
  `coverBidJobs/CoverBidJobsTable.jsx:140`), `1000` (`footer/FooterContainer.jsx:10`),
  `2000` (`layout/ModeSwitch.jsx:31`). MUI's own `theme.zIndex` scale tops out at 1500 for
  tooltips, so `ModeSwitch` currently floats above MUI modals — probably unintended.
  #34 moves `ModeSwitch` into the header, which removes that layer entirely and leaves
  only the `10` and `1000` values for this item.

---

## Tier 4 — Dead code and duplication

### 22. Delete two dead layout files

- [ ] `app/components/layout/StyledPage.jsx` and `app/components/layout/Wrapper.jsx` —
  verified: **never imported anywhere**. `Wrapper.jsx` additionally computes a `margin`
  state it never applies to its `sx`, inside a `useEffect` with no dependency array.

*Blast radius:* none.

### 23. Remove three dead theme imports

- [ ] `drivers/TablePaginationActions.jsx:1`, `comments/CommentEditor.jsx:8`,
  `comments/Comment.jsx:6` import `theme from '@/utils/theme'` and never reference it.

  Worth removing so the pattern isn't copied: with `cssVariables` enabled, a **static**
  theme import bypasses color-scheme resolution and would lock a component to light-mode
  values. Use `useTheme()` instead. (`Providers.jsx:3` uses it legitimately — leave it.
  `Wrapper.jsx:3` disappears with item 22.)

### 24. Consolidate the page shells

- [ ] `layout/Container.jsx` and `layout/PageContainer.jsx` (plus the two dead files in
  item 22) each redeclare the same `minHeight: '100dvh'` + centered flex column +
  `bgcolor: 'background.default'` recipe with different hardcoded padding.
  `Depends on:` item 22.

### 25. Off-brand icon color

- [ ] `fill: '#1976d2'` in `about/Community.jsx:18`, `about/Contributions.jsx:20`,
  `about/Future.jsx:19`. That hex is MUI's **default** primary — the app's actual primary
  is `lightBlue[600]` (`#039be5`), so these icons are visibly off-brand today. Replace
  with the palette token.

### 26. Five copies of the Buy-Me-a-Coffee button style

- [ ] `backgroundColor: '#f7f7f7', color: 'black'` repeated verbatim at
  `about/Contributions.jsx:35`, `signIn/Membership.jsx:76`, `profile/ProfileData.jsx:95`,
  `coverBidJobs/NotMember.jsx:25`, `layout/BuyMeACoffeeButton.jsx:30`.

  `#f7f7f7` is exactly `palette.text.light`. `about/AboutLink.jsx:30` already accepts the
  color as a prop, so this is half-done already. If this wants a palette home, add a
  purpose-named key (e.g. `palette.bmc`) — the old `containedButton` key was deleted in
  item 8 and its values didn't match this style anyway.

  Note these use literal `'black'`; the theme's former `#222222` dark-text keys
  (`text.dark`/`text.solid`) were deleted as unused in item 8, so pick one value here.

### 27. Duplicated `bounce` keyframe

- [ ] Byte-identical in `layout/BuyMeACoffeeButton.jsx:15-20` and
  `about/AboutLink.jsx:15-20`.

### 28. Near-duplicate card components

- [ ] `bids/BidsJobCard.jsx` and `coverBidJobs/CoverBidJobCard.jsx` are near-identical,
  including a byte-identical "Show route" Accordion block and the same
  `pb: '8px !important'` hack. Their DataGrid `sx` is likewise duplicated between
  `bids/BidsTable.jsx:200` and `coverBidJobs/CoverBidJobsTable.jsx:235`.

### 29. `useIsMobile` disagrees with the theme's breakpoints

- [ ] `utils/clientFunctions.js:23` hardcodes 768px. The theme defines `sm: 600` and
  `md: 960`. So `useIsMobile()` and `useMediaQuery(theme.breakpoints.down('md'))` disagree
  about what "mobile" means depending on which component you're in.

  Rebase the hook on `theme.breakpoints`, or delete it in favor of `useMediaQuery`.
  `coverBidJobs/CoverBidJobsTable.jsx` and `admin/coverBidJobs/CoverBidJobsManager.jsx`
  already use the `useMediaQuery` form.

### 30. Unused / contradicted constant imports

- [ ] `admin/users/[id]/page.jsx:15` imports `MAX_WIDTH` and never uses it.
  `comments/CommentEditor.jsx:7` and `comments/Comment.jsx:10` import `ELEVATION`, then
  hardcode `elevation={0}` and `elevation={1}` instead.

---

## Part 1 verification

**Re-run before acting on items 22 and 23** — all should return nothing (the item 8 and
10 greps are kept as regression checks now that those keys are gone):

```bash
grep -rn "containedButton\|background\.solid\|background\.grey\|text\.solid\|text\.dark" app/ utils/
grep -rn "StyledPage\|layout/Wrapper" app/ --include=*.jsx | grep -i import
grep -rn "bg-background\|text-foreground\|bg-foreground\|text-background" app/
# item 20: spacing props in sx never use rem strings (global-error.jsx is plain `style` and exempt)
grep -rnE "\b(m[trblxy]?|p[trblxy]?|gap|rowGap|columnGap|margin[A-Za-z]*|padding[A-Za-z]*):\s*'-?[0-9.]+rem'" app/ | grep -v global-error
# item 17: the panel block lives in the theme, not at call sites
grep -rn "layout\.minHeight" app/
```

**Confirm the font bug (item 1) before fixing it**, since it justifies the whole tier:

1. `npm run dev`, open devtools, inspect `<body>` → `--font-font` is **not** among the
   computed custom properties.
2. Change `typography.fontFamily` in `utils/theme.js` to something unmistakable like
   `'Comic Sans MS'` → **nothing changes on screen**. That's the bug.
3. Revert, apply the fix, repeat step 2 → the font now changes.

**For every item:** `npm run build`, then walk the affected screens in **both** light and
dark mode using the toggle at bottom-right. Items 3, 12–16 and 17 are the ones most likely
to shift appearance in ways a build won't catch.

---

# Part 2 — UI review and modernization

## How this review was done

- **Screens covered:** sign-in/landing, `/home` (search, SLIC details, action buttons,
  comments, comment prompt), the menu, history, profile, about/legal, the error and 404
  pages, and the shared shell (header, footer, page containers, theme, `globals.css`).
- **Measured, not eyeballed:** the public pages were loaded in Chrome through the DevTools
  Protocol at a real **390×844** phone viewport (iPhone 14 class), in light and dark.
  Font sizes, offsets and page heights below come from `getComputedStyle` and
  `getBoundingClientRect`.
  *Gotcha:* plain `chrome --headless --window-size=390,…` lays the page out at a 500px
  minimum and then crops the screenshot. That shows fake right-edge clipping. Use
  `Emulation.setDeviceMetricsOverride` instead.
- **Signed-in screens** (`/home`, comments, history) are behind auth, so findings there come
  from reading the code. Check them on a real phone before and after.
- **Contrast ratios** use the WCAG 2.x relative-luminance formula.
- **Platform patterns** come from the `modern-web-guidance` guides
  (`same-document-transitions`, `animate-element-entry-exit`,
  `animate-to-from-top-layer`, `physics-based-easing`, `shrinking-header-on-scroll`,
  `dark-mode`, `accessibility`). Browser-support dates are quoted from them.

**Design target.** The user is a driver on a phone, often one-handed in a cab, sometimes in
sunlight or wearing gloves. That means:

- the answer (address + navigate) is visible without scrolling;
- touch targets are at least 48px;
- text meets AA contrast;
- motion explains a change and never delays it.

Stay on MUI. Everything below fits inside the existing theme; none of it needs a second UI kit.

**Motion rule for every item in Tier D:** progressive enhancement only, so browsers without
the feature keep today's instant behavior. Every animation also needs a
`prefers-reduced-motion: reduce` path (#47 adds a global one).

## Suggested order

| Order | Items | Why |
|---|---|---|
| 1 | #32, #33 | Accessibility defects, mostly one-line fixes |
| 2 | #31, #35 | Color decisions with app-wide reach; each is its own reviewed change |
| 3 | #34, #36–#39 | Phone layout: gutters, dead space, heading sizes, the floating toggle |
| 4 | #53 | Internal links reload the whole page. One theme line, and every later nav change benefits |
| 5 | #40–#46 | The lookup screen and its neighbors, which drivers use daily |
| 6 | #47–#52 | Motion and navigation polish |
| 7 | #54–#57 | Optional features |

---

## Tier A — Accessibility and correctness

### 31. The brand blue fails text contrast

- [ ] **Files:** `utils/theme.js` (`primary`), `app/layout.jsx` (`themeColor`),
  `app/manifest.js` (`theme_color`)

Measured:

| Pair | Ratio | AA needs |
|---|---|---|
| white button label on `primary.main` `#039be5` | **3.08** | 4.5 |
| footer `text.light` `#f7f7f7` on `#039be5` | **2.87** | 4.5 |
| `#039be5` text / outlined buttons on the light canvas `#edf3fc` | **2.76** | 4.5 (3 for borders) |
| `#039be5` on the light paper `#e1f5fe` (menu buttons) | **2.74** | 4.5 |
| `#039be5` on the dark canvas `#050505` | 6.62 | ✔ |

MUI picks white for the button label because its default `contrastThreshold` is 3, and
white scores 3.08. So in light mode all 44 contained buttons, the footer text and every
text or outlined primary button (menu items, Home/Back, the RedirectMessage link) fall
below AA.

**Recommended fix:** `primary` is shared by both schemes today. Split it, giving the light
scheme a darker shade:

| Shade | white text on it | it on the canvas |
|---|---|---|
| `lightBlue[700]` `#0288d1` | 3.86 | 3.46 |
| `lightBlue[800]` `#0277bd` | **4.80** | 4.30 |
| `lightBlue[900]` `#01579b` | 7.40 | 6.63 |

Light scheme: `main: brand[800], dark: brand[900]`. Button labels pass. Primary-colored
text sits at 4.30, just under 4.5. For strict AA on small text links, use `primary.dark`
there.

Dark scheme: keep `brand[600]` for text on black (6.62). Contained buttons there still get
white labels at 3.08, so set the dark scheme's `primary.contrastText` to
`'rgba(0, 0, 0, 0.87)'`.

**Alternative (one line, different look):** `palette.contrastThreshold: 4.5`. MUI then picks
black labels on `#039be5` (6.82:1) in both schemes. This keeps today's bright blue and
fixes the labels, but buttons become dark text on blue, and blue *text* on the light canvas
still fails.

After either fix, update `themeColor`, `manifest.theme_color` and the comment in
`manifest.js` that says they match `primary.main`.

*Blast radius:* an app-wide color shift, the most visible change in this list. Ship it on
its own and look at both schemes.

### 32. "oogle": the Google icon is used as a letter

- [ ] **Files:** `home/MapPhoneLinks.jsx:23-24`, `signIn/SignIn.jsx:31-32`

The buttons are written `<Google />oogle Maps` and `&nbsp;<Google />oogle`. The SVG has no
text alternative. Screen readers announce **"oogle Maps"** and **"oogle"**, and voice
control ("tap Google Maps") can't find the button.

Use `startIcon={<Google />}` with real text: "Google Maps" and "Continue with Google". That
matches what the Apple Maps and dispatch buttons almost do already.

### 33. Controls that aren't real controls, or do nothing

- [ ] One-line fixes:

| Where | Problem | Fix |
|---|---|---|
| `signIn/EmailAuth.jsx:164, 255` | "Create one" / "Sign in" are `<span onClick>`: not focusable, no role, so keyboard and switch users can't change modes | `<Link component='button' type='button' onClick={…}>` |
| `layout/HomeButton.jsx` | icon-only button with no accessible name | `aria-label='Home'` (placement: #37) |
| `footer/Footer.jsx:99` | the `WebDevilishSmile@gmail.com` button has no `href`, so tapping it does nothing | `href='mailto:…'` |
| `footer/Footer.jsx:72` | logo `alt='Description'` | `alt=''`: decorative, since the header already carries the brand |
| `home/MapPhoneLinks.jsx:41` | the `tel:` link has `target='_blank'`, which opens an empty tab in desktop browsers | drop `target` |
| `home/MapPhoneLinks.jsx:29` | Apple Maps link is `http://` | `https://maps.apple.com/…` |
| `home/MapPhoneLinks.jsx:20` vs `TitleAddress.jsx:28` | the map query leaves out the state; the copied address includes it | add `slic.address.state` and `encodeURIComponent` the query |
| `app/globals.css:76` | editor placeholder `#adb5bd` on the light comment surface is **1.91:1** | `color: var(--mui-palette-text-secondary)` |
| `comments/CommentFooter.jsx:77-108` | the delete confirm is a bare `Dialog` + `Box` with no `DialogTitle`, so the dialog has no accessible name | rebuild it on `DialogTitle`/`DialogContent`/`DialogActions` like `profile/DeleteAccountDialog.jsx`, or see #45 |

### 34. The floating theme toggle covers content

- [x] **File:** `layout/ModeSwitch.jsx`. This takes over the `ModeSwitch` half of #21.

*Done 2026-10-07:* `ModeSwitch` is now the "Dark mode" switch row in the menu (#50). The row
is a `<label>`, so tapping anywhere on it flips the switch. The fixed toggle and its
`zIndex: 2000` layer are gone from `app/layout.jsx`.

The toggle is `position: fixed`, bottom-right, at 40% opacity with `zIndex: 2000`. At
390px it sits on top of paragraph text on long pages (seen on `/privacy`). 2000 is above
MUI's modal (1300) and tooltip (1500) layers, so it also floats over open dialogs,
including the comment prompt. At 40% opacity the icon fails the 3:1 non-text contrast
minimum too.

**Fix:** move it into the header toolbar, as an `IconButton` with `color: 'text.light'`
like the menu button, or make it a "Dark mode" switch row in the menu (#50). Either way the
fixed layer disappears.

### 35. Dark mode: the header isn't blue, so the status bar doesn't match

- [ ] **Files:** `app/layout.jsx:29-33`, `utils/theme.js`

`layout.jsx` says *"The header AppBar is primary.main in both color schemes"*. That isn't
what renders. MUI's `AppBar` defaults to `enableColorOnDark: false`, so in dark mode the
header (and the footer, also an `AppBar`) draw as dark paper. The installed app still paints
the status bar `#039be5`, so dark-mode drivers get a bright blue strip above a dark grey
header.

Pick one:

- **Blue in both schemes:** `MuiAppBar: { defaultProps: { enableColorOnDark: true } }`. The
  comment becomes true, and the footer turns blue in dark mode too.
- **Dark header in dark mode:** keep the look and make the status bar follow it with
  `themeColor: [{ media: '(prefers-color-scheme: light)', color: … }, { media: '(prefers-color-scheme: dark)', color: … }]`.
  That follows the OS setting, not a mode pinned with the toggle. To cover the pinned
  case, also update the `<meta name="theme-color">` from `ModeSwitch`.

---

## Tier B — Phone layout

### 36. A 4px side gutter on phones

- [ ] **File:** `layout/PageContainer.jsx:16`

`px: { xs: 0.5, … }` is 4px. On the sign-in page at 390px, the email and password fields
and the Sign In button run edge to edge. Use `xs: 2` (16px), the standard phone gutter.

### 37. Dead space: 128px margins, a doubled `minHeight`, a 544px footer

- [ ] **Files:** `layout/PageContainer.jsx:10-14`, `layout/Container.jsx`,
  `footer/FooterContainer.jsx:11`, `footer/Footer.jsx`, `layout/HomeButton.jsx`,
  `layout/BackButton.jsx`

Measured on the landing page at 390×844: the heading starts at y=128 and the sign-in form
ends near y=600. Then come ~500px of empty canvas and a **544px footer (34rem, 64% of the
screen)**. The page is 1644px tall for one form. Three causes:

- `my: 16` is 128px top **and** bottom, there to clear the fixed `AppBar`, which is 56px on
  phones.
- `PageContainer` has `minHeight: '100dvh'` and sits inside `Container`, which already has
  it. Every page is at least one screen tall *before* the margins and footer are added.
- The footer has `height: { xs: '34rem' }`, 3rem social icons, a 100px second logo and a
  stacked email button.

**Fix:**

- `PageContainer`: top padding of the toolbar height (`theme.mixins.toolbar`, or a
  `<Toolbar />` spacer) plus `3`, `pb: 6`, and no `minHeight`.
- Push the footer to the bottom with `mt: 'auto'` inside `Container`'s flex column.
- Footer: auto height, with one row of 2rem social icons, a links row and the copyright.
  Drop the second logo. #24 (consolidate the page shells) lands naturally here.

The Home/Back buttons are `position: absolute; top: 4.8rem`. They float over whatever is
underneath, and their position depends on the header height. Put them in the page flow (a
row above the title), or replace both with a back arrow in the header (#52).

### 38. Headings are oversized on phones

- [ ] **File:** `utils/theme.js:84-110`, `layout/Container.jsx:17`

At 390px, `h1` is 48px and `sectionHeading` is 41.6px, uppercase, weight 800.
"PRIVACY POLICY" wraps onto two lines, and the first panel starts ~200px down the screen.
All-caps at that size also reads as shouting (the accessibility guide: don't rely on
all-caps).

`responsiveFontSizes` (factor 2) shrinks a size *s* rem to `1 + (s − 1) / 2` rem at the
smallest breakpoint, which matches both measurements above. Suggested desktop sizes and
what phones get:

| | now: desktop → phone | suggested: desktop → phone |
|---|---|---|
| `h1` | 5rem → 48px | 3.5rem → 36px |
| `h2` / `sectionHeading` | 4.2rem → 41.6px, uppercase 800 | 2.5rem → 28px, title case, 700 |
| `h3` / `h4` / `h5` / `h6` | 3.2 / 2.8 / 2.2 / 1.8rem | 2 / 1.6 / 1.35 / 1.15rem |

Also, `layout/Container.jsx:17` sets `fontSize: '1.6rem'` (25.6px) on the app root. It only
reaches bare text outside `Typography`, so it is either dead or a surprise; remove it. This
pairs with the still-open half of #20 (`fontSize` overrides).

*Blast radius:* every heading. Do it in one pass, with screenshots before and after.

### 39. Load fewer font weights

- [ ] **File:** `app/layout.jsx:13-18`

Montserrat loads in 8 weights (200–900). The app renders 400, 500, 600, 700 and 800, so 200,
300 and 900 are never used. Drop those three. Better: omit `weight` entirely. Montserrat is
a variable font, so `next/font` then ships one file that covers every weight. That means
fewer bytes before the first text paints on a weak phone signal.

---

## Tier C — The lookup screen

### 40. Put the SLIC first in the details card

- [ ] **Files:** `home/SlicDetailsContainer.jsx`, `home/TitleAddress.jsx`

The largest text in the card today is the generic title "Slic Details" (h4). What the driver
actually searched for, `1809 - BETPA`, is a smaller h6 underneath it, and the address is
body text. Invert that:

```
┌──────────────────────────────────┐
│ BETPA                   [Center] │  ← alphaSlic, h4 (customer: the name)
│ SLIC 1809 · Bethlehem Center     │  ← numSlic + name, body2, text.secondary
│                                  │
│ 1620 Van Buren Road         [⧉]  │  ← address, body1, copy button
│ Easton, PA 18045                 │
│                                  │
│ 💬 4 comments                    │  ← existing chip
└──────────────────────────────────┘
```

Drop the visible "Slic Details" heading, but keep an `<h2>` in the outline (visually hidden,
or the alphaSlic line itself rendered as the `h2`) so screen-reader heading navigation
still works.

### 41. One primary action, the rest in a row

- [ ] **Files:** `home/MapPhoneLinks.jsx`, `home/PdfLink.jsx`, `home/SlicDisplay.jsx`

There are up to four full-weight contained buttons stacked vertically: Google Maps, Apple
Maps, Dispatch and View PDF. All have the same color and size, and "View PDF" shows
*disabled* when there is no PDF. A driver's next step is almost always "navigate", so make
that the one big button and the rest secondary:

```
┌──────────────────────────────────┐
│ [   ➤  Navigate        Google ▾ ]│  ← contained, full width, ~52px tall
│                                  │
│  [📞 Call]  [📄 PDF]  [💬 Tips]  │  ← outlined/tonal, icon over label, ≥48px
└──────────────────────────────────┘
```

- **Navigate** opens the driver's maps app. The ▾ switches between Google and Apple, and the
  choice is remembered on the device (localStorage, the `InstallNudge` pattern). Default to
  Google Maps; offer Apple only where `useAppleDevice()` is true, as today.
- **PDF** is hidden when there isn't one. A disabled button explains nothing.
- **Tips** scrolls to the comments, turning the comment chip into an action.
- Every target is at least 48px (Android's minimum; WCAG 2.5.8's floor is 24px).

### 42. Search that remembers

- [ ] **File:** `home/SlicsSearch.jsx`

The search is an `Autocomplete` over plain strings. Upgrades, in order of value:

1. **Recent lookups on focus.** With `openOnFocus`, show the last ~5 SLICs this device
   looked up first, under a "Recent" group header (`groupBy`). Drivers run the same routes,
   so this turns most lookups into one tap. For storage, extend `recordLookup` in
   `utils/commentPrompt.js` into a small `recentLookups` list using the same try/catch
   localStorage pattern.
2. **Richer options** via `renderOption`:
   - two lines: alphaSlic or name in bold, then `SLIC 1809 · Easton` in `text.secondary`;
   - a Center/Customer icon;
   - the matched characters in bold, via a 10-line highlighter or `autosuggest-highlight`
     (what MUI's own docs use).
3. **`autoHighlight`,** so Enter picks the top match.
4. **Move the donation `Alert`.** It renders *above* the search for every non-member with at
   least one lookup, pushing the input down on every visit. Move it below the details card,
   or give it the same 30-day snooze as `InstallNudge`.

### 43. Skeletons instead of "Loading..."

- [ ] **Files:** `app/loading.jsx`, `layout/LoadingFallback.jsx`, `home/SlicDisplay.jsx`,
  `comments/Comment.jsx`, plus the `covers/` and admin loaders (8 files contain a
  "Loading..." string)

The waiting states today:

- the route loader is an h2 "Loading..." with a 5rem spinner;
- the details panel shows "Loading..." in a 24rem box;
- each comment shows "Loading comment..." while its author loads.

MUI's `<Skeleton>` (already installed), shaped like the real content, keeps the layout from
jumping and feels faster. Two shapes cover it: a details-card skeleton (title bar, two
address lines, one button) and two or three comment-card skeletons.

While you're there: the SLIC details come from the in-memory `slics` array, so the
"loading" between SLICs is only the `router.push` transition, not a fetch. `SlicDisplay` can
render the new SLIC immediately and show skeletons only for the comments list, which *is*
fetched.

### 44. A useful empty state on `/home` (and delete the dead carousel)

- [ ] **Files:** `home/EmptySlic.jsx`, `home/EmblaCarousel.jsx`, `app/globals.css:83-217`,
  `package.json`

With no SLIC selected, non-members see "Welcome to SLICs 5.0", the logo and a Buy Me a
Coffee button. Better, in this order:

1. recent lookups as tappable chips (#42);
2. a one-line tip, e.g. "Tap ⧉ to copy an address";
3. support as a secondary line.

Dead code to delete while you're there:

- `EmblaCarousel.jsx` is imported nowhere.
- `EmptySlic` builds `OPTIONS`/`SLIDES` for the carousel and never uses them.
- `globals.css` has ~135 lines of `.embla*` rules. They reference four custom properties
  that are defined nowhere (`--text-body`, `--detail-medium-contrast`,
  `--detail-high-contrast`, `--text-high-contrast-rgb-value`), the same copy-paste defect
  as #5.
- The `embla-carousel-react` dependency.

### 45. Comments: show state, not just disabled buttons

- [ ] **Files:** `comments/CommentHeader.jsx`, `comments/CommentFooter.jsx`,
  `comments/Comment.jsx`

- **Vote state.** After you upvote, the up button becomes *disabled*, and grey is the only
  signal. Make it a toggle: a filled `ThumbUp` in `primary` when the vote is yours, outlined
  otherwise, with `aria-pressed`. `disabled` also takes the button out of the tab order
  (accessibility guide §2).
- **Tap targets.** Vote buttons are `size='small'` with 1rem icons, about 26px. Give them at
  least a 40px hit area, using padding rather than bigger icons.
- **Dates.** Replace `MMMM D, YYYY` with relative time ("3 days ago", via dayjs's
  `relativeTime` plugin) and put the full date in a `title`. Recency tells a driver whether
  a gate code is still good.
- **Delete.** Either fix the confirm dialog (#33), or drop the confirm and offer "Undo" in a
  snackbar, deleting once it closes. That is faster for the common case and just as safe.

### 46. History rows should go somewhere

- [ ] **File:** `app/history/page.jsx`

The member-only history is a read-only list. Make each row link to `/home?slic=<numSlic>`
("look it up again"), and group by day within each month ("Today", "Yesterday",
"Mon Sep 29").

Unrelated, but in the same file: `console.log(session)` at line 52 writes every member's
session to the server log on each visit. Remove it.

---

## Tier D — Motion and navigation

All of these are progressive enhancement. Unsupported browsers keep today's instant
behavior.

### 47. Motion groundwork

- [ ] **Files:** `app/globals.css`, `utils/theme.js`

1. `html { scroll-behavior: smooth }` (`globals.css:11`) is unconditional. Wrap it in
   `@media (prefers-reduced-motion: no-preference)`.
2. Add one global reduced-motion floor, so later animations can't forget it:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, ::before, ::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
     ::view-transition-group(*),
     ::view-transition-old(*),
     ::view-transition-new(*) {
       animation: none !important;
     }
   }
   ```
3. Add two easing tokens as CSS custom properties: `--ease-out: cubic-bezier(.2, .8, .2, 1)`
   for entrances, and `--ease-spring: linear(…)` for small "pop" feedback (the
   `physics-based-easing` guide; `linear()` has been Baseline widely available since
   2023-12). For durations, reuse MUI's `theme.transitions.duration` (`shortest` 150ms to
   `standard` 300ms) rather than inventing new numbers.

### 48. Animate switching SLICs with a View Transition

- [ ] **File:** `home/Main.jsx`

When a driver picks a different SLIC, the details card swaps instantly. A same-document
View Transition cross-fades the old card into the new one. That makes it obvious the
content changed, which helps when two SLICs have similar addresses.

The details come from the in-memory list, so the state update is synchronous, which is
exactly what `startViewTransition` needs:

```js
import { flushSync } from 'react-dom';

const show = (next) =>
  document.startViewTransition
    ? document.startViewTransition(() => flushSync(() => setSlic(next)))
    : setSlic(next);
```

Give the details `Paper` `viewTransitionName: 'slic-details'` in `sx`. Only one element can
carry a given name at a time. Keep focus on the search input; the guide says to route focus
after `transition.finished` if it was lost.

**Support:** View Transitions have been Baseline since 2025-10 (Chrome/Edge 111, Safari 18,
Firefox 144). Older browsers just swap.

**Not recommended yet:** React's `<ViewTransition>` component. In Next 15.3 it needs
`experimental.viewTransition`, and that flag switches the whole app to React's
*experimental* release channel (`next/dist/lib/needs-experimental-react.js`). That's not for
a production app. Revisit when it ships in stable React.

### 49. Entry animations for cards and new comments

- [ ] **Files:** `app/globals.css` (or a `MuiPaper` variant), `comments/Comment.jsx`

`@starting-style` gives an element an entry transition in plain CSS (the
`animate-element-entry-exit` guide; Baseline since 2024-08). Good candidates:

- the details card;
- each comment card as the list loads, staggered with `transition-delay: calc(var(--i) * 40ms)`;
- a just-posted comment, which gets a brief `primary` background tint that fades out and
  shows the driver where it landed.

```css
.enter {
  transition: opacity 0.25s var(--ease-out), translate 0.25s var(--ease-out);
  @starting-style {
    opacity: 0;
    translate: 0 8px;
  }
}
```

Keep the offset small (8px) and let opacity do most of the work. Under reduced motion, #47's
floor turns it into an instant appear.

### 50. The menu and prompts as sheets

- [x] **Files:** `header/UserMenu.jsx`, `comments/CommentPrompt.jsx`,
  `install/IosInstallDialog.jsx`

The menu is a full-screen `Dialog` with a "Menu" h2 and a centered column of text buttons:
no icons, no grouping, no sign of the current page. Replace it with a `Drawer` from the left,
about 80% wide, of `ListItemButton`s with icons, grouped:

1. *Lookup · All Hubs · History · Cover Bids*
2. *Profile · About · Install*
3. *UPSers · Socks · Buy me a Coffee* (external, each with an "opens in new tab" icon)
4. *Dark mode* switch (#34) and *Sign out*

Mark the current route with `selected` (from `usePathname`). A `SwipeableDrawer` adds
swipe-to-close.

On phones, the comment prompt and the iOS install steps should be **bottom sheets**: a
`Dialog` with `TransitionComponent={Slide}` (`direction='up'`), and `sx` pinning the paper to
the bottom edge with rounded top corners. The buttons land in thumb reach, and the motion
says "this came up from below".

*Done 2026-10-07:* the menu, the comment prompt and the iOS install steps. The two sheets
share `utility/BottomSheetDialog.jsx`, which wraps `Dialog` with the phone slide-up and
bottom pinning, and `BottomSheetActions` (stacked, full-width, 48px buttons).
- **Menu.** `header/UserMenu.jsx` is now a `SwipeableDrawer`, `min(20rem, 80vw)` wide.
  - It has a blue header strip (logo plus "Hi, <first name>") and four groups: daily pages;
    Profile, Admin, About and Install; outside links; Dark mode and Sign out.
  - Every row is at least 48px. The current page gets `selected` and `aria-current`.
  - Internal rows use `next/link`, which is #53 for the menu only.
  - Swipe-to-open is off, because it fights the iOS back gesture. Under
    `prefers-reduced-motion` it opens instantly.
  - `Header.jsx` now passes a `signOutAction` server action instead of `ListItem` children.
- **Comment prompt and iOS install steps.** On phones both are bottom sheets
  (`slots.transition`, which replaces the deprecated `TransitionComponent`).
  - Their actions are full-width, stacked 48px buttons.
  - In the prompt, "Don't ask again for 2 weeks" sits below a divider, away from "Not now".

### 51. Feedback on tap

- [ ] **Files:** `home/TitleAddress.jsx`, `comments/CommentHeader.jsx`

- **Copy address.** Today it opens a Snackbar and runs a separate `setTimeout(3000)`, which
  fights the theme's 6000ms auto-hide. Instead, swap the copy icon for a check for about
  1.5s (`ContentCopy` → `Check`, cross-faded) and announce "Address copied" through a polite
  live region. No toast covering the search.
- **Vote.** Add a small scale pop on the thumb using `--ease-spring` (#47).
- **Haptics (optional).** Call `navigator.vibrate?.(10)` on copy and vote. Only Android
  supports it (iOS Safari doesn't implement it), so feature-detect and never rely on it.

### 52. A header that does more

- [ ] **Files:** `header/Header.jsx`, `layout/HomeButton.jsx`, `layout/BackButton.jsx`

- The logo isn't a link. Make it go to `/home` when signed in, otherwise `/`.
- On sub-pages, replace the floating Home/Back buttons (#37) with a back arrow and the page
  name in the toolbar.
- Add elevation on scroll: flat at the top of the page, with a shadow once content scrolls
  under it. Use MUI's `useScrollTrigger`, or a CSS scroll-driven animation (the
  `shrinking-header-on-scroll` guide). Firefox doesn't support scroll-driven animations, so
  treat that version as decoration with no fallback.
- For the installed app, consider a `BottomNavigation` (Lookup · History · Profile) for the
  three most-used destinations instead of the hamburger, for thumb reach. It needs
  `viewport-fit=cover` and `padding-bottom: env(safe-area-inset-bottom)` for the iPhone home
  indicator. Note that the `statusBarStyle: 'default'` comment in `layout.jsx` assumes no
  safe-area CSS.

### 53. Internal links reload the whole page

- [ ] **Files:** `utils/theme.js`, plus roughly two dozen internal `href`s on MUI components
  (e.g. `header/UserMenu.jsx` ×5, `admin/page.jsx` ×6, `signIn/Membership.jsx`,
  `layout/RedirectMessage.jsx`, `not-found.jsx`)

A MUI `Button`, `IconButton` or `ListItemButton` with an `href` renders a plain `<a>`. Every
menu tap therefore reloads the whole document: the header, theme and session re-initialize
and the screen flashes. Only a handful of call sites pass `LinkComponent={Link}` (e.g.
`home/MemberDisplay.jsx`). Set it once in the theme:

```js
import NextLink from 'next/link';
// …
components: { MuiButtonBase: { defaultProps: { LinkComponent: NextLink } } }
```

External `https://…` links still work through `next/link`. With client-side navigation in
place, add feedback for the wait: Next 15.3's `useLinkStatus` can drive a thin progress bar
under the toolbar while a route loads.

*Blast radius:* every internal link becomes a client-side navigation. That's faster, but
re-test anything that relied on a full reload to pick up fresh server data, such as the
membership page after a Buy Me a Coffee purchase.

---

## Tier E — Optional features

### 54. Pinned SLICs

- [ ] A star on the details card pins a SLIC. Pinned SLICs lead the search list (#42) and the
  empty state (#44). Start in localStorage, and move to the user record if drivers want pins
  on every device.

### 55. Manifest shortcuts

- [ ] **File:** `app/manifest.js`. Add `shortcuts`, which appear when you long-press the
  home-screen icon on Android: "Look up a SLIC" (`/home`) and "My history" (`/history`).
  Update `theme_color` once #31 and #35 are decided.

### 56. Dark surfaces with depth

- [ ] **File:** `utils/theme.js` (`tokens`). Dark mode uses `#050505` for both the page and
  the paper, so panels separate only through MUI's elevation overlay. A slightly lifted
  ladder would read better in a cab at night and reduce OLED black smear while scrolling,
  e.g. page `#0b0d10`, panel `#14181d`, comment `#1b2027`. This is a token-only change.

### 57. Admin and Cover Bids screens

- [ ] Not reviewed in depth here. #28 (the near-duplicate card and table components) comes
  first, so a restyle doesn't have to be done twice.

---

## Checked and fine

- MUI sets `color-scheme` on `<html>` in both schemes (measured `light` / `dark`), so native
  controls and scrollbars already match. `InitColorSchemeScript` applies the class before
  first paint, so there is no theme flash.
- No horizontal overflow at 390px on the public pages (`scrollWidth === innerWidth`).
- Both bounce animations already respect `prefers-reduced-motion`.
- MUI `Dialog`s already trap focus and close on Escape.

## Part 2 verification

- **Per item:** `npm run build` (not `npm run lint`, which is broken). Then check the
  affected screens at phone width in both schemes.
- **Tier A:** do a keyboard-only pass (Tab, Shift+Tab, Enter, Space, Esc). For #32 and #33,
  spot-check with VoiceOver (iOS) or TalkBack (Android). Re-measure contrast with the
  DevTools color picker or the WCAG formula.
- **Tier B:** compare the numbers above (heading top 128px, footer 544px, page 1644px on the
  landing page at 390×844) before and after. Use `Emulation.setDeviceMetricsOverride`, not
  `--window-size` (see the gotcha above).
- **Tier D:** test once normally and once with DevTools → Rendering →
  "Emulate CSS media feature prefers-reduced-motion: reduce". Everything must still work
  with no motion. Test in a browser without View Transitions too, such as an older Safari
  or Firefox ESR, to confirm the instant fallback.
- **Signed-in screens:** check them on a real phone, because this review couldn't screenshot
  them.
