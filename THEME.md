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

- [ ] **Files:** `app/components/comments/Comment.jsx:37`,
  `app/components/comments/CommentEditor.jsx:89, 101`

These branch on `mode === 'light'`, but MUI's `mode` has three states — `'light'`,
`'dark'`, and `'system'`. A user on **system-light** falls to the else branch and gets the
**dark** hex. The hardcoded values also duplicate `background.comment`, which the very
same elements already set via `sx` two lines below (`Comment.jsx:45`,
`CommentEditor.jsx:120`).

**Fix that keeps Tailwind and keeps tiptap working.** `utils/theme.js` sets
`cssVariables: { colorSchemeSelector: 'class' }`, so MUI already emits
`--mui-palette-background-comment` and redefines it under the dark class. A plain CSS
class reading that variable follows the color scheme with **zero JS branching**, and
tiptap keeps its `class` attribute:

```css
/* globals.css */
.comment-surface {
  background: var(--mui-palette-background-comment);
  border-color: var(--mui-palette-background-comment);
}
```

Tailwind stays installed. The tiptap layout utilities on `CommentEditor.jsx:88`
(`max-h-48 min-h-[10rem] text-base w-full border-none py-4 px-4 focus:outline-none`) are
untouched — only the four arbitrary-value color classes go away. `useColorScheme()` can
then be dropped from both components.

*Caveat:* confirm in the running app that the variable is defined where tiptap renders
before deleting the JS branch.

*Blast radius:* comment editor and comment cards, both schemes.

### 5. Code blocks in comments are invisible in light mode

- [ ] **File:** `app/globals.css:46, 51, 53` (also `:66, :73`)

The tiptap styles reference CSS variables that are **never defined anywhere**:
`--black`, `--white`, `--gray-2`, `--gray-3`. A `<pre>` therefore gets
`background: var(--black)` → undefined → transparent, with `color: var(--white)` →
undefined → inherited. Any comment containing a code block is unreadable in light mode.

These were copy-pasted from the tiptap starter template. Replace with palette tokens
(`var(--mui-palette-text-primary)` etc.) or delete the rules.

*Blast radius:* only comments containing code blocks.

### 6. Theme toggle is asymmetric

- [ ] **File:** `app/components/layout/ModeSwitch.jsx:13-24`

The second `if` is missing `else`, so the two `system` branches behave differently: in
system+light it sets `'dark'` and then re-evaluates against the stale `mode`. Rewrite as a
single expression over `colorScheme`.

*Blast radius:* the toggle button only.

---

## Tier 1 — Named token block

The core change: one place to edit colors.

### 7. Introduce a `tokens` object at the top of `utils/theme.js`

- [ ] **File:** `utils/theme.js`

Today the dark scheme redefines colors by **copy-pasting hex values** — `#050505`,
`#edf3fc` and `#222222` each appear in both the light `palette` and
`colorSchemes.dark.palette`. Lift them into a single named block at the top that both
schemes read from:

```js
const tokens = {
  brand:   lightBlue,
  ink:     '#222222',
  paper:   '#edf3fc',
  void:    '#050505',
  comment: '#eaf8fe',
};
```

Change a brand color once and both schemes follow. Keeps the existing two-scheme structure
and all current key names, so no call sites change.

*Blast radius:* intended to be a pure refactor with zero visual change — verify by
comparing rendered colors before and after.

### 8. Prune or wire up the dead palette keys

- [ ] **File:** `utils/theme.js`

Verified zero references across `app/`:

| Key | Defined at | Uses |
|---|---|---|
| `palette.containedButton` | `:42-45` | 0 |
| `background.solid` | `:50`, `:22` (dark) | 0 |
| `background.grey` | `:51`, `:23` (dark) | 0 |
| `text.solid` | `:58`, `:28` (dark) | 0 |
| `text.dark` | `:55`, `:27` (dark) | 0 |

`palette.secondary` also diverges between schemes (`orange` light, `green` dark) and is
never referenced. Decide per key: delete, or adopt — `containedButton` is a natural home
for the button style in item 26.

Note `background.opposite` / `text.opposite` **are** load-bearing, but have exactly one
consumer each (`ModeSwitch.jsx`). `background.comment` has two (`Comment.jsx:45`,
`CommentEditor.jsx:120`).

