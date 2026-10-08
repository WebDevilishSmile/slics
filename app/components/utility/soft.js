// sx helpers for the app's soft, embossed look. The shadows live in
// `theme.soft` (utils/theme.js), one per color scheme. The style is seamless:
// the page, the `panel` Paper variant, the themed dialogs, menus and drawer,
// and every soft element share one surface, `background.default` with no
// overlay. Only light and shadow tell them apart: no borders, no Paper
// elevation. That means these work on the page itself as well as in a panel.
//
// In a server component, call a helper with the imported theme
// (`sx={softRaised(theme)}`, theme from '@/utils/theme'): a function can't be
// passed to MUI's client components, but what it returns is a plain object.

export const softSurface = (theme) => ({
  backgroundColor: theme.vars.palette.background.default,
  backgroundImage: 'none',
});
const surface = softSurface;

const shadow = (theme, kind) => ({
  boxShadow: theme.soft[kind].light,
  ...theme.applyStyles('dark', { boxShadow: theme.soft[kind].dark }),
});

// A card that stands up out of the panel (a tip).
export const softRaised = (theme) => ({ ...surface(theme), ...shadow(theme, 'raised') });

// A small raised control (topic chips, the selected sort option).
export const softRaisedSmall = (theme) => ({
  ...surface(theme),
  ...shadow(theme, 'raisedSmall'),
});

// A well pressed into the surface (replies, text boxes, a pressed button).
export const softInset = (theme) => ({ ...surface(theme), ...shadow(theme, 'inset') });

// A focused field: the well pressed a little deeper, with a hairline of
// brand blue inside its edge. No outer ring: a glow around the well read as a
// halo, but focus still has to show (WCAG 2.4.7), so the edge carries it.
export const softFocus = (theme) => {
  const edge = `inset 0 0 0 1px ${theme.vars.palette.primary.main}`;
  return {
    boxShadow: `${theme.soft.insetDeep.light}, ${edge}`,
    ...theme.applyStyles('dark', {
      boxShadow: `${theme.soft.insetDeep.dark}, ${edge}`,
    }),
  };
};

// A TextField (or select, or date picker) that reads as a pressed-in well.
// The outline is gone, so focus deepens the well instead (softFocus). A lone
// box uses a placeholder (with an aria-label); in a form, give it a `label`
// and the label sits above the well instead of floating into an outline it no
// longer has, and the placeholder stays visible under it.
export const softInputSx = (theme) => ({
  '& .MuiOutlinedInput-root, & .MuiPickersOutlinedInput-root': {
    ...softInset(theme),
    borderRadius: theme.spacing(2),
    '&.Mui-focused': softFocus(theme),
  },
  '& .MuiOutlinedInput-notchedOutline, & .MuiPickersOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '& .MuiInputLabel-root': {
    position: 'static',
    transform: 'none',
    maxWidth: '100%',
    pointerEvents: 'auto', // a tap on the label focuses its field
    mb: 1,
    ...theme.typography.body2,
    fontWeight: 500,
  },
  '& label[data-shrink=false] + .MuiInputBase-formControl .MuiInputBase-input::placeholder':
    { opacity: '0.5 !important' },
});

// The one solid brand-blue button on a card, sitting on the small soft shadow
// instead of MUI's drop shadow. It lets go of the shadow while pressed.
export const softContainedSx = (theme) => ({
  ...shadow(theme, 'raisedSmall'),
  '&:hover, &.Mui-focusVisible': shadow(theme, 'raisedSmall'),
  '&:active': { boxShadow: 'none' },
});

// A filter that toggles on and off (a Chip or Button with `aria-pressed`):
// a raised pill when off; pressed in, with brand-blue text, while on. Its
// icon is brand blue either way.
export const softToggleSx = (theme) => ({
  ...softRaisedSmall(theme),
  ...softPressSx(theme),
  '& .MuiChip-icon': { color: theme.vars.palette.primary.main },
  '&[aria-pressed="true"]': {
    ...shadow(theme, 'inset'),
    color: theme.vars.palette.primary.main,
    fontWeight: 600,
  },
});

// A table that lives straight on the surface: no cell borders, no row
// dividers. Rows are told apart by spacing and a faint hover wash.
export const softTableSx = (theme) => ({
  backgroundColor: 'transparent',
  '& .MuiTableCell-root': { borderBottom: 'none' },
  '& .MuiTableCell-head': {
    color: theme.vars.palette.primary.main,
    fontWeight: 600,
  },
  '& .MuiTableBody-root .MuiTableRow-root:hover': {
    backgroundColor: theme.vars.palette.action.hover,
  },
});

// A soft button: flat at rest, pressed in while held, and pressed in while
// "on" (aria-pressed), which is how a chosen vote shows. Light and shadow are
// the only feedback: MUI's hover and focus washes are pinned to the surface,
// because on a phone `:hover` sticks after a tap and left the control gray.
// Keyboard focus gets an outline instead.
export const softPressSx = (theme) => ({
  transition: theme.transitions.create('box-shadow', {
    duration: theme.transitions.duration.shortest,
  }),
  '&:hover, &.Mui-focusVisible': {
    backgroundColor: theme.vars.palette.background.default,
  },
  '&.Mui-focusVisible': {
    outline: `2px solid ${theme.vars.palette.primary.main}`,
    outlineOffset: 2,
  },
  '&:active, &[aria-pressed="true"]': shadow(theme, 'inset'),
});
