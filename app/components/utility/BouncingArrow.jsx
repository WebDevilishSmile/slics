import { ArrowDownward } from '@mui/icons-material';

// The down arrow that bobs above a call-to-action button (about/AboutLink.jsx,
// layout/BuyMeACoffeeButton.jsx). Holds still for prefers-reduced-motion.
function BouncingArrow() {
  return (
    <ArrowDownward
      aria-hidden
      sx={{
        fontSize: '2rem',
        mb: 2,
        animation: 'bounce 1.5s ease-in-out infinite',
        '@keyframes bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(0.5rem)' },
        },
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }}
    />
  );
}

export default BouncingArrow;