*Blast radius:* none if truly unused — re-run the grep in Verification before deleting.

### 9. Correct the palette claim in `CLAUDE.md`

- [ ] **File:** `CLAUDE.md`

It states that `background.solid`, `text.dark` and `text.solid` are "used throughout" and
should be reused instead of hardcoding hex. Per item 8 they have **zero** uses. Fix so the
doc stops sending people toward dead keys.

### 10. Delete the shadow palette

- [ ] **Files:** `app/globals.css:5-15`, `tailwind.config.mjs:10-13`

`globals.css` defines a full second palette — `--foreground`, `--background`, `--primary`,
`--secondary`, `--accent`, `--error`, `--warning`, `--info`, `--success` — that is
**referenced nowhere** and whose values *conflict* with the real theme (`--primary:
#0070f3` vs the actual `lightBlue[600]` = `#039be5`). The Tailwind
`colors: { background, foreground }` extension that maps to them is equally unused:
`bg-background`, `text-foreground`, `bg-foreground` and `text-background` appear nowhere.

Removing both eliminates a false second source of truth for anyone trying to restyle the
app. **This does not remove Tailwind** — only the unused color mapping.

Also worth noting: `tailwind.config.mjs` scans `./pages` and `./components`, neither of
which exists at the repo root, so two of its three content globs are dead.

*Blast radius:* none — all provably unreferenced.

### 11. Fold layout constants into the theme

- [ ] **Files:** `utils/variables.js`, `utils/theme.js`

`variables.js` mixes UI tokens with domain constants. Move `ELEVATION`, `MAX_WIDTH`,
`MIN_HEIGHT` and `BORDER_RADIUS` into the theme (`shape.borderRadius` plus a custom
`theme.layout` namespace); leave `SLICS_PER_PAGE` and `COVER_BID_MONTHS_BACK` where they
are.

`BORDER_RADIUS` (`'6px'`) is **dead** — zero imports — and has already drifted: components
use `'8px'` (×2), the theme uses `'1.5rem'` for buttons, and `'50%'` appears 7×. Three
uncoordinated radius values.

---

## Tier 2 — Component defaults

Each is a few lines in `theme.components`.

> **Applies to all of Tier 2:** an explicit prop at a call site still beats a theme
> default. These reduce *future* repetition, but produce no immediate visual change until
> the call sites are also cleaned up. Do each alongside its call-site pass, or expect
> nothing to look different.

### 12. `MuiPaper.defaultProps.elevation = 6`

- [ ] 9 sites pass `elevation={ELEVATION}`: `comments/CommentsContainer.jsx:45`,
  `comments/NoSlicComments.jsx:7`, `home/EmptySlic.jsx:13`, `home/MemberDisplay.jsx:8`,
  `home/SlicDetailsContainer.jsx:7`, `profile/ProfileComments.jsx:19`,
  `profile/ProfileImage.jsx:8`, `admin/user-page/UserComments.jsx:44`,
  `app/history/page.jsx:89`.

  7 further call sites bypass the constant entirely with literal `elevation={3}`, `{1}`,
  `{0}` — worth reconciling at the same time.

### 13. `MuiTextField.defaultProps = { size: 'small', fullWidth: true }`

- [ ] `size='small'` appears 59× and `fullWidth` 28×. Densest:
  `signIn/EmailAuth.jsx` (7), `admin/coverBidJobs/CoverBidJobEditCard.jsx` (6),
  `bids/BidsFilters.jsx` (4). Note a second cluster in
  `admin/coverBidJobs/CoverBidJobRowCells.jsx` uses `variant='standard'` — check it
  doesn't regress.

### 14. `MuiChip.defaultProps.size = 'small'`

- [ ] 5 sites, all day-of-week chips: `bids/BidsJobCard.jsx:87`, `bids/BidsTable.jsx:71`,
  `coverBidJobs/CoverBidJobCard.jsx:59`, `coverBidJobs/CoverBidJobDetailDialog.jsx:60`,
  `coverBidJobs/CoverBidJobsTable.jsx:38`. They also share `sx={{ fontWeight: 600 }}` — a
  shared `DayChip` component would absorb both that and `DAY_COLORS`.

