'use client';

import { useRef, useState } from 'react';
import {
  ArrowDownward,
  ArrowUpward,
  DeleteOutline,
  EditOutlined,
  PictureAsPdfOutlined,
  UploadFileOutlined,
} from '@mui/icons-material';
import { Alert, Box, Button, IconButton, TextField, Typography } from '@mui/material';

import theme from '@/theme';
import { apiRequest } from '@/lib/apiRequest';
import {
  DOCUMENT_TITLE_MAX_LENGTH,
  IMAGE_MAX_SIDE,
  SLIC_DOCUMENTS_MAX,
  SLIC_DOCUMENT_MAX_BYTES,
  validateDocumentTitle,
} from '@/lib/slicDocumentFile';
import {
  softContainedSx,
  softInputSx,
  softInset,
  softPressSx,
  softRaisedSmall,
} from '@/components/utility/soft';

// A photo ready to upload: as it is when it already fits (a crisp PNG
// screenshot of a map stays crisp), else shrunk to IMAGE_MAX_SIDE as a JPEG.
// → { blob, name, width, height } or throws a message to show.
async function preparePhoto(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Couldn't read that photo here. Try a JPEG or PNG.");
  }
  const { width, height } = bitmap;
  const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(width, height));
  if (scale === 1 && file.size <= SLIC_DOCUMENT_MAX_BYTES && /^image\/(jpeg|png|webp)$/.test(file.type)) {
    bitmap.close?.();
    return { blob: file, name: file.name, width, height };
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) throw new Error("Couldn't shrink that photo. Try another.");
  if (blob.size > SLIC_DOCUMENT_MAX_BYTES) throw new Error('That photo is still too large after shrinking.');
  return { blob, name: 'photo.jpg', width: canvas.width, height: canvas.height };
}

function DocumentRow({ doc, index, count, busy, onRename, onMove, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(doc.title);

  return (
    <Box component='li' sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
      <Box
        sx={{
          width: '3.5rem',
          height: '3.5rem',
          flexShrink: 0,
          borderRadius: 2,
          overflow: 'hidden',
          display: 'grid',
          placeItems: 'center',
          color: 'primary.main',
        }}
      >
        {doc.kind === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={doc.url} alt='' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <PictureAsPdfOutlined />
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              size='small'
              disabled={busy}
              slotProps={{ htmlInput: { maxLength: DOCUMENT_TITLE_MAX_LENGTH, 'aria-label': 'Title' } }}
              sx={[softInputSx, { flex: 1 }]}
            />
            <Button
              size='small'
              disabled={busy}
              onClick={async () => {
                if (await onRename(doc, title)) setEditing(false);
              }}
              sx={[softRaisedSmall, softPressSx, { minHeight: '2.75rem', px: 1.5 }]}
            >
              Save
            </Button>
          </Box>
        ) : (
          <>
            <Typography variant='body2' sx={{ overflowWrap: 'anywhere' }}>
              <a href={doc.url} target='_blank' rel='noopener'>
                {doc.title}
              </a>
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {doc.kind === 'image' ? 'Photo' : 'PDF'}
              {doc.uploadedByName ? ` · added by ${doc.uploadedByName}` : ''}
            </Typography>
          </>
        )}
      </Box>

      {!editing && (
        <IconButton onClick={() => setEditing(true)} disabled={busy} aria-label={`Rename ${doc.title}`} sx={softPressSx}>
          <EditOutlined fontSize='small' />
        </IconButton>
      )}
      <IconButton
        onClick={() => onMove(doc, 'up')}
        disabled={busy || index === 0}
        aria-label={`Move ${doc.title} up`}
        sx={softPressSx}
      >
        <ArrowUpward fontSize='small' />
      </IconButton>
      <IconButton
        onClick={() => onMove(doc, 'down')}
        disabled={busy || index === count - 1}
        aria-label={`Move ${doc.title} down`}
        sx={softPressSx}
      >
        <ArrowDownward fontSize='small' />
      </IconButton>
      <IconButton
        onClick={() => onDelete(doc)}
        disabled={busy}
        aria-label={`Remove ${doc.title}`}
        sx={[softPressSx, { color: 'error.main' }]}
      >
        <DeleteOutline fontSize='small' />
      </IconButton>
    </Box>
  );
}

