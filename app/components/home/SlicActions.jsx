'use client';

import { useEffect, useState } from 'react';
import {
  ArrowDropDown,
  ChatBubbleOutline,
  DirectionsOutlined,
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
} from '@mui/material';

import { useAppleDevice } from '@/utils/clientFunctions';
import { mapsHref } from '@/utils/geo';
import { COMMENTS_SECTION_ID, slicPdfHref } from '@/utils/variables';

// Per-viewer convenience only, like the install nudge: which maps app Navigate
// opens on this device.
const STORAGE_KEY = 'slics-maps-app';
const MAPS_APPS = { google: 'Google Maps', apple: 'Apple Maps' };

const readMapsApp = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeMapsApp = (app) => {
  try {
    localStorage.setItem(STORAGE_KEY, app);
  } catch {
    // Storage blocked (private mode etc.): the choice lasts until reload.
  }
};

// A secondary action: icon over label, a third of the row, 56px tall.
function ActionButton({ icon, label, ...props }) {
  return (
    <Button
      variant='outlined'
      sx={{ flex: 1, minHeight: '3.5rem', flexDirection: 'column', gap: 0.5 }}
      {...props}
    >
      {icon}
      {label}
    </Button>
  );
}

// The lookup card's actions (UI-SUGGESTIONS.md #41). A driver's next step is
// almost always "navigate", so that is the one big button. Call, PDF and Tips
// sit in a row under it, each shown only when it would do something. Tips
// needs the comments section on the page, so callers without one leave
// `showTips` off.
function SlicActions({ slic, commentsCount = 0, showTips = false }) {
  const isAppleDevice = useAppleDevice();
  const [mapsApp, setMapsApp] = useState('google');
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Read after mount so the server render and the first client render agree.
  // Apple Maps is only offered (and only remembered) on Apple devices.
  useEffect(() => {
    if (isAppleDevice && readMapsApp() === 'apple') setMapsApp('apple');
  }, [isAppleDevice]);

  const chooseMapsApp = (app) => {
    setMapsApp(app);
    writeMapsApp(app);
    setMenuAnchor(null);
  };

  const pdfHref = slicPdfHref(slic);
  const canCall = slic.type === 'center' && slic.phone;

  const scrollToComments = () => {
    document
      .getElementById(COMMENTS_SECTION_ID)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Box sx={{ width: '100%', mt: 3 }}>
      <ButtonGroup variant='contained' fullWidth sx={{ minHeight: '3.25rem' }}>
        <Button
          href={mapsHref({ address: slic.address }, mapsApp)}
          target='_blank'
          size='large'
          startIcon={<DirectionsOutlined />}
          sx={{ justifyContent: 'flex-start' }}
        >
          Navigate{' '}
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
            onClick={() => chooseMapsApp(app)}
            sx={{ minHeight: '3rem' }}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>

      {(canCall || pdfHref || showTips) && (
        <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
          {canCall && (
            <ActionButton
              icon={<PhoneOutlined />}
              label='Call'
              href={`tel:${slic.phone}`}
              aria-label={`Call ${slic.alphaSlic} dispatch`}
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
                <Badge badgeContent={commentsCount} color='primary' max={99}>
                  <ChatBubbleOutline />
                </Badge>
              }
              label='Tips'
              onClick={scrollToComments}
              aria-label={`Tips: ${commentsCount} comment${commentsCount === 1 ? '' : 's'}`}
            />
          )}
        </Box>
      )}
    </Box>
  );
}

export default SlicActions;
