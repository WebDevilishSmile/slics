import { Box, Paper, Typography } from '@mui/material';
import theme from '../utilities/theme';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const weatherKey = process.env.NEXT_WEATHER_API_KEY;

export default function Weather({ upsCenter, slic, checked }) {
  const [weatherOrigin, setWeatherOrigin] = useState(null);
  const [weatherDest, setWeatherDest] = useState(null);

  useEffect(() => {
    fetch(`https://api.weatherapi.com/v1/current.json?key=5c48e43dda8c425faa113600241102&q=Tatamy&aqi=no
    `)
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        setWeatherOrigin(data);
      });
  }, []);

  useEffect(() => {
    if (slic && checked)
      fetch(`https://api.weatherapi.com/v1/current.json?key=5c48e43dda8c425faa113600241102&q=${upsCenter.zip}&aqi=no
    `)
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          setWeatherDest(data);
        });
  }, [upsCenter, slic, checked]);

  return (
    <Paper /* CUSTOMER INFORMATION */
      sx={{
        minWidth: { xxs: '90%', xs: '90%', sm: '90%', md: '90%' },
        backgroundColor: theme.palette.primary.light,
        mt: '3rem',
        p: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {weatherOrigin && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ fontWeight: '600' }}>BETPA Weather</Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography>
              Tatamy, PA {Math.round(weatherOrigin.current.temp_f)} &deg;
            </Typography>
            <Image
              src={`https:${weatherOrigin.current.condition?.icon}`}
              width={48}
              height={48}
              alt='Weather Icon'
            />
          </Box>
        </Box>
      )}

      {slic && weatherDest && checked && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ fontWeight: '600' }}>
            Destination Weather
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography>
              {upsCenter.city}, {upsCenter.state}{' '}
              {Math.round(weatherDest.current.temp_f)} &deg;
            </Typography>
            <Image
              src={`https:${weatherDest.current.condition?.icon}`}
              width={48}
              height={48}
              alt='Weather Icon'
            />
          </Box>
        </Box>
      )}
    </Paper>
  );
}
