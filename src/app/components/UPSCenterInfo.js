'use client';

import { Box, Button, Paper, Typography } from '@mui/material';

import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined';
import theme from '../utilities/theme';

export default function UPSCenterInfo({ upsCenter, slic }) {
  const dirPdf = upsCenter.alphaSlic?.toLowerCase();

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Paper /* UPS CENTER INFORMATION */
        sx={{
          width: { xxs: '90%', xs: '90%', sm: '90%', md: '90%' },
          backgroundColor: theme.palette.background.medium,
          mt: '3rem',
          p: '1rem',
        }}
      >
        {slic ? (
          <Box>
            <Typography /* SLIC NUMBER */
              variant="h6"
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
                {upsCenter.numSlic}
              </span>{' '}
            </Typography>
            <Typography /* SLIC NAME */
              variant="h6"
              sx={{ width: '100%', textAlign: 'center', mt: '.5rem' }}
            >
              {upsCenter.alphaSlic}
            </Typography>

            <Box sx={{ display: 'flex', mt: '1rem' }}>
              <Button /* LINK TO MAP */
                color="secondary"
                variant="contained"
                sx={{ width: '100%', gap: '1.5rem', fontWeight: '400' }}
                href={`https://www.google.com/maps/search/?api=1&query=${upsCenter.street}%2C%20${upsCenter.city}%2C%20${upsCenter.state}`}
              >
                <MapOutlinedIcon
                  sx={{
                    color: theme.palette.primary.dark,
                  }}
                />
                <Box /* ADDRESS */>
                  {upsCenter.street} <br />
                  {upsCenter.city} {upsCenter.state} {upsCenter.zip}
                </Box>
              </Button>
            </Box>
            <Box sx={{ display: 'flex', mt: '1rem' }}>
              <Button /* LINK TO PHONE NUMBER */
                color="secondary"
                variant="contained"
                sx={{ width: '100%', gap: '1.5rem', fontWeight: '400' }}
                href={`tel:${upsCenter.phone}`}
              >
                <PhoneInTalkOutlinedIcon
                  sx={{ color: theme.palette.primary.dark }}
                />
                <Box /* PHONE NUMBER */>{upsCenter.phone}</Box>
              </Button>
            </Box>
            <Box sx={{ display: 'flex', mt: '.5rem' }}></Box>
          </Box>
        ) : (
          'Please choose SLIC from list above'
        )}
      </Paper>
      <Paper /* UPS CENTER INFORMATION */
        sx={{
          width: { xxs: '90%', xs: '90%', sm: '90%', md: '90%' },
          backgroundColor: theme.palette.background.medium,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: '1rem',
          p: '1rem',
        }}
      >
        {slic ? (
          <Button
            color="secondary"
            variant={upsCenter.directions === '' ? 'disabled' : 'contained'}
            href={`/centerDirections/${dirPdf}.pdf`}
            rel="noreffer"
            target="_blank"
            sx={{ fontWeight: '400' }}
          >
            {upsCenter.directions === ''
              ? 'No directions'
              : `${upsCenter.alphaSlic}  pdf`}
          </Button>
        ) : (
          <Typography textAlign="center">
            Click on the address to take you to Google maps and click on phone
            number to dial feeder office.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
