// sx helpers for the Driver tips' soft, embossed look. The shadows live in
// `theme.soft` (utils/theme.js), one per color scheme. Every soft element
// takes the comments panel's own surface (paper, plus its dark-mode elevation
// overlay), so only the light and shadow tell it apart from the panel: no
// borders, no stacked Paper elevations.

const surface = (theme) => ({
  backgroundColor: theme.vars.palette.background.paper,
  backgroundImage: theme.vars.overlays[theme.layout.elevation],
});

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

// A TextField that reads as a pressed-in well. The outline is gone, so focus
// gets its own ring; use a placeholder rather than a floating label, which
// would have no notch to sit in.
export const softInputSx = (theme) => ({
  '& .MuiOutlinedInput-root': {
    ...softInset(theme),
    borderRadius: theme.spacing(2),
    '&.Mui-focused': {
      outline: `2px solid ${theme.vars.palette.primary.main}`,
      outlineOffset: 2,
    },
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
