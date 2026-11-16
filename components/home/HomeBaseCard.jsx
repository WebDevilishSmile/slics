'use client';

import { useEffect, useState } from 'react';
import { WarehouseOutlined } from '@mui/icons-material';
import { Box, Button, Link } from '@mui/material';

import { DEFAULT_HUB } from '@/lib/hubScope';
import { homeBaseLabel } from '@/lib/homeBase';
import HomeBasePicker, { putHomeBase } from '@/components/homeBase/HomeBasePicker';
import SoftNotice from '@/components/utility/SoftNotice';
import { softContainedSx, softPressSx } from '@/components/utility/soft';

// "Not now" asks again a week later, on this device. The account isn't
// touched, so another device still asks.
const STORAGE_KEY = 'slics-home-base-snoozed';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

function snoozed() {
  try {
    const at = Date.parse(localStorage.getItem(STORAGE_KEY) ?? '');
    return Number.isFinite(at) && Date.now() - at < SNOOZE_MS;
  } catch {
    return false;
  }
}

const BETPA = {
  numSlic: DEFAULT_HUB.numSlic,
  alphaSlic: DEFAULT_HUB.alphaSlic,
};

// Asks a driver SLICs can't place which building they work out of
// (docs/MULTI-HUB.md "Home base", step 3). /home renders it only for an
// account with no home base that's free to set one (not a verified driver or
// staff). Bethlehem is one tap, Another building opens the picker. Saving
// says so in place, with where to change it, and the card goes on the next
// visit. `profileHref`: the driver's own /profile/[id]. `preview` (the super
// admin's Notes, admin/hub/HomeBasePreview.jsx): always shown, saves nothing
// and snoozes nothing; `onHide` is called when it closes.
export default function HomeBaseCard({ profileHref, preview = false, onHide }) {
  // Hidden until the snooze is read, so it never flashes for a driver who
  // said "Not now".
  const [state, setState] = useState(preview ? 'asking' : 'hidden'); // hidden | asking | saving | saved
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!preview && !snoozed()) setState('asking');
  }, [preview]);

  const hide = () => {
    setState('hidden');
    onHide?.();
  };

  const notNow = () => {
    hide();
    if (preview) return;
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // Private mode: it asks again next visit.
    }
  };

  const onSaved = (homeBase) => {
    setPickerOpen(false);
    setSaved(homeBase);
    setState('saved');
  };

  const saveBetpa = async () => {
    setState('saving');
    setError('');
    try {
      onSaved(await putHomeBase(BETPA, { preview, hubs: [{ ...BETPA, town: DEFAULT_HUB.name }] }));
    } catch (saveError) {
      setError(saveError.message);
      setState('asking');
    }
  };

  if (state === 'hidden') return null;

  if (state === 'saved') {
    return (
      <SoftNotice
        icon={<WarehouseOutlined className='pop' />}
        onClose={hide}
        closeLabel='Close'
        sx={{ mb: 2 }}
      >
        Saved: {homeBaseLabel(saved)}.
        {saved?.listed === false && " We'll check it and add it to the list."} You can change
        it on <Link href={profileHref}>your profile</Link>.
      </SoftNotice>
    );
  }

  return (
    <>
      <SoftNotice
        icon={<WarehouseOutlined />}
        onClose={notNow}
        closeLabel='Not now'
        sx={{ mb: 2 }}
        actions={
          <>
            <Button
              variant='contained'
              size='small'
              onClick={saveBetpa}
              disabled={state === 'saving'}
              sx={[softContainedSx, { px: 1.5, ml: 1, minHeight: '2.5rem' }]}
            >
              {state === 'saving' ? 'Saving…' : `Bethlehem (${DEFAULT_HUB.alphaSlic} ${DEFAULT_HUB.numSlic})`}
            </Button>
            <Button
              size='small'
              onClick={() => setPickerOpen(true)}
              disabled={state === 'saving'}
              aria-haspopup='dialog'
              sx={[softPressSx, { px: 1.5, minHeight: '2.5rem' }]}
            >
              Another building
            </Button>
          </>
        }
      >
        <Box component='span' sx={{ fontWeight: 600, display: 'block' }}>
          Which building do you work out of?
        </Box>
        So SLICs can show your building&apos;s routes when other hubs join.
        {error && (
          <Box component='span' role='alert' sx={{ display: 'block', color: 'error.main', mt: 0.5 }}>
            {error}
          </Box>
        )}
      </SoftNotice>

      <HomeBasePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSaved={onSaved} preview={preview} />
    </>
  );
}
