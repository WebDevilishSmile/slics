'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Close,
  EditNoteOutlined,
  FormatListNumbered,
  PictureAsPdfOutlined,
  PrintOutlined,
  RecordVoiceOverOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Typography,
  useMediaQuery,
} from '@mui/material';

import theme from '@/theme';
import { apiRequest } from '@/lib/apiRequest';
import { parseRoute, routeSourceLine, sectionLabel, spokenText } from '@/lib/routeText';
import { useSpeech } from '@/hooks/useSpeech';
import { useWakeLock } from '@/hooks/useWakeLock';
import { MAP_ROUTE_NOTE, slicPdfHref } from '@/constants';
import {
  softContainedSx,
  softInset,
  softPressSx,
  softRaisedSmall,
  softToggleSx,
} from '@/components/utility/soft';

import RouteSteps from './RouteSteps';
import StepByStep from './StepByStep';
import SuggestRouteDialog from './SuggestRouteDialog';
import DrivingNotice from './DrivingNotice';

// The way a driver last chose for a SLIC ("Way 2", "Way back"), per device:
// a convenience in localStorage, by the section's label so an edited route
// still finds it.
const wayKey = (numSlic) => `slics-route-way:${numSlic}`;
function readWay(numSlic) {
  try {
    return localStorage.getItem(wayKey(numSlic));
  } catch {
    return null;
  }
}
function saveWay(numSlic, label) {
  try {
    localStorage.setItem(wayKey(numSlic), label);
  } catch {
    // Storage blocked: the first way next time.
  }
}

// The SLIC's directions (docs/SLIC-DIRECTIONS.md, stage 1): its route as
// numbered steps, one way at a time when it has several, then "Getting in"
// (the SLIC's arrival notes, the same from any hub). Step by step shows one
// step per screen, Read aloud speaks them, and the screen stays on while it's
// open. Mounted only while open, so each opening loads the latest route.
// The secondary actions keep their labels on one line and wrap as whole
// buttons on a narrow phone.
const SECONDARY = { flex: '1 1 auto', minHeight: '3rem', px: 2, whiteSpace: 'nowrap' };