// A SLIC's photos and PDFs on the edit page (docs/SLIC-DIRECTIONS.md, stage
// 3), such as a railyard map. Saved on their own like the PDF and the route.
// The server checks what each file really is; a phone photo is shrunk here
// first so it fits the upload limit. `documents` is toAdminDocument's shape.
export default function SlicDocuments({ slicId, documents: initial = [] }) {
  const fileRef = useRef(null);
  const [documents, setDocuments] = useState(initial);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const base = `/api/slics/${slicId}/documents`;
  const full = documents.length >= SLIC_DOCUMENTS_MAX;

  const pick = () => {
    const { error } = validateDocumentTitle(title);
    if (error) return setError(error);
    setError('');
    fileRef.current?.click();
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setDone('');
    setBusy(true);
    try {
      const form = new FormData();
      form.append('title', title);
      if (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) {
        if (file.size > SLIC_DOCUMENT_MAX_BYTES) throw new Error('That PDF is too large (4 MB at most).');
        form.append('file', file, file.name);
      } else {
        const photo = await preparePhoto(file);
        form.append('file', photo.blob, photo.name);
        form.append('width', String(photo.width));
        form.append('height', String(photo.height));
      }
      const response = await fetch(base, { method: 'POST', body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Upload failed.');
      setDocuments((list) => [...list, data.document]);
      setTitle('');
      setDone(`Added "${data.document.title}".`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const rename = async (doc, next) => {
    const { title: clean, error } = validateDocumentTitle(next);
    if (error) {
      setError(error);
      return false;
    }
    setBusy(true);
    const { error: apiError } = await apiRequest(`${base}/${doc._id}`, { method: 'PATCH', body: { title: clean } });
    setBusy(false);
    if (apiError) {
      setError(apiError);
      return false;
    }
    setDocuments((list) => list.map((item) => (item._id === doc._id ? { ...item, title: clean } : item)));
    return true;
  };

  const move = async (doc, direction) => {
    setBusy(true);
    const { error } = await apiRequest(`${base}/${doc._id}`, { method: 'PATCH', body: { move: direction } });
    setBusy(false);
    if (error) return setError(error);
    setDocuments((list) => {
      const next = [...list];
      const index = next.findIndex((item) => item._id === doc._id);
      const other = direction === 'up' ? index - 1 : index + 1;
      [next[index], next[other]] = [next[other], next[index]];
      return next;
    });
  };

  const remove = async (doc) => {
    if (!window.confirm(`Remove "${doc.title}"? Drivers won't see it any more.`)) return;
    setBusy(true);
    const { error } = await apiRequest(`${base}/${doc._id}`, { method: 'DELETE' });
    setBusy(false);
    if (error) return setError(error);
    setDocuments((list) => list.filter((item) => item._id !== doc._id));
    setDone(`Removed "${doc.title}".`);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: theme.layout.width.field, mt: 4, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography variant='subtitle1'>Maps &amp; documents</Typography>
      <Typography variant='body2' color='text.secondary'>
        Photos or PDFs drivers see with the directions, such as a railyard map. They&apos;re the
        same from any hub. Never a photo with a gate code on it.
      </Typography>

      {documents.length > 0 && (
        <Box component='ul' sx={[softInset, { listStyle: 'none', m: 0, px: 1.5, py: 0.5, borderRadius: 4 }]}>
          {documents.map((doc, index) => (
            <DocumentRow
              key={doc._id}
              doc={doc}
              index={index}
              count={documents.length}
              busy={busy}
              onRename={rename}
              onMove={move}
              onDelete={remove}
            />
          ))}
        </Box>
      )}

      <input ref={fileRef} type='file' accept='image/*,application/pdf,.pdf' hidden onChange={upload} />
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <TextField
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder='Title, e.g. Railyard map'
          disabled={busy || full}
          slotProps={{ htmlInput: { maxLength: DOCUMENT_TITLE_MAX_LENGTH, 'aria-label': 'New document title' } }}
          sx={[softInputSx, { flex: '1 1 12rem' }]}
        />
        <Button
          variant='contained'
          onClick={pick}
          disabled={busy || full}
          startIcon={<UploadFileOutlined />}
          sx={[softContainedSx, { minHeight: '3rem', px: 3 }]}
        >
          {busy ? 'Working…' : 'Add photo or PDF'}
        </Button>
      </Box>
      {full && (
        <Typography variant='body2' color='text.secondary'>
          That&apos;s the most a SLIC can have ({SLIC_DOCUMENTS_MAX}). Remove one to add another.
        </Typography>
      )}

      <Box role='status' aria-live='polite'>
        {done && <Alert severity='success'>{done}</Alert>}
      </Box>
      {error && <Alert severity='error'>{error}</Alert>}
    </Box>
  );
}
