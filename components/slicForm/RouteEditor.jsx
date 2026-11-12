'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DeleteOutline, PictureAsPdfOutlined, Restore, SaveOutlined } from '@mui/icons-material';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';

import theme from '@/theme';
import { apiRequest } from '@/lib/apiRequest';
import { DEFAULT_HUB } from '@/lib/hubScope';
import {
  ROUTE_TEXT_MAX_LENGTH,
  formatRouteDate,
  mentionsCode,
  parseRoute,
  routeSourceLine,
} from '@/lib/routeText';
import {
  softContainedSx,
  softInputSx,
  softPressSx,
  softRaisedSmall,
} from '@/components/utility/soft';

const versionLine = (version) =>
  [
    version.source === 'pdf-import' ? 'Imported from the PDF' : 'Saved',
    formatRouteDate(version.approvedAt),
    version.approvedByName ? `by ${version.approvedByName}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

// The SLIC's route as text, on the edit page (docs/SLIC-DIRECTIONS.md, stage
// 1). It saves on its own (/api/slic-routes), like the PDF, so the form's
// Update never touches it. Saving is approving: drivers see "Driver-approved
// route · approved <date>". Earlier versions can be brought back into the box
// and saved again. `route` is toAdminRoute's shape, or null.
export default function RouteEditor({ numSlic, route, pdfHref }) {
  const router = useRouter();
  const [text, setText] = useState(route?.text ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [showVersions, setShowVersions] = useState(false);

  const sections = parseRoute(text);
  const steps = sections.reduce((sum, section) => sum + section.steps.length, 0);
  const dirty = text.trim() !== (route?.text ?? '');

  const save = async () => {
    setBusy(true);
    setError('');
    setDone('');
    const { data, error } = await apiRequest('/api/slic-routes', {
      method: 'PUT',
      body: { numSlic, text },
    });
    setBusy(false);
    if (error) return setError(error);
    setDone(data.changed ? 'Route saved.' : 'No changes to save.');
    router.refresh();
  };

  const remove = async () => {
    if (!window.confirm('Remove this route? Drivers will see the PDF instead, if there is one.')) return;
    setBusy(true);
    setError('');
    setDone('');
    const { error } = await apiRequest(`/api/slic-routes?slic=${encodeURIComponent(numSlic)}`, {
      method: 'DELETE',
    });
    setBusy(false);
    if (error) return setError(error);
    setText('');
    setDone('Route removed.');
    router.refresh();
  };

  return (
    <Box sx={{ width: '100%', maxWidth: theme.layout.width.field, mt: 4, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography variant='subtitle1'>Route from {DEFAULT_HUB.alphaSlic}</Typography>
      <Typography variant='body2' color='text.secondary'>
        One step per line. A line ending in a colon starts a section, such as &ldquo;Way 2:&rdquo; or
        &ldquo;Way back:&rdquo;. Put gates, doors and check-in in Arrival notes above.
      </Typography>
      {route && (
        <Typography variant='body2' color='text.secondary'>
          {routeSourceLine(route)}
          {route.approvedByName && route.source !== 'pdf-import' ? ` by ${route.approvedByName}` : ''}
        </Typography>
      )}

      <TextField
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setDone('');
        }}
        multiline
        minRows={8}
        placeholder={'33 south to 78 east\n78 east to exit 29\nWay back:\nLeft out of the yard'}
        helperText={`${steps} step${steps === 1 ? '' : 's'}${
          sections.length > 1 ? ` in ${sections.length} sections` : ''
        } · ${text.length}/${ROUTE_TEXT_MAX_LENGTH}`}
        disabled={busy}
        slotProps={{ htmlInput: { maxLength: ROUTE_TEXT_MAX_LENGTH, 'aria-label': 'Route' } }}
        sx={softInputSx}
      />
      {mentionsCode(text) && (
        <Alert severity='warning'>
          This looks like it has a gate code. Every signed-in driver can read the route, so leave
          codes out.
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        <Button
          variant='contained'
          onClick={save}
          disabled={busy || !dirty || !steps}
          startIcon={<SaveOutlined />}
          sx={[softContainedSx, { minHeight: '3rem', px: 3 }]}
        >
          {busy ? 'Saving…' : 'Save route'}
        </Button>
        {pdfHref && (
          <Button
            href={pdfHref}
            target='_blank'
            rel='noopener'
            startIcon={<PictureAsPdfOutlined />}
            sx={[softRaisedSmall, softPressSx, { minHeight: '3rem', px: 3 }]}
          >
            Original PDF
          </Button>
        )}
        {route && (
          <Button
            color='error'
            onClick={remove}
            disabled={busy}
            startIcon={<DeleteOutline />}
            sx={[softRaisedSmall, softPressSx, { minHeight: '3rem', px: 3 }]}
          >
            Remove
          </Button>
        )}
      </Box>

      <Box role='status' aria-live='polite'>
        {done && <Alert severity='success'>{done}</Alert>}
      </Box>
      {error && <Alert severity='error'>{error}</Alert>}

      {route?.previous?.length > 0 && (
        <Box>
          <Button
            onClick={() => setShowVersions((open) => !open)}
            aria-expanded={showVersions}
            startIcon={<Restore />}
            sx={[softPressSx, { minHeight: '3rem', px: 2 }]}
          >
            Earlier versions ({route.previous.length})
          </Button>
          {showVersions && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
              {route.previous.map((version, index) => (
                <Box
                  key={`${version.approvedAt}-${index}`}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}
                >
                  <Typography variant='body2' sx={{ flex: 1, minWidth: '12rem' }}>
                    {versionLine(version)}
                  </Typography>
                  <Button
                    size='small'
                    onClick={() => {
                      setText(version.text);
                      setDone('');
                    }}
                    sx={[softRaisedSmall, softPressSx, { minHeight: '2.75rem', px: 2 }]}
                  >
                    Put in the box
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
