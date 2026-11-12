'use client';

import { useState } from 'react';
import {
  ArrowDropDown,
  ChatBubbleOutline,
  DirectionsOutlined,
  MapOutlined,
  PhoneOutlined,
  PictureAsPdfOutlined,
} from '@mui/icons-material';
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';

import { useMapsApp } from '@/hooks/useMapsApp';
import { mapsHref } from '@/lib/geo';
import { useTips } from '@/lib/tipsStore';
import { COMMENTS_SECTION_ID, MAP_ROUTE_NOTE, slicPdfHref } from '@/constants';

import { softPressSx, softRaised } from '@/components/utility/soft';
import DirectionsSheet from '@/components/directions/DirectionsSheet';

const MAPS_APPS = { google: 'Google Maps', apple: 'Apple Maps' };

// A secondary action: icon over label, a third of the row, 56px tall. A soft
// raised tile (utility/soft.js) that presses in while it's held.
function ActionButton({ icon, label, ...props }) {
  return (
    <Button
      sx={[
        softRaised,
        softPressSx,
        {
          flex: 1,
          minHeight: '3.5rem',
          flexDirection: 'column',
          gap: 0.5,
          borderRadius: 4,
        },
      ]}
      {...props}
    >
      {icon}
      {label}
    </Button>
  );
}

// The lookup card's actions (UI-SUGGESTIONS.md #41). A driver's next step is
// almost always the drive there, so Open map is the one big button (it was
// "Navigate" until 2026-11-11). Under it, a line says a maps app's route
// isn't always one a truck can take (MAP_ROUTE_NOTE). Call, Directions (or
// PDF) and Tips sit in a row under it, each shown only when it would do
// something. Directions opens the route as text and the arrival notes
// (docs/SLIC-DIRECTIONS.md); a SLIC with neither keeps its PDF tile. Tips
// needs the comments section on the page, so callers without one leave
// `showTips` off.
function SlicActions({ slic, commentsCount = 0, showTips = false }) {
  // The device's maps app, shared with pinned spots on tips (hooks/useMapsApp.js).
  const { mapsApp, chooseMapsApp, isAppleDevice } = useMapsApp();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [directionsOpen, setDirectionsOpen] = useState(false);

  // Live counts from the tips section once it has loaded (lib/tipsStore.js);
  // the server's count until then.
  const tips = useTips(slic.numSlic);
  const tipTotal = tips?.total ?? commentsCount;
  const newTips = tips?.newCount ?? 0;

  // The tile opens the sheet: the route and arrival notes ("Directions"), or
  // only photos and PDFs ("Maps & docs").
  const hasDirections = Boolean(slic.hasRoute || slic.arrival || slic.hasDocuments);
  const directionsLabel = slic.hasRoute || slic.arrival ? 'Directions' : 'Maps & docs';
  const pdfHref = hasDirections ? null : slicPdfHref(slic);
  const canCall = slic.type === 'center' && slic.phone;

  const scrollToComments = () => {
    document
      .getElementById(COMMENTS_SECTION_ID)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Box sx={{ width: '100%', mt: 3 }}>
      {/* The one solid brand-blue element on the card. It sits on the same
          soft shadow as the tiles instead of MUI's drop shadow. */}
      <ButtonGroup
        variant='contained'
        fullWidth
        sx={(theme) => ({
          minHeight: '3.25rem',
          boxShadow: theme.soft.raisedSmall.light,
          ...theme.applyStyles('dark', {
            boxShadow: theme.soft.raisedSmall.dark,
          }),
          '& .MuiButton-root': { boxShadow: 'none' },
        })}
      >
        <Button
          href={mapsHref({ address: slic.address }, mapsApp)}
          target='_blank'
          size='large'
          startIcon={<MapOutlined />}
          sx={{ justifyContent: 'flex-start' }}
          aria-describedby={`map-note-${slic.numSlic}`}
        >
          Open map{' '}
          {!isAppleDevice && (
            <Box component='span' sx={{ ml: 'auto', typography: 'body2' }}>
              {MAPS_APPS.google}
            </Box>
          )}
        </Button>
        {isAppleDevice && (
          <Button
            size='large'
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            endIcon={<ArrowDropDown />}
            aria-label={`Maps app: ${MAPS_APPS[mapsApp]}`}
            aria-haspopup='menu'
            aria-expanded={Boolean(menuAnchor)}
            sx={{ width: 'auto', flexShrink: 0, typography: 'body2' }}
          >
            {mapsApp === 'apple' ? 'Apple' : 'Google'}
          </Button>
        )}
      </ButtonGroup>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        {Object.entries(MAPS_APPS).map(([app, label]) => (
          <MenuItem
            key={app}
            selected={app === mapsApp}
            onClick={() => {
              chooseMapsApp(app);
              setMenuAnchor(null);
            }}
            sx={{ minHeight: '3rem' }}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>
      <Typography
        id={`map-note-${slic.numSlic}`}
        variant='body2'
        color='text.secondary'
        sx={{ mt: 1.25, px: 0.5 }}
      >
        {MAP_ROUTE_NOTE}
      </Typography>

      {(canCall || hasDirections || pdfHref || showTips) && (
        <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5 }}>
          {canCall && (
            <ActionButton
              icon={<PhoneOutlined />}
              label='Call'
              href={`tel:${slic.phone}`}
              aria-label={`Call ${slic.alphaSlic} dispatch`}
            />
          )}
          {hasDirections && (
            <ActionButton
              icon={<DirectionsOutlined />}
              label={directionsLabel}
              onClick={() => setDirectionsOpen(true)}
              aria-haspopup='dialog'
            />
          )}
          {pdfHref && (
            <ActionButton
              icon={<PictureAsPdfOutlined />}
              label='PDF'
              href={pdfHref}
              target='_blank'
              rel='noopener'
              aria-label='PDF directions'
            />
          )}
          {showTips && (
            <ActionButton
              icon={
                // New tips since this device last showed them win the badge
                // (in red); otherwise it's the total.
                <Badge
                  badgeContent={newTips || tipTotal}
                  color={newTips ? 'error' : 'primary'}
                  max={99}
                >
                  <ChatBubbleOutline />
                </Badge>
              }
              label='Tips'
              onClick={scrollToComments}
              aria-label={`Tips: ${tipTotal} tip${tipTotal === 1 ? '' : 's'}${
                newTips ? `, ${newTips} new` : ''
              }`}
            />
          )}
        </Box>
      )}

      {directionsOpen && (
        <DirectionsSheet slic={slic} onClose={() => setDirectionsOpen(false)} />
      )}
    </Box>
  );
}

export default SlicActions;
