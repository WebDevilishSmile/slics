'use client';

import { Box, Button, Paper, Typography } from '@mui/material';

import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import theme from '../utilities/theme';

export default function CustomerInfo({ customer, slic }) {
  return (
    <Paper /* CUSTOMER INFORMATION */
      sx={{
        minWidth: { xxs: '90%', xs: '90%', sm: '90%', md: '90%' },
        background: `linear-gradient(to top left, ${theme.palette.background.medium}, ${theme.palette.secondary.main}  )`,
        mt: '3rem',
        p: '1rem',
      }}
    >
      {slic ? (
        <Box>
          <Typography /* NUMBER SLIC NUMBER */
            variant='h6'
            sx={{ width: '100%', textAlign: 'center' }}
          >
            SLIC{' '}
            <span
              style={{
                backgroundColor: theme.palette.primary.light,
                padding: '.5rem',
                borderRadius: '.5rem',
              }}
            >
              {customer.numSlic} / {customer.alphaSlic}
            </span>
          </Typography>

          <Typography /* SLIC NAME */
            variant='h6'
            sx={{
              width: '100%',
              textAlign: 'center',
              mt: '.5rem',
              textTransform: 'uppercase',
            }}
          >
            {customer.name}
          </Typography>
          <Box sx={{ display: 'flex', mt: '1rem' }}>
            <Button /* LINK TO MAP */
              variant='contained'
              color='secondary'
              sx={{ width: '100%', gap: '1.5rem', fontWeight: '400' }}
              href={`https://www.google.com/maps/search/?api=1&query=${customer.street}%2C%20${customer.city}%2C%20${customer.state}`}
            >
              <MapOutlinedIcon sx={{ color: theme.palette.primary.dark }} />
              <Box /* ADDRESS */>
                {customer.street} <br />
                {customer.city} {customer.state} {customer.zip}
              </Box>
            </Button>
          </Box>
        </Box>
      ) : (
        <Typography textAlign='center'>
          Pressing on address opens Google Maps
        </Typography>
      )}
    </Paper>
  );
}