### 15. `MuiCard.defaultProps.variant = 'outlined'`

- [ ] 3 of the 4 `Card` uses: `admin/coverBidJobs/CoverBidJobEditCard.jsx:8`,
  `bids/BidsJobCard.jsx:50`, `coverBidJobs/CoverBidJobCard.jsx:22`.

### 16. `MuiSnackbar.defaultProps` for `autoHideDuration` + `anchorOrigin`

- [ ] Four identical `autoHideDuration={6000}` + top/center configs:
  `admin/slics/SlicOptions.jsx:199`, `home/TitleAddress.jsx:92`,
  `newSlic/FormActions.jsx:121`, `profile/ProfileData.jsx:124`. Two near-misses at 3000ms
  (`drivers/editDriver/EditDriverField.jsx:129`) and 4000ms
  (`profile/CommentDelete.jsx:87`) — decide whether those are deliberate.

---

## Tier 3 — Absorb repeated blocks

### 17. A `panel` variant for `Paper`

- [ ] **Highest-value item in this tier.** This block is near-verbatim in 6 files:

```js
width: '100%', maxWidth: MAX_WIDTH, minHeight: MIN_HEIGHT,
display: 'flex', flexDirection: 'column', alignItems: 'center',
mt: '2rem', py: '2rem', px: '1rem'
```

`comments/CommentsContainer.jsx`, `comments/NoSlicComments.jsx`, `home/EmptySlic.jsx`,
`home/MemberDisplay.jsx`, `home/SlicDetailsContainer.jsx`, `profile/ProfileComments.jsx`.
Minor drift between them (`px` is `'2rem'` in one, `justifyContent` present in another) —
reconcile deliberately rather than preserving each variation.

*Blast radius:* six of the app's most visible surfaces. Check each in both schemes.

### 18. A `sectionHeading` typography variant

- [ ] Replaces `app/components/layout/StyledHeading.jsx`, imported by **17** files. Moves
  the style from a component wrapper into the theme, so heading style becomes a theme
  edit. (Note its `fontWeight: '800'` is a string; the rest of the codebase uses numbers.)

### 19. Name the width scale

- [ ] `MAX_WIDTH` (`'32rem'`, 16 importers) is one of about ten unnamed widths:
  `'30rem'` ×10 (form fields), `'40rem'` ×5 (prose), `'55rem'` ×4 (wide pages), plus
  `'52rem'`, `'50rem'`, `'45rem'`, `'22rem'`, `'12rem'`, `'600px'` ×2, `'1436px'`.

  Naming these (`form` / `prose` / `wide` / `panel`) covers far more surface than
  `MAX_WIDTH` does today. Also: `admin/comments/CommentsSection.jsx:9` hardcodes
  `maxWidth: '32rem'` instead of importing the constant.

### 20. Pick one spacing dialect

- [ ] **Largest item on this list — scope it to one folder at a time.**

  Two systems run side by side. `theme.spacing` is never configured, so it defaults to 8px,
  which means `mt: 2` and `mt: '1rem'` are **the same value written two ways** — used 10×
  and 19× respectively.

  String rems dominate: `'1rem'` appears 109× and `'2rem'` 85× across all properties.
  Top repeats: `mt:'2rem'` ×30, `mb:'1rem'` ×20, `mt:'1rem'` ×19, `px:'1rem'` ×18,
  `gap:'1rem'` ×17.

  Also in scope: ~20 `fontSize` overrides in `sx` that bypass the typography scale
  entirely.

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
  color as a prop, so this is half-done already. Good candidate for the otherwise-unused
  `palette.containedButton` key (item 8).

  Note these use literal `'black'` while the theme defines `text.dark`/`text.solid` as
  `#222222` — a real, if subtle, inconsistency.

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

**Re-run before acting on items 8, 10, 22 and 23** — all should return nothing:

```bash
grep -rn "containedButton\|background\.solid\|background\.grey\|text\.solid" app/
grep -rn "StyledPage\|layout/Wrapper" app/ --include=*.jsx | grep -i import
grep -rn "bg-background\|text-foreground\|bg-foreground\|text-background" app/
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
