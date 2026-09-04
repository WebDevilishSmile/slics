'use client';

import { Box, Paper, Typography } from '@mui/material';
import MapPhoneLinks from '../home/MapPhoneLinks';
import TitleAddress from '../home/TitleAddress';
import Comments from '../comments/Comments';
import PdfLink from '../home/PdfLink';

export default function Title({ slic, commentsCount }) {
  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <Typography variant='h4'>
        {slic.alphaSlic} / {slic.numSlic}
      </Typography>

      <MapPhoneLinks slic={slic} />
      <PdfLink slic={slic} />
    </Box>
  );
}
