// sx helpers for the app's soft, embossed look. The shadows live in
// `theme.soft` (utils/theme.js), one per color scheme. The style is seamless:
// the page, the `panel` Paper variant, the themed dialogs, menus and drawer,
// and every soft element share one surface, `background.default` with no
// overlay. Only light and shadow tell them apart: no borders, no Paper
// elevation. That means these work on the page itself as well as in a panel.

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

// A pressed-in well with a faint primary glow, for a focused field.
export const softFocus = (theme) => {
  const glow = (pct) =>
    `0 0 0 3px color-mix(in srgb, ${theme.vars.palette.primary.main} ${pct}%, transparent)`;
  return {
    boxShadow: `${theme.soft.inset.light}, ${glow(28)}`,
    ...theme.applyStyles('dark', {
      boxShadow: `${theme.soft.inset.dark}, ${glow(40)}`,
    }),
  };
};

// A TextField that reads as a pressed-in well. The outline is gone, so focus
// gets a glow; use a placeholder rather than a floating label, which would
// have no notch to sit in.
export const softInputSx = (theme) => ({
  '& .MuiOutlinedInput-root': {
    ...softInset(theme),
    borderRadius: theme.spacing(2),
    '&.Mui-focused': softFocus(theme),
  },
  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
});

// A soft button: flat at rest, pressed in while held, and pressed in while
// "on" (aria-pressed), which is how a chosen vote shows.
export const softPressSx = (theme) => ({
  transition: theme.transitions.create('box-shadow', {
    duration: theme.transitions.duration.shortest,
  }),
  '&:active, &[aria-pressed="true"]': shadow(theme, 'inset'),
});