export default function DirectionsSheet({ slic, onClose }) {
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [route, setRoute] = useState(slic.hasRoute ? undefined : null);
  const [error, setError] = useState('');
  const [sectionIndex, setSectionIndex] = useState(0);
  const [step, setStep] = useState(null); // null: all steps; a number: step by step
  const [reading, setReading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const speech = useSpeech();

  useWakeLock(true);

  useEffect(() => {
    if (!slic.hasRoute) return;
    let current = true;
    apiRequest(`/api/slic-routes?slic=${encodeURIComponent(slic.numSlic)}`, { method: 'GET' }).then(
      ({ data, error }) => {
        if (!current) return;
        if (error) {
          setError(error);
          setRoute(null);
        } else {
          setRoute(data.route);
        }
      },
    );
    return () => {
      current = false;
    };
  }, [slic.hasRoute, slic.numSlic]);

  const sections = useMemo(() => (route ? parseRoute(route.text) : []), [route]);

  // Open on the way chosen last time on this device.
  useEffect(() => {
    if (sections.length < 2) return;
    const saved = readWay(slic.numSlic);
    const found = sections.findIndex((section) => sectionLabel(section) === saved);
    if (found > 0) setSectionIndex(found);
  }, [sections, slic.numSlic]);

  const section = sections[sectionIndex] ?? sections[0] ?? null;

  // The voice follows the step on screen while reading is on.
  const { speak, stop } = speech;
  useEffect(() => {
    if (reading && section && step !== null) speak(spokenText(section.steps[step]));
    else stop();
  }, [reading, section, step, speak, stop]);

  const chooseSection = (index) => {
    setSectionIndex(index);
    setStep(null);
    saveWay(slic.numSlic, sectionLabel(sections[index]));
  };
  const exitSteps = () => {
    setReading(false);
    setStep(null);
  };

  const pdfHref = slicPdfHref(slic);
  const loading = route === undefined;
  const place = [slic.alphaSlic, slic.name].filter(Boolean).join(' · ') || slic.numSlic;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth='sm' fullScreen={fullScreen}>
      <DialogTitle sx={{ pr: 7 }}>
        Directions
        <Typography variant='body2' color='text.secondary' component='span' sx={{ display: 'block' }}>
          {place}
        </Typography>
      </DialogTitle>
      <IconButton
        onClick={onClose}
        aria-label='Close'
        sx={[softPressSx, { position: 'absolute', top: '0.75rem', right: '0.75rem' }]}
      >
        <Close />
      </IconButton>

      {section && step !== null ? (
        <StepByStep
          section={section}
          index={step}
          onIndex={setStep}
          onExit={exitSteps}
          canRead={speech.supported}
          reading={reading}
          onToggleReading={() => setReading((on) => !on)}
        />
      ) : (
        <>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <DrivingNotice />
            {loading && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
                {[90, 75, 85, 60].map((width) => (
                  <Skeleton key={width} variant='text' width={`${width}%`} height={28} />
                ))}
              </Box>
            )}
            {error && <Alert severity='error'>{error}</Alert>}

            {sections.length > 1 && (
              <Box role='group' aria-label='Which way' sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
                {sections.map((each, index) => (
                  <Chip
                    key={`${sectionLabel(each)}-${index}`}
                    label={sectionLabel(each)}
                    onClick={() => chooseSection(index)}
                    aria-pressed={index === sectionIndex}
                    sx={[softToggleSx, { minHeight: '2.75rem', borderRadius: 999 }]}
                  />
                ))}
              </Box>
            )}

            {section && (
              <Box sx={[softInset, { borderRadius: 4, p: { xs: 2, sm: 2.5 } }]}>
                <RouteSteps section={section} />
              </Box>
            )}

            {route && (
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  {routeSourceLine(route)}
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 0.75 }}>
                  {MAP_ROUTE_NOTE}
                </Typography>
              </Box>
            )}

            {slic.arrival && (
              <Box component='section' aria-labelledby={`arrival-${slic.numSlic}`}>
                <Typography id={`arrival-${slic.numSlic}`} variant='h6' component='h3' sx={{ mb: 1 }}>
                  Getting in
                </Typography>
                <Typography sx={{ whiteSpace: 'pre-line', lineHeight: 1.55 }}>{slic.arrival}</Typography>
              </Box>
            )}

            {!loading && !route && !slic.arrival && !error && (
              <Typography color='text.secondary'>No directions for this SLIC yet.</Typography>
            )}
          </DialogContent>

          <DialogActions disableSpacing sx={{ flexWrap: 'wrap', gap: 1.5, px: 3, pb: 3 }}>
            {section && (
              <Button
                variant='contained'
                onClick={() => setStep(0)}
                startIcon={<FormatListNumbered />}
                sx={[softContainedSx, { flex: '1 1 100%', minHeight: '3.5rem' }]}
              >
                Step by step
              </Button>
            )}
            {section && speech.supported && (
              <Button
                onClick={() => {
                  setReading(true);
                  setStep(0);
                }}
                startIcon={<RecordVoiceOverOutlined />}
                sx={[softRaisedSmall, softPressSx, SECONDARY]}
              >
                Read aloud
              </Button>
            )}
            {route && (
              <Button
                href={`/directions/${encodeURIComponent(slic.numSlic)}`}
                startIcon={<PrintOutlined />}
                sx={[softRaisedSmall, softPressSx, SECONDARY]}
              >
                Print
              </Button>
            )}
            {pdfHref && (
              <Button
                href={pdfHref}
                target='_blank'
                rel='noopener'
                startIcon={<PictureAsPdfOutlined />}
                sx={[softRaisedSmall, softPressSx, SECONDARY]}
              >
                Original PDF
              </Button>
            )}
            {!loading && (
              <Button
                onClick={() => setSuggesting(true)}
                startIcon={<EditNoteOutlined />}
                sx={[softRaisedSmall, softPressSx, SECONDARY]}
              >
                {route ? 'Suggest a change' : 'Add directions'}
              </Button>
            )}
          </DialogActions>
        </>
      )}

      {suggesting && (
        <SuggestRouteDialog
          slic={slic}
          initialText={route?.text ?? ''}
          onClose={() => setSuggesting(false)}
        />
      )}
    </Dialog>
  );
}
