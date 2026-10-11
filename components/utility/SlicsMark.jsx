import { SvgIcon } from '@mui/material';

// The SLICs glyph without its tile, for the blue header and the menu: the S
// route and its destination dot, in the current text color. Same geometry as
// public/slics-icon.svg (the app icon master), with the viewBox cropped to the
// glyph so it fills its box; change both together.
export default function SlicsMark({ sx, ...props }) {
  return (
    <SvgIcon
      viewBox='17 15 66 66'
      sx={[{ display: 'block' }, ...(Array.isArray(sx) ? sx : [sx])]}
      aria-hidden
      {...props}
    >
      <path
        d='M60.09 25.92A12.8 12.8 0 1 0 50 46.6A14 14 0 1 1 49.51 74.59'
        fill='none'
        stroke='currentColor'
        strokeWidth='9.5'
        strokeLinecap='round'
      />
      <circle cx='37.64' cy='67.17' r='6.4' />
    </SvgIcon>
  );
}
