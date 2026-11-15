'use client';

import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import {
  AttachFileOutlined,
  CheckCircleOutline,
  CloseRounded,
  DescriptionOutlined,
  ErrorOutline,
  InsertDriveFileOutlined,
} from '@mui/icons-material';
import { Box, Button, CircularProgress, IconButton, ListItemText, Menu, MenuItem, Typography } from '@mui/material';

import {
  attachmentKind,
  attachmentPathname,
  cleanAttachmentName,
  EMAIL_ATTACHMENT_ACCEPT,
  EMAIL_ATTACHMENT_KINDS_LABEL,
  EMAIL_ATTACHMENTS_MAX,
  EMAIL_ATTACHMENTS_MAX_BYTES,
  formatBytes,
} from '@/lib/emailAttachments';
import { FLYERS } from '@/lib/flyers';
import { softInset, softPressSx, softRaisedSmall } from '@/components/utility/soft';

// The files on an email written on /admin/super/email. Each one uploads
// straight from this browser to Vercel Blob as soon as it's picked
// (POST /api/emails/attachments hands out the token), so a file can be bigger
// than a request to the app may carry; sending passes only the links
// (lib/emailAttachments.js). `files` is the parent's list:
// `[{ id, name, size, status: 'uploading' | 'done' | 'failed', percent, url, controller }]`,
// plus the printed flyers picked from "Add a flyer" (`{ id, flyer, name,
// label, status: 'done' }`), which the server attaches from its own copies
// (lib/flyers.js), so nothing is uploaded for them.
// Removing a file only drops it here; the daily cron deletes what's left in
// Blob.

const MULTIPART_BYTES = 8 * 1024 * 1024;

