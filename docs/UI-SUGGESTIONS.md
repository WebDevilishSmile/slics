# THEME.md

A punch list for making the app's look-and-feel controllable from one place. Companion to
`SUGGESTIONS.md` — that file tracks security/perf/quality; this one tracks styling.

**How to use this:** every item is independent unless it says `Depends on:`. Pick one,
do it, check the box. Each item states its *blast radius* so you can judge risk before
starting.

**Before shipping any item:** there is no test suite in this repo. Run `npm run build`,
then click through the affected screens in **both light and dark mode**. The app is used
daily in production.

---

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

## Verification

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
