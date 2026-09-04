'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import { ExpandMore, LocalShipping, Map, Straight } from '@mui/icons-material';
import { useGeolocation } from '@/utils/clientFunctions';

function formatDuration(seconds) {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) return `${minutes} min`;
  return `${hours} hr ${minutes} min`;
}

function formatMiles(meters) {
  const miles = meters / 1609.344;
  return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`;
}

function formatArrival(isoTime) {
  const date = new Date(isoTime);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function RouteInfo({ slic }) {
  const { error: geoError, loading: locating, request } = useGeolocation();
  const [route, setRoute] = useState(null);
  const [routeError, setRouteError] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const loading = locating || calculating;

  const handleClick = async () => {
    setRouteError(null);
    setRoute(null);

    const origin = await request();
    if (!origin) return;

    setCalculating(true);

    try {
      const response = await fetch('/api/directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, numSlic: slic.numSlic }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRouteError(data.error || 'Could not calculate a truck route.');
        return;
      }

      setRoute(data);
    } catch (error) {
      console.error('Error fetching truck route:', error);
      setRouteError('Could not reach the routing service. Try again.');
    } finally {
      setCalculating(false);
    }
  };

  const arrival = route && formatArrival(route.arrivalTime);

  // console.log(route.stops);

  return (
    <Box
      sx={{
        mt: '2rem',
        px: { xs: 2, sm: 2 },
        maxWidth: '600px',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <Button
        variant='contained'
        onClick={handleClick}
        disabled={loading}
        startIcon={
          loading ? (
            <CircularProgress size={18} color='inherit' />
          ) : (
            <LocalShipping />
          )
        }
      >
        {loading ? 'Calculating…' : 'Get truck route'}
      </Button>

      <Typography variant='caption' display='block' sx={{ mt: '.5rem' }}>
        Routed for a 13&apos;6&quot; tractor-trailer at 80,000 lb.
      </Typography>

      {geoError && (
        <Alert severity='warning' sx={{ mt: '1rem' }}>
          {geoError.message}
        </Alert>
      )}

      {routeError && (
        <Alert severity='error' sx={{ mt: '1rem' }}>
          {routeError}
        </Alert>
      )}

      {route && (
        <Box sx={{ mt: '1rem' }}>
          <Typography variant='h5'>
            {formatDuration(route.durationSeconds)} ·{' '}
            {formatMiles(route.distanceMeters)}
          </Typography>

          {arrival && (
            <Typography variant='body2' color='text.secondary'>
              Arriving around {arrival}
              {route.trafficDelaySeconds > 60 &&
                ` · ${formatDuration(route.trafficDelaySeconds)} of traffic delay`}
            </Typography>
          )}

          {route.notices?.length > 0 ? (
            <Alert severity='warning' sx={{ mt: '1rem' }}>
              <Typography variant='subtitle2'>
                Restrictions on this route
              </Typography>
              <List dense disablePadding>
                {route.notices.map((notice, index) => (
                  <ListItem key={`${notice.code}-${index}`} disableGutters>
                    <ListItemText
                      primary={
                        notice.causes?.length ? notice.causes[0] : notice.title
                      }
                      secondary={notice.causes?.slice(1).join(' · ') || null}
                    />
                  </ListItem>
                ))}
              </List>
            </Alert>
          ) : (
            <Alert severity='success' sx={{ mt: '1rem' }}>
              No height, weight, or road restrictions flagged for a
              13&apos;6&quot; rig.
            </Alert>
          )}

          {/* {route.steps?.length > 0 && (
            <Accordion sx={{ mt: '1rem' }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Straight sx={{ mr: '.5rem' }} />
                <Typography>Directions ({route.steps.length} steps)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense disablePadding>
                  {route.steps.map((step, index) => (
                    <ListItem key={index} disableGutters>
                      <ListItemText
                        primary={step.instruction}
                        secondary={
                          step.distanceMeters
                            ? formatMiles(step.distanceMeters)
                            : null
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )} */}

          {route.stops?.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <LocalShipping sx={{ mr: '.5rem' }} />
                <Typography>
                  Stops along the way ({route.stops.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense disablePadding>
                  {route.stops.map((stop, index) => (
                    <Box key={index}>
                      {index > 0 && <Divider component='li' />}
                      <ListItem
                        disableGutters
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          flexDirection: { xs: 'column', sm: 'row' },
                        }}
                      >
                        <ListItemText
                          primary={stop.title}
                          secondary={
                            [stop.category, stop.address]
                              .filter(Boolean)
                              .join(' · ') || null
                          }
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                          }}
                        />
                        <Box
                          sx={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: {
                              xs: 'flex-end',
                              sm: 'flex-end',
                            },
                            mt: { xs: 1, sm: 0 },
                          }}
                        >
                          {stop.distanceMiles != null && (
                            <Typography
                              variant='body2'
                              color='text.secondary'
                              sx={{ whiteSpace: 'nowrap', pl: '1rem' }}
                            >
                              {stop.distanceMiles} mi
                            </Typography>
                          )}
                          <Button
                            variant='outlined'
                            size='small'
                            sx={{ ml: '1rem' }}
                            href={`https://www.google.com/maps/search/?api=1&query=${stop.position.lat},${stop.position.lng}`}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            <Map />
                          </Button>
                        </Box>
                      </ListItem>
                    </Box>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}
    </Box>
  );
}
