# UI-SUGGESTIONS.md

The punch list for the app's look, feel and front-end UX. It sits alongside
`SUGGESTIONS.md` (security/perf/quality) and `STRUCTURE.md` (where things live). This
file was called `THEME.md` until 2026-10-03. Item numbers are unchanged because code
comments and `CLAUDE.md` cite them (`#17`, `#18`, `#19`, …).

It has two parts:

- **[Part 1 — Theme plumbing](#part-1--theme-plumbing) (#1–#30).** This was the original
  `THEME.md`. It makes styling controllable from `theme.js`. Items 1–19 are done,
  and #20's spacing half is done. Its other half (`fontSize` overrides) and #21–#30 are
  still open.
- **[Part 2 — UI review and modernization](#part-2--ui-review-and-modernization) (#31–#57).**
  A review of the app as drivers use it, done on 2026-10-03: accessibility defects,
  phone layout, the lookup screen, motion, and navigation. Start with
  [the suggested order](#suggested-order).

**How to use this:** every item is independent unless it says `Depends on:`. Pick one,
do it, check the box. Each item states its _blast radius_ so you can judge risk before
starting.

**Design direction (since 2026-10-07):** the app is moving to a soft, embossed
(neumorphic) style in its existing colors. The lookup card, the search bar and the Driver
tips already have it. Whatever an item changes should match that style, using the helpers in
`app/components/utility/soft.js` and the rules in `CLAUDE.md` → "Visual style: soft /
embossed". That holds even where an item's own text predates this and suggests outlined
or elevated MUI defaults.

**Before shipping any item:** there is no test suite in this repo. Run `npm run build`,
then click through the affected screens in **both light and dark mode** at phone width.
The app is used daily in production.

---

# Part 1 — Theme plumbing

## Why this list exists

The theme file is partly inert. Three defects mean edits you make in `theme.js`
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
only ``className={`${font.className}`}``. In `next/font`, `font.variable` is the class
that _defines_ the custom property; `font.className` merely sets `font-family` directly.
So `--font-font` never enters the cascade, and every `fontFamily: 'var(--font-font)'` in
`theme.js` (lines 63, 103, 114, 126, 138, 153) resolves to an invalid value. Text
looks right only because `<body>` inherits Montserrat from `font.className`.

**Fix applied:** `className={font.variable}` — MUI's documented next/font pattern.

`font.variable` **alone**, not alongside `font.className`. Keeping both would define the
variable but not finish the job: `font.className` is a _class_
(`.__className_x { font-family: Montserrat }`) while CssBaseline sets the body font via an
_element_ selector (`body { font-family: ... }`). The class outranks it, so the theme
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
(both the family and the `weight` array). `theme.js` just points at the variable.

_Blast radius:_ one line, but font rendering is global — worth a look at a real page.

### 2. `MuiButton` is declared twice; the first block is dead

- [x] **DONE.** **File:** `theme.js:100` and `:109`

Two `MuiButton` keys in the same `components` object. The second (`variants`) silently
overwrote the first (`styleOverrides`), so the `styleOverrides.root` block never applied.

**What actually happened:** the three `variants` each repeated the same `fontFamily` /
`borderRadius` / `textTransform`, and those _are_ valid CSS, so buttons did get the
intended radius and casing — just via three copies in the wrong place. Merging them back
into a single `styleOverrides.root` is therefore **visually identical**, confirmed below.

_Blast radius:_ none in practice. Done together with #3.

### 3. Palette paths in `MuiButton.variants` never resolve

- [x] **DONE — but not the way this item originally proposed.** **File:**
      `theme.js:117, 129, 141` (and the `&:hover` blocks below each)

`color: 'text.light'` and `backgroundColor: 'primary.dark'` were `sx` shorthand written
into a **plain CSS** context. MUI does not resolve palette paths in `variants[].style`, so
the browser received literal `color:text.light` and discarded it. Verified in the served
HTML: **8 invalid declarations** on the home page alone, plus 4 hover rules that were
empty after the browser dropped their only declaration.

**This item originally said to resurrect them with a theme callback. That would have been
a regression** — three reasons:

1. `color: text.light` (`#f7f7f7`) on the `text` and `outlined` variants is near-white
   text on a light background. Invisible buttons.
2. `backgroundColor: primary.dark` on hover applied to _all_ contained buttons would turn
   the 10 `color="error"` delete buttons **blue** on hover.
3. For `contained`, the intent is already MUI's default. The emitted CSS proves it:
   ```
   :hover{--variant-containedBg:var(--mui-palette-primary-dark); …}
   ```
   MUI already darkens to `primary.dark` on hover — and does it _per color prop_, so an
   error button darkens to error-dark. The hardcoded override would have destroyed that.

**Fix applied:** deleted the color/hover rules rather than reviving them, and merged the
surviving `fontFamily` / `borderRadius` / `textTransform` into one `styleOverrides.root`
(item 2). A comment in `theme.js` records why the color rules must not come back.

**Verified by diffing served CSS before/after:**

|                                           | before | after                 |
| ----------------------------------------- | ------ | --------------------- |
| `color:text.light` (invalid)              | 4      | **0**                 |
| `background-color:primary.dark` (invalid) | 4      | **0**                 |
| `border-radius:1.5rem`                    | 4      | 4                     |
| `text-transform:none`                     | 4      | 4                     |
| rendered button elements                  | 4      | 4                     |
| `MuiButton` `:hover` rules                | 20     | 16 (the 4 empty ones) |

_Blast radius:_ none — appearance is unchanged; 8 invalid declarations and 4 dead rules
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
- Headless Chrome, using the _served_ variable rules and the _served_ init script,
  computed the background of a `.comment-surface` element in all four states:

  | stored `mui-mode` | `prefers-color-scheme` | `<html>` class | computed background                                |
  | ----------------- | ---------------------- | -------------- | -------------------------------------------------- |
  | (none → `system`) | light                  | `light`        | `rgb(234, 248, 254)` = `#eaf8fe` ✔ (was `#050505`) |
  | (none → `system`) | dark                   | `dark`         | `rgb(5, 5, 5)` = `#050505` ✔                       |
  | `light`           | —                      | `light`        | `#eaf8fe` ✔                                        |
  | `dark`            | —                      | `dark`         | `#050505` ✔                                        |

- The comment editor is only rendered behind auth, so the two components were syntax-
  checked by transpiling them rather than via the dev bundle. `npm run lint` currently
  fails at config level on every directory (`eslint.config.mjs` serialization) —
  pre-existing and unrelated.

_Caveat (retained from the original item, now satisfied):_ the variable is defined
where tiptap renders — see above.

_Blast radius:_ comment editor and comment cards, both schemes. Explicit light/dark
users see no change; `system`+light-OS users get a readable editor for the first time.

### 5. Code blocks in comments are invisible in light mode

- [x] **DONE — the premise was off, and the fix is broader than the file list.**
      **Files:** `app/globals.css:47-85`, `app/components/comments/Comment.jsx:52`,
      `app/components/comments/CommentEditor.jsx:88`

The tiptap styles referenced four CSS variables that were **never defined anywhere**:
`--black`, `--white`, `--gray-2`, `--gray-3` — copy-pasted from the tiptap starter
template, which defines them; this app never did.

**What was actually happening**, measured with the served CSS in headless Chrome rather
than assumed. An undefined `var()` makes the declaration _invalid at computed-value
time_, which does not mean "invisible": the property falls back to its initial value
(`background` → transparent) or its inherited value (`color`). So:

- Nothing was ever unreadable. Text kept the scheme's normal color in both modes.
- Code blocks, inline code and blockquotes were **indistinguishable from plain text** —
  no background, no left border. Only `<hr>` was truly invisible (`border: none` plus
  an invalid `border-top` → `0px none`).
- **And all of it applied only inside the editor.** `@tiptap/core` prepends the
  `tiptap` class to its own contenteditable element (`dist/index.js:4669`); nothing
  in `app/` puts it on a rendered comment. `Comment.jsx` renders the stored HTML via
  `html-react-parser` into a plain `Box`, so posted comments never had _any_ of these
  rules — a `<blockquote>` was bare text, and `<hr>` was Tailwind preflight's hardcoded
  `1px solid #e5e7eb`, which ignores the color scheme.

**Fix applied.** The block is renamed `.comment-content` and both places comment
content renders carry that class — the tiptap element (alongside `comment-surface`
from item 4) and the rendered `Box` in `Comment.jsx` — so a code block looks the same
while typing and after posting. The four undefined variables became two translucent
MUI tokens, which sit correctly on any surface in either scheme:

| was                                             | now                             | light             | dark                    |
| ----------------------------------------------- | ------------------------------- | ----------------- | ----------------------- |
| `--black` (code / pre background)               | `--mui-palette-action-selected` | `rgba(0,0,0,.08)` | `rgba(255,255,255,.16)` |
| `--gray-2`, `--gray-3` (hr / blockquote border) | `--mui-palette-divider`         | `rgba(0,0,0,.12)` | `rgba(255,255,255,.12)` |
| `--black`, `--white` (code / pre `color`)       | _dropped — inherits_            |                   |                         |

Two smaller things went with it: `pre`'s `font-family: 'JetBrainsMono', monospace`
was deleted (that font is loaded nowhere, so it always fell through to the generic
family; now Tailwind preflight's `ui-monospace, …` stack applies uniformly), and the
placeholder rule `.tiptap p.is-editor-empty…` stays as-is — it is editor-only by nature.

**Verified by computed style, before and after, both schemes**, on markup containing
`<code>`, `<pre><code>`, `<blockquote>` and `<hr>` — once under `.tiptap` (editor) and
once as a bare rendered comment:

|                                  | before (editor)        | before (rendered)                | after (both)          |
| -------------------------------- | ---------------------- | -------------------------------- | --------------------- |
| `code` / `pre` background        | transparent            | transparent                      | `action.selected` ✔   |
| `blockquote` border-left         | `0px none`             | `0px`                            | `3px solid divider` ✔ |
| `hr` border-top                  | `0px none` (invisible) | `1px solid #e5e7eb` (fixed grey) | `1px solid divider` ✔ |
| undefined `var()`s in served CSS | 5                      |                                  | **0**                 |

Rendered and editor now compute identically in each scheme.

_Blast radius:_ larger than the original line said — it now includes **posted**
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
chain compared the function _parameter_ `mode`, still `'system'`, so nothing matched
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

| start             | initial                 | 1st click                    | 2nd click                    |
| ----------------- | ----------------------- | ---------------------------- | ---------------------------- |
| system + OS light | `html.light`, moon icon | `html.dark`, stored `dark`   | `html.light`, stored `light` |
| system + OS dark  | `html.dark`, sun icon   | `html.light`, stored `light` | `html.dark`, stored `dark`   |

The same test against the **original** four-branch code produced identical output,
confirming this is a pure simplification.

_Blast radius:_ none — the toggle button only, and its behavior is unchanged.

---

## Tier 1 — Named token block

The core change: one place to edit colors.

### 7. Introduce a `tokens` object at the top of `theme.js`

- [x] **DONE.** **File:** `theme.js:5-23`

The dark scheme redefined colors by **copy-pasting hex values** — `#050505`, `#edf3fc`
and `#222222` each appeared in both the light `palette` and `colorSchemes.dark.palette`
(5, 6 and 5 times respectively), and `primary` was spelled out twice in full.

**Fix applied.** One named block at the top that both schemes read from, plus a single
shared `primary`:

```js
const tokens = {
  brand: lightBlue, // primary shades + the light scheme's paper
  ink: '#222222', // dark text
  chalk: '#f7f7f7', // light text
  canvas: '#edf3fc', // light page background; the dark scheme's "opposite"
  void: '#050505', // dark page background; the light scheme's "opposite"
  comment: '#eaf8fe', // comment surface in the light scheme
};
```

The palette now contains **zero hex literals** — every raw color goes through `tokens`,
so changing one line changes both schemes. All palette keys and the two-scheme structure
are untouched, so no call sites change.

**Two deliberate departures from the sketch above:**

1. `paper` was renamed `canvas`. MUI already has `background.paper`, and in the light
   scheme that key is `lightBlue[50]` (`#e1f5fe`), _not_ `#edf3fc` — a token literally
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

|                                                              | before | after                        |
| ------------------------------------------------------------ | ------ | ---------------------------- |
| `--mui-palette-*` variables (`:root,.light` + `.dark`)       | 430    | 430, **byte-identical**      |
| emitted CSS rules (all `<style>` tags, boundary-independent) | 197    | 197, **0 added / 0 removed** |
| hex literals in emitted CSS                                  | 182    | 182, identical multiset      |
| hex literals in `theme.js` outside `tokens`                  | 18     | **0**                        |

The served bundle was confirmed to contain the new `tokens` module at the time of the
diff, so the comparison was against the refactored code, not a cached compile.

_Blast radius:_ none — nothing the browser receives changed.

### 8. Prune or wire up the dead palette keys

- [x] **DONE.** **File:** `theme.js`

Verified zero references across `app/` and `utils/`, and **deleted** from both schemes:

| Key                       | Was defined at      | Uses |
| ------------------------- | ------------------- | ---- |
| `palette.containedButton` | `:54-57`            | 0    |
| `background.solid`        | `:62`, `:38` (dark) | 0    |
| `background.grey`         | `:63`, `:39` (dark) | 0    |
| `text.solid`              | `:70`, `:44` (dark) | 0    |
| `text.dark`               | `:67`, `:43` (dark) | 0    |

The `ink` token (`#222222`) and the `blue`/`grey` color imports only fed those keys, so
they went too. `containedButton` was _not_ adopted for item 26: its values (`blue[300]`
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
**referenced nowhere** and whose values _conflicted_ with the real theme (`--primary:
#0070f3` vs the actual `lightBlue[600]` = `#039be5`). The Tailwind
`colors: { background, foreground }` extension that mapped to them was equally unused:
`bg-background`, `text-foreground`, `bg-foreground` and `text-background` appeared nowhere,
and neither did any `var(--primary)`-style reference (checked `app/` and `utils/` across
`.jsx`/`.js`/`.css`, including Tailwind arbitrary values).

**Removed:** the `:root` block and the `theme.extend.colors` mapping. **Tailwind stays** —
only the color mapping went, and a comment in the config says where colors do live.

Also removed the `./pages` and `./components` content globs — neither directory exists at
the repo root, so they were dead. `./app/**` is the only one that matched anything.

_Blast radius:_ none — `npm run build` passes and the served CSS lost only the unused
custom properties.

### 11. Fold layout constants into the theme

- [x] **DONE.** **Files:** `constants.js`, `theme.js`, 19 consumers

`variables.js` mixed UI tokens with domain constants. `ELEVATION`, `MAX_WIDTH`,
`MIN_HEIGHT` and `BORDER_RADIUS` are gone from it; `SLICS_PER_PAGE` and
`COVER_BID_MONTHS_BACK` stay.

**Where they went:**

| Was                            | Now                                                                 | Notes     |
| ------------------------------ | ------------------------------------------------------------------- | --------- |
| `MAX_WIDTH = '32rem'`          | `theme.layout.maxWidth` → since item 19, `theme.layout.width.panel` |           |
| `MIN_HEIGHT = '24rem'`         | `theme.layout.minHeight`                                            |           |
| `ELEVATION = 6`                | `theme.layout.elevation`                                            |           |
| `BORDER_RADIUS = '6px'` (dead) | `theme.shape.borderRadius = 8`                                      | see below |

**How consumers read them:** `import theme from '@/theme'` and
`theme.layout.maxWidth` — the idiom `Comment.jsx` / `TablePaginationActions.jsx` already
used. This required dropping the `'use client'` directive from `theme.js`: with it,
the nine consumers that are server components (`history/page.jsx`, `home/EmptySlic.jsx`,
`signIn/Membership.jsx`, …) would receive a client _reference_ whose `.layout` is
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

_Blast radius:_ the radius change above. Everything else is value-preserving.

---

## Tier 2 — Component defaults

Each is a few lines in `theme.components`.

> **Applies to all of Tier 2:** an explicit prop at a call site still beats a theme
> default. These reduce _future_ repetition, but produce no immediate visual change until
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

If the app _should_ move to all-small, all-full-width inputs, that's a design decision to
make on purpose — set the default and walk the 18 + 20 sites above — not a cleanup.

### 14. `MuiChip.defaultProps.size = 'small'`

- [x] **DONE.** Default set in `theme.js`; `size='small'` removed from the 7 sites
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
was originally listed too, but it had drifted into a comment _card_ — `mt: 2, p: 2`, no
min-height/flex — and is the twin of `admin/user-page/UserComments.jsx`; that pair is
item 28, not this one.)

**Done:** `MuiPaper.variants` in `theme.js` defines `variant="panel"` with only the
structural block; the five sites are now `<Paper variant='panel' sx={{ …delta }}>`.
Reconciled deliberately: padding defaults to `2rem` all round (the majority), the two
comments panels override `px: 2` so comment cards get the width; `justifyContent:
'center'` is content alignment, so the three text-centered panels set it themselves.
**Gotcha worth remembering:** `Paper` only applies its shadow and elevation overlay for
`variant="elevation"` (see `Paper.js`), so a custom variant must set `boxShadow` and
`backgroundImage` itself — the variant reads `theme.vars.shadows[6]` / `theme.vars.overlays[6]`,
the same vars MUI's own path uses, so it renders identically in both schemes.

_Blast radius:_ five of the app's most visible surfaces. Check each in both schemes.

### 18. A `sectionHeading` typography variant

- [x] Replaced `app/components/layout/StyledHeading.jsx` (18 sites). Heading style is now
      a theme edit: `MuiTypography.variants` in `theme.js` defines `sectionHeading` as
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
  there is _pixels_, not spacing, so they're not part of this dialect (see 19 for widths).

- [x] Still open from this item: ~20 `fontSize` overrides in `sx` that bypass the
      typography scale entirely.

  _Done 2026-10-07:_ #28 removed the duplicate copies. The remaining text overrides now use
  the scale:
  - The 0.65–0.8rem one-offs in the bid filters, job cards and grids now use `caption`
    (0.75rem): `variant='caption'`, or `typography: 'caption'` on chips and toggles.
  - The menu title uses `h6`.
  - The app shell's `fontSize: '1.6rem'` is gone (see #38). It only reached bare text, and
    it inflated the line boxes around inline buttons, so the landing page is 21px shorter.
    No text changed size.

  **Rule going forward:** text sizes come from a `Typography` variant (`variant=` or
  `typography:` in `sx`). Icon `fontSize` values are icon sizes, not text, and stay as rem
  strings. `app/global-error.jsx` is plain `style` and exempt.

### 21. Move `zIndex` literals into the theme

- [x] Unmanaged and uncoordinated: `10` (`bids/BidsFilters.jsx:51`,
      `coverBidJobs/CoverBidJobsTable.jsx:140`), `1000` (`footer/FooterContainer.jsx:10`),
      `2000` (`layout/ModeSwitch.jsx:31`). MUI's own `theme.zIndex` scale tops out at 1500 for
      tooltips, so `ModeSwitch` currently floats above MUI modals — probably unintended.
      #34 moves `ModeSwitch` into the header, which removes that layer entirely and leaves
      only the `10` and `1000` values for this item.

  _Done 2026-10-07:_
  - The two sticky filter bars use `zIndex: 'stickyBar'`, a new key in `theme.zIndex`
    (10, below every MUI layer). `sx` resolves it by name.
  - The footer's `1000` (and its `bottom: 0`) did nothing on a `position: 'static'`
    `AppBar`, so they're removed.
  - The `2000` went with #34.

---

## Tier 4 — Dead code and duplication

### 22. Delete two dead layout files

- [x] `app/components/layout/StyledPage.jsx` and `app/components/layout/Wrapper.jsx` —
      verified: **never imported anywhere**. `Wrapper.jsx` additionally computes a `margin`
      state it never applies to its `sx`, inside a `useEffect` with no dependency array.

_Blast radius:_ none.

### 23. Remove three dead theme imports

- [x] `drivers/TablePaginationActions.jsx:1`, `comments/CommentEditor.jsx:8`,
      `comments/Comment.jsx:6` import `theme from '@/utils/theme'` and never reference it.

  Worth removing so the pattern isn't copied: with `cssVariables` enabled, a **static**
  theme import bypasses color-scheme resolution and would lock a component to light-mode
  values. Use `useTheme()` instead. (`Providers.jsx:3` uses it legitimately — leave it.
  `Wrapper.jsx:3` disappears with item 22.)

### 24. Consolidate the page shells

- [x] `layout/Container.jsx` and `layout/PageContainer.jsx` (plus the two dead files in
      item 22) each redeclare the same `minHeight: '100dvh'` + centered flex column +
      `bgcolor: 'background.default'` recipe with different hardcoded padding.
      `Depends on:` item 22.

  _Done 2026-10-07, together with #37's doubled-`minHeight` bullet:_
  - `Container` is the shell: a column at least one screen tall, on the page background.
    The footer pins itself to its bottom with `mt: 'auto'`.
  - `PageContainer` is the content column only, with no `minHeight`.
  - At 390×844 the landing page went from 1644px to 1298px, and its footer now starts on
    the first screen. Privacy and Terms are unchanged.
  - Still open in #37: the 128px `my`, the footer's height and the floating Home/Back
    buttons.

### 25. Off-brand icon color

- [x] `fill: '#1976d2'` in `about/Community.jsx:18`, `about/Contributions.jsx:20`,
      `about/Future.jsx:19`. That hex is MUI's **default** primary — the app's actual primary
      is `lightBlue[600]` (`#039be5`), so these icons are visibly off-brand today. Replace
      with the palette token.

  _Done 2026-10-07:_ `color: 'primary.main'`. An `SvgIcon` paints with `currentColor`.

### 26. Five copies of the Buy-Me-a-Coffee button style

- [x] `backgroundColor: '#f7f7f7', color: 'black'` repeated verbatim at
      `about/Contributions.jsx:35`, `signIn/Membership.jsx:76`, `profile/ProfileData.jsx:95`,
      `coverBidJobs/NotMember.jsx:25`, `layout/BuyMeACoffeeButton.jsx:30`.

  `#f7f7f7` is exactly `palette.text.light`. `about/AboutLink.jsx:30` already accepts the
  color as a prop, so this is half-done already. If this wants a palette home, add a
  purpose-named key (e.g. `palette.bmc`) — the old `containedButton` key was deleted in
  item 8 and its values didn't match this style anyway.

  Note these use literal `'black'`; the theme's former `#222222` dark-text keys
  (`text.dark`/`text.solid`) were deleted as unused in item 8, so pick one value here.

  _Done 2026-10-07:_
  - New `palette.bmc` in both schemes: `main` is `tokens.chalk`, `contrastText` is
    `tokens.void`, and `light`/`dark` are derived for hover.
  - One `layout/BmcButton.jsx` (`color='bmc'`, logo, new tab) replaces all five copies.
    Contributions now uses `BuyMeACoffeeButton`, which is the same arrow-plus-button pair.
  - The URL is `BMC_URL` in `constants.js`, also used by the menu and the lookup
    screen.
  - `background.opposite`/`text.opposite` were pruned at the same time. They had been dead
    since #34.

### 27. Duplicated `bounce` keyframe

- [x] Byte-identical in `layout/BuyMeACoffeeButton.jsx:15-20` and
      `about/AboutLink.jsx:15-20`.

  _Done 2026-10-07:_ the keyframe now lives once, in `utility/BouncingArrow.jsx`, with the
  reduced-motion opt-out. Both buttons render it.

### 28. Near-duplicate card components

- [x] `bids/BidsJobCard.jsx` and `coverBidJobs/CoverBidJobCard.jsx` are near-identical,
      including a byte-identical "Show route" Accordion block and the same
      `pb: '8px !important'` hack. Their DataGrid `sx` is likewise duplicated between
      `bids/BidsTable.jsx:200` and `coverBidJobs/CoverBidJobsTable.jsx:235`.

  _Done 2026-10-07:_
  - `coverBidJobs/JobCard.jsx` is the one card. The two old cards are thin wrappers that
    map each job shape into it.
  - `coverBidJobs/jobGrid.jsx` holds the shared grid `sx`, the Description column and the
    day/time chip.
  - `/bids` uses `dayFormat.js` instead of its own copies. `formatDayValue` now also
    accepts `HH:MM:SS`.
  - The `!important` hack is a `:last-child` override.

### 29. `useIsMobile` disagrees with the theme's breakpoints

- [x] `utils/clientFunctions.js:23` hardcodes 768px. The theme defines `sm: 600` and
      `md: 960`. So `useIsMobile()` and `useMediaQuery(theme.breakpoints.down('md'))` disagree
      about what "mobile" means depending on which component you're in.

  Rebase the hook on `theme.breakpoints`, or delete it in favor of `useMediaQuery`.
  `coverBidJobs/CoverBidJobsTable.jsx` and `admin/coverBidJobs/CoverBidJobsManager.jsx`
  already use the `useMediaQuery` form.

  _Done 2026-10-07:_ the hook is deleted.
  - Its only real caller, the phone-only install nudge, uses
    `useMediaQuery(theme.breakpoints.down('sm'))`.
  - `CommentsContainer` imported it without using it.

### 30. Unused / contradicted constant imports

- [x] `admin/users/[id]/page.jsx:15` imports `MAX_WIDTH` and never uses it.
      `comments/CommentEditor.jsx:7` and `comments/Comment.jsx:10` import `ELEVATION`, then
      hardcode `elevation={0}` and `elevation={1}` instead.

  _Done, found 2026-10-07:_ no `MAX_WIDTH` or `ELEVATION` imports remain anywhere. Item 11
  folded those constants into the theme and took their imports with it.

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
2. Change `typography.fontFamily` in `theme.js` to something unmistakable like
   `'Comic Sans MS'` → **nothing changes on screen**. That's the bug.
3. Revert, apply the fix, repeat step 2 → the font now changes.

**For every item:** `npm run build`, then walk the affected screens in **both** light and
dark mode using the menu's Dark mode switch (#34 moved it there from the bottom-right).
Items 3, 12–16 and 17 are the ones most likely to shift appearance in ways a build won't
catch.

**Part 1 is complete as of 2026-10-07.** Every item from #1 to #30 is checked off.

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
  _Gotcha:_ plain `chrome --headless --window-size=390,…` lays the page out at a 500px
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

| Order | Items        | Why                                                                                       |
| ----- | ------------ | ----------------------------------------------------------------------------------------- |
| 1     | #32, #33     | Accessibility defects, mostly one-line fixes                                              |
| 2     | #31, #35     | Color decisions with app-wide reach; each is its own reviewed change                      |
| 3     | #34, #36–#39 | Phone layout: gutters, dead space, heading sizes, the floating toggle                     |
| 4     | #53          | Internal links reload the whole page. One theme line, and every later nav change benefits |
| 5     | #40–#46      | The lookup screen and its neighbors, which drivers use daily                              |
| 6     | #47–#52      | Motion and navigation polish                                                              |
| 7     | #54–#57      | Optional features                                                                         |

---

## Tier A — Accessibility and correctness

### 31. The brand blue fails text contrast

- [x] **Files:** `theme.js` (`primary`), `app/layout.jsx` (`themeColor`),
      `app/manifest.js` (`theme_color`)

_Done 2026-10-07:_ `primary` is split per scheme, with one change from the recommendation
below. Stock `lightBlue[800]` still left four small-text pairs just under 4.5: footer
`text.light` on it 4.47, and it as text on the canvas 4.30, the paper 4.27 and the comment
surface 4.42. So the light `main` is a new `tokens.ink` `#0172b5`, which is [800] darkened 4%.
That is the least darkening that clears all four.

| Pair                                                                  | Ratio              |
| --------------------------------------------------------------------- | ------------------ |
| white label on light `main` `#0172b5`                                 | 5.15               |
| footer `text.light` on it                                             | 4.80               |
| it as text on canvas / paper / comment                                | 4.61 / 4.58 / 4.75 |
| white on light `dark` `brand[900]` (hover, menu header band)          | 7.39               |
| dark `contrastText` `rgba(0, 0, 0, 0.87)` on dark `main` `brand[600]` | 6.09               |
| dark `main` as text on the dark canvas                                | 6.56               |
| white on dark `dark` `brand[800]` (menu header band)                  | 4.79               |

Also changed:

- `themeColor` and `manifest.theme_color` are now `#0172b5`.
- `covers/Calendar.jsx` read `theme.palette.*`, which only holds the light scheme. It now
  reads `theme.vars.palette.*`.
- The menu's current-page icon is now `primary.main` in both schemes. The light
  `primary.dark` workaround for this item is gone.

Left over: in dark mode, a contained button under a mouse hover is 4.06 (black label on
`brand[800]`). Touch screens never show that state, because MUI drops the hover color under
`hover: none`. Lightening the dark `dark` would fail the menu header band instead.

Measured:

| Pair                                                            | Ratio    | AA needs            |
| --------------------------------------------------------------- | -------- | ------------------- |
| white button label on `primary.main` `#039be5`                  | **3.08** | 4.5                 |
| footer `text.light` `#f7f7f7` on `#039be5`                      | **2.87** | 4.5                 |
| `#039be5` text / outlined buttons on the light canvas `#edf3fc` | **2.76** | 4.5 (3 for borders) |
| `#039be5` on the light paper `#e1f5fe` (menu buttons)           | **2.74** | 4.5                 |
| `#039be5` on the dark canvas `#050505`                          | 6.62     | ✔                   |

MUI picks white for the button label because its default `contrastThreshold` is 3, and
white scores 3.08. So in light mode all 44 contained buttons, the footer text and every
text or outlined primary button (menu items, Home/Back, the RedirectMessage link) fall
below AA.

**Recommended fix:** `primary` is shared by both schemes today. Split it, giving the light
scheme a darker shade:

| Shade                      | white text on it | it on the canvas |
| -------------------------- | ---------------- | ---------------- |
| `lightBlue[700]` `#0288d1` | 3.86             | 3.46             |
| `lightBlue[800]` `#0277bd` | **4.80**         | 4.30             |
| `lightBlue[900]` `#01579b` | 7.40             | 6.63             |

Light scheme: `main: brand[800], dark: brand[900]`. Button labels pass. Primary-colored
text sits at 4.30, just under 4.5. For strict AA on small text links, use `primary.dark`
there.

Dark scheme: keep `brand[600]` for text on black (6.62). Contained buttons there still get
white labels at 3.08, so set the dark scheme's `primary.contrastText` to
`'rgba(0, 0, 0, 0.87)'`.

**Alternative (one line, different look):** `palette.contrastThreshold: 4.5`. MUI then picks
black labels on `#039be5` (6.82:1) in both schemes. This keeps today's bright blue and
fixes the labels, but buttons become dark text on blue, and blue _text_ on the light canvas
still fails.

After either fix, update `themeColor`, `manifest.theme_color` and the comment in
`manifest.js` that says they match `primary.main`.

_Blast radius:_ an app-wide color shift, the most visible change in this list. Ship it on
its own and look at both schemes.

### 32. "oogle": the Google icon is used as a letter

- [x] **Files:** `home/MapPhoneLinks.jsx:23-24`, `signIn/SignIn.jsx:31-32`

_Done 2026-10-07:_ the buttons now read "Google Maps" and "Continue with Google", with
`startIcon`. The Apple Maps and dispatch buttons moved to `startIcon` too, which replaced
their `display: flex` + `gap` workaround.

The buttons are written `<Google />oogle Maps` and `&nbsp;<Google />oogle`. The SVG has no
text alternative. Screen readers announce **"oogle Maps"** and **"oogle"**, and voice
control ("tap Google Maps") can't find the button.

Use `startIcon={<Google />}` with real text: "Google Maps" and "Continue with Google". That
matches what the Apple Maps and dispatch buttons almost do already.

### 33. Controls that aren't real controls, or do nothing

- [x] One-line fixes:

_Done 2026-10-07:_ every row below, with these notes:

- **EmailAuth:** the mode links are `Link component='button'`, which makes them blue
  `primary.main` text (4.61:1 on the light canvas). They also set `verticalAlign:
'baseline'`, because MUI's button-link style uses `'middle'` and that drops them below the
  sentence. Tab reaches them, and Enter and Space both switch the form (checked in headless
  Chrome).
- **Map links:** these now use `mapsHref` from `lib/geo.js`, the builder the gym and
  place cards already used. That one function fixes the state, the encoding and the `https`
  rows.
- **CommentFooter:** the dialog is titled "Delete this comment?", with Cancel and Delete
  buttons. `aria-labelledby` points at a `useId()` id. Delete is disabled while the request
  is in flight. The error feedback is still #45.

| Where                                                | Problem                                                                                                                | Fix                                                                                                            |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `signIn/EmailAuth.jsx:164, 255`                      | "Create one" / "Sign in" are `<span onClick>`: not focusable, no role, so keyboard and switch users can't change modes | `<Link component='button' type='button' onClick={…}>`                                                          |
| `layout/HomeButton.jsx`                              | icon-only button with no accessible name                                                                               | `aria-label='Home'` (placement: #37)                                                                           |
| `footer/Footer.jsx:99`                               | the `WebDevilishSmile@gmail.com` button has no `href`, so tapping it does nothing                                      | `href='mailto:…'`                                                                                              |
| `footer/Footer.jsx:72`                               | logo `alt='Description'`                                                                                               | `alt=''`: decorative, since the header already carries the brand                                               |
| `home/MapPhoneLinks.jsx:41`                          | the `tel:` link has `target='_blank'`, which opens an empty tab in desktop browsers                                    | drop `target`                                                                                                  |
| `home/MapPhoneLinks.jsx:29`                          | Apple Maps link is `http://`                                                                                           | `https://maps.apple.com/…`                                                                                     |
| `home/MapPhoneLinks.jsx:20` vs `TitleAddress.jsx:28` | the map query leaves out the state; the copied address includes it                                                     | add `slic.address.state` and `encodeURIComponent` the query                                                    |
| `app/globals.css:76`                                 | editor placeholder `#adb5bd` on the light comment surface is **1.91:1**                                                | `color: var(--mui-palette-text-secondary)`                                                                     |
| `comments/CommentFooter.jsx:77-108`                  | the delete confirm is a bare `Dialog` + `Box` with no `DialogTitle`, so the dialog has no accessible name              | rebuild it on `DialogTitle`/`DialogContent`/`DialogActions` like `profile/DeleteAccountDialog.jsx`, or see #45 |

### 34. The floating theme toggle covers content

- [x] **File:** `layout/ModeSwitch.jsx`. This takes over the `ModeSwitch` half of #21.

_Done 2026-10-07:_ `ModeSwitch` is now the "Dark mode" switch row in the menu (#50). The row
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

- [x] **Files:** `app/layout.jsx:29-33`, `theme.js`

_Done 2026-10-07:_ went with **dark header in dark mode**. Blue in both schemes would have
needed more retheming. The header and footer draw `text.light` (`#edf3fc` in dark), which
is 2.76:1 on dark mode's `#039be5`. That fails 3:1 for the menu icon and 4.5:1 for the
footer text. It would also put a bright blue slab in a dark cab at night.

- `theme.js` exports `statusBarColors`. Light is `primary.main`. Dark is computed
  the way MUI draws the dark AppBar: the paper with the elevation-4 white overlay, so
  `#1c1c1c` today. A sampled header pixel matches. Because it's computed, #56 can change
  the dark surfaces without the status bar drifting.
- `app/layout.jsx`'s `themeColor` is a light/dark media-query pair. `app/manifest.js` reads
  `statusBarColors.light`. A manifest can't vary by scheme, and the page's meta wins once
  it loads.
- The pinned case is handled by `layout/ThemeColorSync.jsx`, not `ModeSwitch`. `ModeSwitch`
  only mounts while the menu is open. `ThemeColorSync` is always mounted in the root layout.
  After hydration it sets every `theme-color` meta to the color of the scheme on screen.
  Until hydration, a pinned mode that differs from the OS shows the OS scheme's bar for a
  moment.
- Checked: OS light, OS dark, light OS pinned dark, and dark OS pinned light. The metas
  matched the header each time.

`layout.jsx` says _"The header AppBar is primary.main in both color schemes"_. That isn't
what renders. MUI's `AppBar` defaults to `enableColorOnDark: false`, so in dark mode the
header (and the footer, also an `AppBar`) draw as dark paper. The installed app still paints
the status bar the light scheme's blue (`#0172b5` since #31), so dark-mode drivers get a
blue strip above a dark grey header.

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

- [x] **File:** `layout/PageContainer.jsx:16`

_Done 2026-10-07:_ `px: { xs: 2, md: 4, lg: 6 }`. On the sign-in page at 390px the fields and
the Sign In button now sit 16px from each edge (they were 4px).

`px: { xs: 0.5, … }` is 4px. On the sign-in page at 390px, the email and password fields
and the Sign In button run edge to edge. Use `xs: 2` (16px), the standard phone gutter.

### 37. Dead space: 128px margins, a doubled `minHeight`, a 544px footer

- [x] **Files:** `layout/PageContainer.jsx:10-14`, `layout/Container.jsx`,
      `footer/FooterContainer.jsx:11`, `footer/Footer.jsx`, `layout/HomeButton.jsx`,
      `layout/BackButton.jsx`

_Done 2026-10-07:_ measured at 390×844.

|                        | before | after              |
| ---------------------- | ------ | ------------------ |
| landing: heading top   | 128px  | 80px               |
| landing: footer height | 544px  | 249px              |
| landing: page height   | 1277px | 844px (one screen) |
| privacy: page height   | 7481px | 7188px             |

The 1644px "before" below predates #24, which had already dropped the doubled `minHeight`.

- **Header offset:** an empty `<Toolbar />` spacer in `header/Header.jsx` clears the fixed
  header. It follows the toolbar's own responsive height (56px on phones, 64px on desktop)
  instead of a guess. `PageContainer` is `pt: 3, pb: 6`.
- **Footer:** `FooterContainer` is `AppBar component='footer' position='static'` with auto
  height. Before, it rendered as a second `<header>`, so pages had two banner landmarks.
  `Footer.jsx` is one column: 2rem social icons (48px targets), Privacy and Terms, the email
  line (a text button with a mail icon), and the copyright. The second logo is gone.
- **Home/Back:** both are in the page flow (`alignSelf: 'flex-start'`), as the first child
  of `PageContainer`. Admin, history and profile rendered them after the title, so they
  moved above it. `BackButton` uses `startIcon`. Pages with the button put their title at
  y=120 instead of 80. #52's header back arrow would win that row back.

Measured on the landing page at 390×844: the heading starts at y=128 and the sign-in form
ends near y=600. Then come ~500px of empty canvas and a **544px footer (34rem, 64% of the
screen)**. The page is 1644px tall for one form. Three causes:

- `my: 16` is 128px top **and** bottom, there to clear the fixed `AppBar`, which is 56px on
  phones.
- `PageContainer` has `minHeight: '100dvh'` and sits inside `Container`, which already has
  it. Every page is at least one screen tall _before_ the margins and footer are added.
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

- [x] **File:** `theme.js:84-110`, `layout/Container.jsx:17`

_Done 2026-10-07:_ the suggested scale, as written. At 390px: h1 36px, h2 and
`sectionHeading` 28px, h3 24px, h4 20.8px, h5 18.8px, h6 17.2px. "Privacy Policy" and "Terms
of Service" each fit on one line now.

- `sectionHeading` dropped the uppercase and the 800 weight, so titles show their source
  casing. Three titles were fixed for that: "Slics" → "SLICs" (admin), "New Slic" → "New
  SLIC", and "Slic History" → "SLIC History".
- The `Container` `fontSize: '1.6rem'` was already gone (#20).
- **Watch:** `h6` is also the SLIC code line on the lookup card (`home/TitleAddress.jsx`).
  That line goes from 22.4px to 17.2px, and the card's "Slic Details" h4 goes from 30.4px to
  20.8px. #40 rebuilds that card around the SLIC. Until then, check it on a phone.

At 390px, `h1` is 48px and `sectionHeading` is 41.6px, uppercase, weight 800.
"PRIVACY POLICY" wraps onto two lines, and the first panel starts ~200px down the screen.
All-caps at that size also reads as shouting (the accessibility guide: don't rely on
all-caps).

`responsiveFontSizes` (factor 2) shrinks a size _s_ rem to `1 + (s − 1) / 2` rem at the
smallest breakpoint, which matches both measurements above. Suggested desktop sizes and
what phones get:

|                           | now: desktop → phone           | suggested: desktop → phone     |
| ------------------------- | ------------------------------ | ------------------------------ |
| `h1`                      | 5rem → 48px                    | 3.5rem → 36px                  |
| `h2` / `sectionHeading`   | 4.2rem → 41.6px, uppercase 800 | 2.5rem → 28px, title case, 700 |
| `h3` / `h4` / `h5` / `h6` | 3.2 / 2.8 / 2.2 / 1.8rem       | 2 / 1.6 / 1.35 / 1.15rem       |

Also, `layout/Container.jsx:17` sets `fontSize: '1.6rem'` (25.6px) on the app root. It only
reaches bare text outside `Typography`, so it is either dead or a surprise; remove it. This
pairs with the still-open half of #20 (`fontSize` overrides).

_Blast radius:_ every heading. Do it in one pass, with screenshots before and after.

### 39. Load fewer font weights

- [x] **File:** `app/layout.jsx:13-18`

_Done 2026-10-07:_ `weight` is omitted. The page now declares one `100 900` face per subset,
and it downloads a single Latin woff2 that covers every weight.

Montserrat loads in 8 weights (200–900). The app renders 400, 500, 600, 700 and 800, so 200,
300 and 900 are never used. Drop those three. Better: omit `weight` entirely. Montserrat is
a variable font, so `next/font` then ships one file that covers every weight. That means
fewer bytes before the first text paints on a weak phone signal.

---

## Tier C — The lookup screen

_Tier C complete 2026-10-07 (#40–#46), in the soft / embossed style._

### 40. Put the SLIC first in the details card

- [x] **Files:** `home/SlicDetailsContainer.jsx`, `home/TitleAddress.jsx`

_Done 2026-10-07:_ built as sketched below.

- **Headline:** the alphaSlic for a center, the name for a customer (falling back to the
  alphaSlic if a customer has no name). It's an `h4` at weight 700, rendered as the card's
  `<h2>`, so heading navigation still lands on it.
- **Second line:** `SLIC 1809 · Bethlehem Center` for a center, `SLIC 1813 · ULNPA` for a
  customer. It's `body2` in `text.secondary`.
- **Type chip:** an outlined "Center" or "Customer" chip sits top right. A missing `type`
  counts as a center, as in the search.
- **Address:** left-aligned. The copy button sits in the row instead of being absolutely
  positioned, and it has `aria-label='Copy address'`. The comment chip follows the address.
- **Container:** `SlicDetailsContainer` lost its title prop. The loading state is a spinner
  labelled "Loading SLIC" until #43's skeletons.
- **Checked:** both card types, in light and dark at 390px, through a temporary local
  preview page. Signed-out headless Chrome can't reach `/home`. The map and PDF buttons
  under the card are still centered; #41 replaces them.

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

- [x] **Files:** `home/MapPhoneLinks.jsx`, `home/PdfLink.jsx`, `home/SlicDisplay.jsx`

_Done 2026-10-07:_ `home/SlicActions.jsx` replaces `MapPhoneLinks.jsx` and `PdfLink.jsx`.
`SlicDisplay` and `slicPage/Title.jsx` both render it.

- **Navigate:** a contained, full-width button, 52px tall. It's built with `mapsHref`. On
  non-Apple devices it reads "Navigate … Google Maps". On Apple devices a ▾ segment opens
  a menu with Google Maps and Apple Maps. The choice is stored as `slics-maps-app` in
  localStorage, wrapped in try/catch like the install nudge, and read after mount. An
  `apple` value is only honored on an Apple device.
- **Call, PDF, Tips:** outlined buttons with the icon over the label, sharing the row, 65px
  tall.
  - Call shows for a center with a phone, and its name is "Call BETPA dispatch".
  - PDF is hidden when there's none. The link comes from the new `slicPdfHref` in
    `constants.js`, which keeps the legacy Supabase fallback.
  - Tips scrolls to the comments and carries the count as a badge. It replaces the comment
    chip from #40. The `/home/[slic]` page has no comments section, so it leaves Tips off.
- **Checked:** at 390px through a temporary local preview page, with Android and iPhone
  user agents, in light and dark. The menu, the stored choice surviving a reload, and the
  Tips scroll all work.

There are up to four full-weight contained buttons stacked vertically: Google Maps, Apple
Maps, Dispatch and View PDF. All have the same color and size, and "View PDF" shows
_disabled_ when there is no PDF. A driver's next step is almost always "navigate", so make
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

- [x] **File:** `home/SlicsSearch.jsx`

_Done 2026-10-07:_ all four upgrades, in the soft style. The search is a raised pill in the
panel surface that presses in with a primary glow on focus, with a search icon and a
placeholder ("SLIC, code or name") in place of a floating label.

1. **Recent:** `openOnFocus` shows this device's last six lookups under "Recent", then "All
   SLICs". The list is `lib/recentLookups.js`, a separate module rather than an extension
   of `recordLookup`; `home/Main.jsx` records it. While typing, the list is matches only,
   ungrouped.
2. **Options:** each one shows the alpha code or name in bold, a line like `SLIC 1809 ·
   Easton` (customers add their code), and a hub or storefront icon. The match is
   highlighted in primary, by a small local `Highlight`. Matching covers the number, code,
   name and city.
3. **Enter:** `autoHighlight`, so Enter takes the top match.
4. **Donation notice:** it closes, and closing snoozes it for 30 days (localStorage, like
   the install nudge).

Also: a pick shows its SLIC at once from the in-memory list (#43). The URL follows through
`router.push`.

The search is an `Autocomplete` over plain strings. Upgrades, in order of value:

1. **Recent lookups on focus.** With `openOnFocus`, show the last ~5 SLICs this device
   looked up first, under a "Recent" group header (`groupBy`). Drivers run the same routes,
   so this turns most lookups into one tap. For storage, extend `recordLookup` in
   `lib/commentPrompt.js` into a small `recentLookups` list using the same try/catch
   localStorage pattern.
2. **Richer options** via `renderOption`:
   - two lines: alphaSlic or name in bold, then `SLIC 1809 · Easton` in `text.secondary`;
   - a Center/Customer icon;
   - the matched characters in bold, via a 10-line highlighter or `autosuggest-highlight`
     (what MUI's own docs use).
3. **`autoHighlight`,** so Enter picks the top match.
4. **Move the donation `Alert`.** It renders _above_ the search for every non-member with at
   least one lookup, pushing the input down on every visit. Move it below the details card,
   or give it the same 30-day snooze as `InstallNudge`.

### 43. Skeletons instead of "Loading..."

- [x] **Files:** `app/loading.jsx`, `layout/LoadingFallback.jsx`, `home/SlicDisplay.jsx`,
      `comments/Comment.jsx`, plus the `covers/` and admin loaders (8 files contain a
      "Loading..." string)

_Done 2026-10-07:_ no "Loading..." text is left in the app. Every skeleton is in the soft
style.

- **Lookup card:** `home/SlicCardSkeleton.jsx`, shaped like the real card: title and
  subline with the type pill, the address well, Navigate, and three tiles.
- **Tips:** two tip-card skeletons (`comments/Comments.jsx`). "Loading comment..." was
  already gone with #45.
- **Pages:** `layout/LoadingFallback.jsx` is a title bar and a panel of soft blocks. The
  route loaders (`app/loading.jsx`, `covers/`, `admin/cover/drivers/`) and the covers
  Suspense fallback render it.
- **Cover bids admin:** row skeletons.
- **Instant pick:** picking a SLIC shows it at once from the in-memory list
  (`home/Main.jsx` `showSlic`). The comment count waits until the URL matches, so the Tips
  badge never shows the previous SLIC's count.

The waiting states today:

- the route loader is an h2 "Loading..." with a 5rem spinner;
- the details panel shows "Loading..." in a 24rem box;
- each comment shows "Loading comment..." while its author loads.

MUI's `<Skeleton>` (already installed), shaped like the real content, keeps the layout from
jumping and feels faster. Two shapes cover it: a details-card skeleton (title bar, two
address lines, one button) and two or three comment-card skeletons.

While you're there: the SLIC details come from the in-memory `slics` array, so the
"loading" between SLICs is only the `router.push` transition, not a fetch. `SlicDisplay` can
render the new SLIC immediately and show skeletons only for the comments list, which _is_
fetched.

### 44. A useful empty state on `/home` (and delete the dead carousel)

- [x] **Files:** `home/EmptySlic.jsx`, `home/EmblaCarousel.jsx`, `app/globals.css:83-217`,
      `package.json`

_Done 2026-10-07:_ `home/EmptySlic.jsx` is now the one empty state, and `MemberDisplay.jsx`
is gone. It follows the suggested order, in the soft style:

1. **Recent lookups:** raised chips with a hub or storefront icon. Each opens
   `/home?slic=`.
2. **A tip:** one-line, in an inset well, picked at random from four.
3. **Support:** a quiet last line. Members see a thanks and a "Your lookup history" link;
   everyone else sees "Buy me a coffee".

The first visit on a device has no recents, so it shows a "Look up a SLIC" intro instead.
The dead carousel, its CSS and the `embla-carousel-react` dependency were already gone
before this item.

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

_Done 2026-10-07,_ together with an engagement pass. The section is now "Driver tips".

- **Votes:** toggles with `aria-pressed`. A filled thumb in `primary` means it's your vote;
  tap it again to take it back (`voteType: null`). They're never disabled, and the targets
  are 40px. Votes update optimistically and don't re-sort the list under your thumb.
- **Dates:** relative ("3 hours ago", dayjs `relativeTime`), in a `<time>` with the full
  date as its `title`, plus "· edited" after an edit.
- **Delete:** kept the confirm dialog, by choice, now titled "Delete this tip?". A
  top-level tip with replies becomes a "Comment deleted" placeholder.
- **Replies:** one level deep, like Whip It In & Out. A reply to a reply joins the thread.
- **Editing:** owners (and admins) edit in place.
- **Plain text:** tips are plain text now, and Tiptap is removed. Old HTML comments still
  render, and editing one converts it to text (`comments/CommentContent.jsx`).
- **Engagement:**
  - An always-visible "Share a tip about BETPA" box replaces the corner + icon. The
    disabled "coming soon" image button is gone too.
  - Topic chips (Gate / guard, Parking, Dock / door, Hours, Contact, Heads-up) start a tip
    with "Parking: ".
  - A Top/Newest sort.
  - "New" marks with a brand-colored edge on tips posted since this device last showed the
    SLIC's tips. The Tips button's badge turns red and shows the new count until the tips
    scroll into view.
  - A warmer empty state, and a "Thanks! Your tip is posted." snackbar.
- **Checked:** at 390px in light and dark, through a stubbed local preview. Read-only
  against the real data: all 44 existing comments on 37 SLICs come through in their
  threads, with authors.

- [x] **Files:** `comments/CommentHeader.jsx`, `comments/CommentFooter.jsx`,
      `comments/Comment.jsx`

- **Vote state.** After you upvote, the up button becomes _disabled_, and grey is the only
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
- **Allow replies** — show a reply button on each comment, and nest replies under their parent. Consider a collapsible thread for long discussions.
- **Users can edit their own comments.** Show an edit button on each comment that belongs to the current user, allowing inline editing with proper save/cancel actions.

### 46. History rows should go somewhere

- [x] **File:** `app/history/page.jsx`

_Done 2026-10-07,_ as part of the History page rework (TODOS.md):

- **Rows:** each one is a `next/link` to `/home?slic=<numSlic>`.
- **Day groups:** "Today", "Yesterday", "Fri, Oct 2", with the year added for past years.
  They're computed in the phone's time zone, behind `HydrationGuard`.
- **Log:** the `console.log(session)` is gone.
- **The rework itself:**
  - The page now lives in `app/components/history/`.
  - Search covers code, name, address and note. There are date presets plus a custom
    range, Centers/Customers and With-notes filters, and Newest/Oldest sort.
  - Paging is cursor-based through `GET /api/user/history`, with "Load more".
  - Each row has a private note and a "Remove from history" with Undo
    (`PATCH /api/user/history/[id]`).
  - Removing only hides the row (`hidden: true`), so the /home lookup counter still counts
    it.

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

- [x] **Files:** `app/globals.css`, `theme.js`

_Done 2026-10-07:_ all three.

1. **Smooth scroll:** it's inside `prefers-reduced-motion: no-preference`.
2. **Reduced-motion floor:** one global rule. It sets animation and transition durations
   to 0.01ms, iteration count to 1, and turns off every `::view-transition-*` animation.
   It also stills MUI spinners and skeleton shimmer for those users, which is intended.
3. **Easing tokens:** `--ease-out` (`cubic-bezier(0.2, 0.8, 0.2, 1)`) and `--ease-spring`
   (a damped `linear()` spring with about 7% overshoot) are set on `:root`. The theme
   mirrors them as `theme.transitions.easing.out` and `.spring` for `sx` and
   `transitions.create()`. Durations stay MUI's.

1. `html { scroll-behavior: smooth }` (`globals.css:11`) is unconditional. Wrap it in
   `@media (prefers-reduced-motion: no-preference)`.
2. Add one global reduced-motion floor, so later animations can't forget it:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *,
     ::before,
     ::after {
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

- [x] **File:** `home/Main.jsx`

_Done 2026-10-07._

- **One path:** every change of the SLIC on screen goes through `changeSlic` in
  `home/Main.jsx`. That covers a search pick (`showSlic`) and the URL (recent chips,
  Back/Forward, links).
- **The wrapper:** a real change runs inside `withViewTransition` (`lib/viewTransition.js`),
  which is `document.startViewTransition(() => flushSync(update))`. It falls back to a
  plain update without support or under reduced motion.
- **What animates:** the lookup card, `SlicCardSkeleton` and `EmptySlic` all carry
  `viewTransitionName: 'slic-details'`, since only one renders at a time. The card
  cross-fades in 200ms while its box morphs to the new height in 250ms, both on
  `--ease-out`.
- **What doesn't:** the page itself isn't captured (`:root { view-transition-name: none }`),
  so the search and everything else stay live.
- **Skipped cases:** the first render after the skeleton applies instantly, and so does
  the URL catching up to a pick. Those are compared by `numSlic`, because a navigation
  hands back fresh objects.
- **Checked in headless Chrome:**
  - No animation on first load.
  - One per pick, even after `router.push` lands.
  - Back animates.
  - Reduced motion switches with none.
  - Focus stays in the search, and the search label settles on the new SLIC.

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

**Not recommended yet:** React's `<ViewTransition>` component. It needs
`experimental.viewTransition`, and that flag switches the whole app to React's
_experimental_ release channel (`next/dist/lib/needs-experimental-react.js`). That's not for
a production app. Revisit when it ships in stable React.

_Checked 2026-10-07:_ this still holds on Next 15.5.27 (SECURITY.md #3). The plan above
doesn't depend on the Next version. `home/Main.jsx` now has `showSlic` (#43): one
synchronous `setSlic` from the in-memory list, which is the exact update to wrap in
`startViewTransition`. The `router.push` that follows doesn't re-render the card, because
the URL effect lands on the same SLIC.

### 49. Entry animations for cards and new comments

- [x] **Files:** `app/globals.css` (or a `MuiPaper` variant), `comments/Comment.jsx`

_Done 2026-10-08,_ all three, in CSS.

- **`.enter`** (`app/globals.css`): an `@starting-style` fade with an 8px lift, 250ms on
  `--ease-out`, delayed by `--i` × 40ms (capped at 8).
  - It's on the lookup card (`SlicDetailsContainer`) and each top-level tip card, with
    `--i` set to the card's list index.
  - It plays only when an element first renders. A re-sort, a vote or a refetch with the
    same keys doesn't replay it.
  - `.MuiPaper-root.enter` outranks the box-shadow-only transition MUI puts on every
    Paper. Without that, the card silently skipped the animation.
- **Just posted:** the composer passes the new id to `onPosted`, and `Comments` marks it
  `justPosted` for 2s. That tip or reply gets `.just-posted`, a brand-blue `::after` tint
  (16% → 0 over 1.8s), and scrolls itself into view (`block: 'nearest'`; instant under
  reduced motion). In Top order a brand-new tip can sort below the fold.
- **Reduced motion:** the #47 floor makes all of it instant.
- **Checked in headless Chrome:**
  - The card's computed transition is opacity and translate.
  - Tip delays are 0, 40 and 80ms.
  - After posting, the new tip has the tint at 0.16 opacity and sits in view, and the mark
    clears after about 2s.

`@starting-style` gives an element an entry transition in plain CSS (the
`animate-element-entry-exit` guide; Baseline since 2024-08). Good candidates:

- the details card;
- each comment card as the list loads, staggered with `transition-delay: calc(var(--i) * 40ms)`;
- a just-posted comment, which gets a brief `primary` background tint that fades out and
  shows the driver where it landed.

```css
.enter {
  transition:
    opacity 0.25s var(--ease-out),
    translate 0.25s var(--ease-out);
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

1. _Lookup · All Hubs · History · Cover Bids_
2. _Profile · About · Install_
3. _UPSers · Socks · Buy me a Coffee_ (external, each with an "opens in new tab" icon)
4. _Dark mode_ switch (#34) and _Sign out_

Mark the current route with `selected` (from `usePathname`). A `SwipeableDrawer` adds
swipe-to-close.

On phones, the comment prompt and the iOS install steps should be **bottom sheets**: a
`Dialog` with `TransitionComponent={Slide}` (`direction='up'`), and `sx` pinning the paper to
the bottom edge with rounded top corners. The buttons land in thumb reach, and the motion
says "this came up from below".

_Done 2026-10-07:_ the menu, the comment prompt and the iOS install steps. The two sheets
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

- [x] **Files:** `home/TitleAddress.jsx`, `comments/CommentHeader.jsx`

_Done 2026-10-08,_ all three. `CommentHeader.jsx` no longer exists; the votes live in
`comments/Comment.jsx`.

- **Copy address:** the Snackbar and its `setTimeout(3000)` are gone.
  - On success the button's icon becomes a green `Check`; on failure, a red `ErrorOutline`.
    Either pops in, then reverts after 1.5s.
  - A visually hidden `role='status' aria-live='polite'` region says "Address copied" or
    "Couldn't copy the address".
- **Vote:** a new global `.pop` class (`app/globals.css`) springs an icon up from 60% on
  `--ease-spring`. A cast vote's filled thumb gets it only on the tap (`popped` state),
  never on load.
- **Haptics:** `tapHaptic()` in `lib/haptics.js` gives a 10ms `navigator.vibrate`
  on copy and vote. It's feature-detected (Android only), skipped under reduced motion, and
  wrapped in try/catch.
- **Checked in headless Chrome, with clipboard permission granted:**
  - The icon goes Copy → Check (`pop`) → Copy after 1.5s.
  - The live region says "Address copied", and the clipboard holds the full address with
    the state.
  - No snackbar appears.
  - No thumb pops on load; voting on a tip pops only that thumb (`animation-name: pop`).

- **Copy address.** Today it opens a Snackbar and runs a separate `setTimeout(3000)`, which
  fights the theme's 6000ms auto-hide. Instead, swap the copy icon for a check for about
  1.5s (`ContentCopy` → `Check`, cross-faded) and announce "Address copied" through a polite
  live region. No toast covering the search.
- **Vote.** Add a small scale pop on the thumb using `--ease-spring` (#47).
- **Haptics (optional).** Call `navigator.vibrate?.(10)` on copy and vote. Only Android
  supports it (iOS Safari doesn't implement it), so feature-detect and never rely on it.

### 52. A header that does more

- [x] **Files:** `header/Header.jsx`, `layout/HomeButton.jsx`, `layout/BackButton.jsx`

_Done 2026-10-07,_ except the bottom navigation, which is left for a separate decision.
`header/HeaderBar.jsx` is the client header, and `Header.jsx` stays the server wrapper that
reads the session.

- **Logo:** a link to `/home` when signed in, `/` otherwise, labelled "SLICs home".
- **Back arrow and page name:** any path in `PAGE_TITLES` shows a back arrow and its page
  name next to the menu. Matching is by longest prefix, for example `/admin/cover/jobs` →
  "Cover Jobs".
  - The arrow goes back only when the previous page was in the app: a module-level count
    of in-app navigations. Otherwise it goes home, so a cold start or a shared link never
    leaves the app.
  - `HomeButton` and `BackButton` are deleted, along with their uses on 20 pages.
- **Shadow on scroll:** `useScrollTrigger`. The header has `elevation={0}` and is flat at
  the top, then gets the soft `raised` shadow once content scrolls under it.
  - In dark mode that means no elevation overlay, so the header is plain `night`, seamless
    with the page.
  - `statusBarColors.dark` is now `night`.
- **Checked in headless Chrome, both schemes:**
  - `/` has no arrow.
  - A cold `/privacy` shows "Privacy Policy" and a logo linking to `/`. The header is flat
    at the top and shadowed after scrolling, and back goes to `/`.
  - Back after an in-app push to `/terms` returns to `/privacy`.
- **Not done:** `BottomNavigation`. It changes how drivers navigate and needs safe-area
  CSS. Decide it on its own.

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

- [x] **Files:** `theme.js`, plus roughly two dozen internal `href`s on MUI components
      (e.g. `header/UserMenu.jsx` ×5, `admin/page.jsx` ×6, `signIn/Membership.jsx`,
      `layout/RedirectMessage.jsx`, `not-found.jsx`)

_Done 2026-10-08,_ in the theme, with a progress bar for the wait.

- **The default:** `MuiButtonBase` gets `LinkComponent: NextLink` and `MuiLink` gets
  `component: NextLink`, so every `href` on a Button, IconButton, ListItemButton or Link
  navigates client-side. External, `mailto:` and `tel:` links still open as before.
- **The opt-out:** `app/error.jsx` keeps a full reload on "Go to Home"
  (`LinkComponent='a'`), because after a crash a fresh document is the surest way back.
- **The wait:** `header/NavigationProgress.jsx` is a thin bar along the bottom of the header.
  It starts on a tap of an internal link, appears only after 150ms (so a prefetched page
  never flashes it), and stops when the URL changes or after 15s. It listens for clicks
  instead of using `useLinkStatus`, so one component covers every link in the app.
  `router.push` navigations don't show it.
- **The menu:** each drawer row closes the drawer on the tap itself, so the drawer is out of
  the way while the page loads. A tap on the page that's already open also closes it.
- **The blast radius:** the header is rendered once, in the root layout, and a client-side
  navigation doesn't re-render it. Pages still get fresh server data, because Next 15
  doesn't cache dynamic pages on the client, but the header's menu keeps the session it
  loaded with. The case that matters is membership. The Buy Me a Coffee page opens in a new
  tab, so `signIn/RefreshOnReturn.jsx` on the membership screen calls `router.refresh()`
  when the driver comes back to the tab. That re-renders the layout too, so "My History"
  appears without a reload. A role or membership change made by an admin still shows in
  the header on the next full load. Sign-in and sign-out set cookies, which already makes
  Next refetch the whole tree.
- **Checked in headless Chrome, signed out:** the footer links, the `Privacy Policy` link in
  the terms text and the menu rows all navigate in the same document. The bar shows on a
  slow route and is gone once the page is in. A tap on a protected page while signed out
  still ends at `/signin` with a full load, from the middleware redirect, the same as
  before.

A MUI `Button`, `IconButton` or `ListItemButton` with an `href` renders a plain `<a>`. Every
menu tap therefore reloads the whole document: the header, theme and session re-initialize
and the screen flashes. Only a handful of call sites pass `LinkComponent={Link}` (e.g.
`home/MemberDisplay.jsx`). Set it once in the theme:

```js
import NextLink from 'next/link';
// …
components: {
  MuiButtonBase: {
    defaultProps: {
      LinkComponent: NextLink;
    }
  }
}
```

External `https://…` links still work through `next/link`. With client-side navigation in
place, add feedback for the wait: Next 15.3's `useLinkStatus` can drive a thin progress bar
under the toolbar while a route loads.

_Blast radius:_ every internal link becomes a client-side navigation. That's faster, but
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
      #31 set `theme_color` to `#0172b5`. Revisit it once #35 is decided.

### 56. Dark surfaces with depth

_Done 2026-10-07,_ as part of the seamless soft style, and differently than suggested.
There is one lifted dark surface, `tokens.night` `#15181c`, for the page, panels, comment
surface and overlays. There isn't a three-step ladder: the soft shadow pairs supply the
depth.

- Every text color stays at least 4.5:1 on `night`: white 17.8, `text.secondary` 9.2, primary
  `#039be5` 5.8, error 4.8.
- The dark header and footer lift with it, and the status bar follows
  (`statusBarColors.dark` is computed from `night`).
- OLED pure-black is given up for depth.

- [x] **File:** `theme.js` (`tokens`). Dark mode uses `#050505` for both the page and
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
