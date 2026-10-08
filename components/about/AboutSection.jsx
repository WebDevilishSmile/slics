import theme from '@/theme';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';

import { softInset, softRaised } from '@/components/utility/soft';

// A round inset well for a section's picture or icon (one emboss level: the
// section card is already raised).
const wellSx = [
  softInset(theme),
  {
    borderRadius: '50%',
    overflow: 'hidden',
    width: 120,
    height: 120,
    mx: 'auto',
  },
];

// One About section: a soft raised card on the page surface with a title, a
// picture (`imageSrc` + `imageAlt`) or an `icon` component in a round well,
// the section's text as children, and an optional `action` below it.
export default function AboutSection({
  title,
  imageSrc,
  imageAlt,
  icon: Icon,
  iconSize = '5rem',
  action,
  children,
}) {
  return (
    <Box
      component='section'
      className='enter'
      sx={[
        softRaised(theme),
        {
          width: '100%',
          maxWidth: theme.layout.width.prose,
          mt: 4,
          px: { xs: 3, sm: 4 },
          py: 3,
          borderRadius: 3,
        },
      ]}
    >
      <Typography
        variant='h5'
        component='h3'
        sx={{ textAlign: 'center', mx: 'auto', mb: 2 }}
      >
        {title}
      </Typography>

      {Icon ? (
        <Box
          sx={[
            ...wellSx,
            { display: 'flex', alignItems: 'center', justifyContent: 'center' },
          ]}
        >
          <Icon
            sx={{
              fontSize: iconSize,
              display: 'block',
              margin: '0 auto',
              color: 'primary.main',
            }}
          />
        </Box>
      ) : (
        <Box sx={wellSx}>
          <Image
            src={imageSrc}
            width={120}
            height={120}
            alt={imageAlt}
            style={{
              width: '110%',
              height: '110%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        </Box>
      )}

      <Typography
        variant='body1'
        sx={{
          textAlign: 'center',
          maxWidth: theme.layout.width.prose,
          mx: 'auto',
          my: 2,
        }}
      >
        {children}
      </Typography>

      {action}
    </Box>
  );
}