export default function EmailAttachments({ files, setFiles, disabled, onProblem }) {
  const inputRef = useRef(null);
  const [flyerMenu, setFlyerMenu] = useState(null);
  const addedFlyers = new Set(files.map((file) => file.flyer).filter(Boolean));
  const full = files.length >= EMAIL_ATTACHMENTS_MAX;

  const addFlyer = (flyer) => {
    setFlyerMenu(null);
    onProblem('');
    setFiles((current) =>
      current.some((file) => file.flyer === flyer.key)
        ? current
        : [...current, { id: `flyer-${flyer.key}`, flyer: flyer.key, name: flyer.file, label: flyer.label, size: 0, status: 'done' }],
    );
  };

  const update = (id, change) =>
    setFiles((current) => current.map((file) => (file.id === id ? { ...file, ...change } : file)));

  const pick = async (event) => {
    const picked = [...(event.target.files ?? [])];
    event.target.value = '';
    if (!picked.length) return;
    onProblem('');

    let count = files.length;
    let total = files.reduce((sum, file) => sum + file.size, 0);
    const starting = [];
    for (const file of picked) {
      const name = cleanAttachmentName(file.name);
      const kind = attachmentKind(name);
      if (!kind) {
        onProblem(`“${name || 'That file'}” can’t be attached. Attach ${EMAIL_ATTACHMENT_KINDS_LABEL}.`);
        continue;
      }
      if (count >= EMAIL_ATTACHMENTS_MAX) {
        onProblem(`Attach at most ${EMAIL_ATTACHMENTS_MAX} files.`);
        break;
      }
      if (total + file.size > EMAIL_ATTACHMENTS_MAX_BYTES) {
        onProblem(`“${name}” would take the files over ${formatBytes(EMAIL_ATTACHMENTS_MAX_BYTES)} together.`);
        continue;
      }
      count += 1;
      total += file.size;
      starting.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name,
        size: file.size,
        status: 'uploading',
        percent: 0,
        url: null,
        controller: new AbortController(),
        file,
        contentType: kind.contentType,
      });
    }
    if (!starting.length) return;
    setFiles((current) => [...current, ...starting.map(({ file, contentType, ...rest }) => rest)]);

    await Promise.all(
      starting.map(async ({ id, name, file, contentType, controller }) => {
        try {
          const blob = await upload(attachmentPathname(name), file, {
            access: 'public',
            handleUploadUrl: '/api/emails/attachments',
            contentType,
            multipart: file.size > MULTIPART_BYTES,
            abortSignal: controller.signal,
            onUploadProgress: ({ percentage }) => update(id, { percent: Math.round(percentage) }),
          });
          update(id, { status: 'done', percent: 100, url: blob.url, controller: null });
        } catch (error) {
          if (controller.signal.aborted) return;
          console.error('Email attachment upload failed:', error?.name ?? 'Error');
          update(id, { status: 'failed', controller: null });
        }
      }),
    );
  };

  const remove = (file) => {
    file.controller?.abort();
    setFiles((current) => current.filter((item) => item.id !== file.id));
  };

  const total = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: '12rem' }}>
          <Typography sx={{ fontWeight: 700 }}>Attachments</Typography>
          <Typography variant='body2' color='text.secondary'>
            {EMAIL_ATTACHMENT_KINDS_LABEL}, or a printed flyer. Up to {EMAIL_ATTACHMENTS_MAX} files,{' '}
            {formatBytes(EMAIL_ATTACHMENTS_MAX_BYTES)} together.
          </Typography>
        </Box>
        <Button
          type='button'
          onClick={() => inputRef.current?.click()}
          disabled={disabled || full}
          startIcon={<AttachFileOutlined />}
          sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
        >
          Attach files
        </Button>
        <Button
          type='button'
          id='add-flyer-button'
          aria-haspopup='menu'
          aria-expanded={flyerMenu ? 'true' : undefined}
          aria-controls={flyerMenu ? 'add-flyer-menu' : undefined}
          onClick={(event) => setFlyerMenu(event.currentTarget)}
          disabled={disabled || full || addedFlyers.size === FLYERS.length}
          startIcon={<DescriptionOutlined />}
          sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
        >
          Add a flyer
        </Button>
        <Menu
          id='add-flyer-menu'
          anchorEl={flyerMenu}
          open={Boolean(flyerMenu)}
          onClose={() => setFlyerMenu(null)}
          slotProps={{ list: { 'aria-labelledby': 'add-flyer-button' } }}
        >
          {FLYERS.map((flyer) => (
            <MenuItem
              key={flyer.key}
              onClick={() => addFlyer(flyer)}
              disabled={addedFlyers.has(flyer.key)}
              sx={{ minHeight: '3rem' }}
            >
              <ListItemText
                primary={flyer.label}
                secondary={addedFlyers.has(flyer.key) ? 'Added' : flyer.about}
              />
            </MenuItem>
          ))}
        </Menu>
        <input
          ref={inputRef}
          type='file'
          multiple
          accept={EMAIL_ATTACHMENT_ACCEPT}
          onChange={pick}
          hidden
          aria-hidden
          tabIndex={-1}
        />
      </Box>

      {files.length ? (
        <Box
          component='ul'
          aria-label='Attached files'
          sx={[softInset, { listStyle: 'none', m: 0, p: 1, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 0.5 }]}
        >
          {files.map((file) => (
            <Box
              component='li'
              key={file.id}
              className='enter'
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 1.5, minHeight: '3rem' }}
            >
              {file.flyer ? <DescriptionOutlined color='primary' aria-hidden /> : <FileStatusIcon status={file.status} />}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant='body2' sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                  {file.flyer ? file.label : file.name}
                </Typography>
                <Typography
                  variant='caption'
                  sx={{ color: file.status === 'failed' ? 'error.main' : 'text.secondary' }}
                >
                  {file.flyer
                    ? `Flyer · ${file.name}`
                    : file.status === 'uploading'
                    ? `Uploading… ${file.percent}%`
                    : file.status === 'failed'
                      ? 'Didn’t upload. Remove it and attach it again.'
                      : formatBytes(file.size)}
                </Typography>
              </Box>
              <IconButton
                onClick={() => remove(file)}
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                sx={[softPressSx, { width: '2.75rem', height: '2.75rem' }]}
              >
                <CloseRounded fontSize='small' />
              </IconButton>
            </Box>
          ))}
          {files.length > 1 ? (
            <Typography variant='caption' color='text.secondary' sx={{ px: 1.5, pb: 0.5 }}>
              {files.length} files{total ? `, ${formatBytes(total)} uploaded` : ''}
            </Typography>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}

function FileStatusIcon({ status }) {
  if (status === 'uploading') {
    return <CircularProgress size={20} aria-label='Uploading' />;
  }
  if (status === 'failed') return <ErrorOutline color='error' aria-hidden />;
  if (status === 'done') return <CheckCircleOutline color='primary' aria-hidden className='pop' />;
  return <InsertDriveFileOutlined color='primary' aria-hidden />;
}
