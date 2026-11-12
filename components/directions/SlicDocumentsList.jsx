'use client';

import { useState } from 'react';
import { Close, OpenInNew, PictureAsPdfOutlined } from '@mui/icons-material';
import { Box, Button, Dialog, DialogContent, IconButton, Typography } from '@mui/material';

import { softPressSx, softRaised, softRaisedSmall } from '@/components/utility/soft';

// A photo full screen: as large as the screen allows, with "Open full size"
// for pinch-zooming in the browser's own viewer.
function PhotoViewer({ doc, onClose }) {
  return (
    <Dialog open onClose={onClose} fullScreen slotProps={{ paper: { sx: { borderRadius: 0 } } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1 }}>
        <Typography variant='h6' component='h2' sx={{ flex: 1, minWidth: 0 }} noWrap>
          {doc.title}
        </Typography>
        <Button
          href={doc.url}
          target='_blank'
          rel='noopener'
          startIcon={<OpenInNew />}
          sx={[softPressSx, { minHeight: '3rem', px: 1.5, flexShrink: 0 }]}
        >
          Full size
        </Button>
        <IconButton onClick={onClose} aria-label='Close' sx={[softPressSx, { flexShrink: 0 }]}>
          <Close />
        </IconButton>
      </Box>
      <DialogContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1 }}>
        {/* A Blob URL straight to the browser: next/image would route it
            through the image optimizer, a function call per photo. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={doc.url}
          alt={doc.title}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      </DialogContent>
    </Dialog>
  );
}

// A SLIC's photos and PDFs in the directions sheet (docs/SLIC-DIRECTIONS.md,
// stage 3): photos as tiles that open full screen, PDFs as buttons that open
// in a new tab. `documents` is toDriverDocument's shape.
export default function SlicDocumentsList({ documents }) {
  const [viewing, setViewing] = useState(null);
  const photos = documents.filter((doc) => doc.kind === 'image');
  const pdfs = documents.filter((doc) => doc.kind === 'pdf');

  return (
    <Box component='section' aria-labelledby='slic-documents' sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography id='slic-documents' variant='h6' component='h3'>
        Maps &amp; documents
      </Typography>

      {photos.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(9rem, 1fr))', gap: 1.5 }}>
          {photos.map((doc) => (
            <Box
              key={doc._id}
              component='button'
              type='button'
              onClick={() => setViewing(doc)}
              aria-label={`Open ${doc.title}`}
              aria-haspopup='dialog'
              sx={[
                softRaised,
                softPressSx,
                {
                  border: 0,
                  cursor: 'pointer',
                  borderRadius: 4,
                  p: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.75,
                  textAlign: 'left',
                  font: 'inherit',
                  color: 'text.primary',
                },
              ]}
            >
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: doc.width && doc.height ? `${doc.width} / ${doc.height}` : '4 / 3',
                  maxHeight: '10rem',
                  overflow: 'hidden',
                  borderRadius: 3,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={doc.url}
                  alt=''
                  loading='lazy'
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </Box>
              <Typography variant='body2' sx={{ px: 0.5, overflowWrap: 'anywhere' }}>
                {doc.title}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {pdfs.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {pdfs.map((doc) => (
            <Button
              key={doc._id}
              href={doc.url}
              target='_blank'
              rel='noopener'
              startIcon={<PictureAsPdfOutlined />}
              sx={[softRaisedSmall, softPressSx, { minHeight: '3rem', px: 2 }]}
            >
              {doc.title}
            </Button>
          ))}
        </Box>
      )}

      {viewing && <PhotoViewer doc={viewing} onClose={() => setViewing(null)} />}
    </Box>
  );
}
