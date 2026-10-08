'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { softInset, softPressSx, softToggleSx } from '@/components/utility/soft';

const ZOOMS = [1, 1.5, 2, 3, 4];

const sourceLabel = (source, index) =>
  `${source.kind === 'pdf' ? 'PDF' : 'Photo'} ${index + 1}`;

const paneSx = (theme) => ({
  ...softInset(theme),
  flex: 1,
  minHeight: 0,
  borderRadius: 2,
});

function Toolbar({ start, source, label, children }) {
  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}
    >
      {start}
      {/* The controls stay together, at the right, wrapping as one. */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
        {children}
        <Tooltip title='Open in a new tab'>
          <IconButton
            component='a'
            href={source.url}
            target='_blank'
            rel='noopener'
            aria-label={`Open ${label} in a new tab`}
            sx={softPressSx}
          >
            <OpenInNewIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

// A photo of the sheet, zoomable, panned by scrolling (or dragging, with a
// mouse). Zoom and scroll are kept per file in `memory`, a ref the uploader
// owns, so stepping to the next job or reopening the review leaves the photo
// where it was: the next job is usually the next printed row down.
function ImagePane({ source, label, start, memory }) {
  const scrollRef = useRef(null);
  const anchor = useRef(null);
  const drag = useRef(null);
  const [zoom, setZoom] = useState(() => memory.current[source.id]?.zoom ?? 1);

  const remember = () => {
    const el = scrollRef.current;
    memory.current[source.id] = { zoom, left: el.scrollLeft, top: el.scrollTop };
  };

  // Zoom around the middle of what's showing, not the top-left corner.
  const changeZoom = (next) => {
    const el = scrollRef.current;
    anchor.current = {
      x: (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth,
      y: (el.scrollTop + el.clientHeight / 2) / el.scrollHeight,
    };
    setZoom(next);
  };

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!anchor.current) return;
    el.scrollLeft = anchor.current.x * el.scrollWidth - el.clientWidth / 2;
    el.scrollTop = anchor.current.y * el.scrollHeight - el.clientHeight / 2;
    anchor.current = null;
    memory.current[source.id] = { zoom, left: el.scrollLeft, top: el.scrollTop };
  }, [zoom, memory, source.id]);

  // The photo has no height until it loads, so that's when the scroll goes back.
  const restoreScroll = () => {
    const saved = memory.current[source.id];
    if (!saved) return;
    scrollRef.current.scrollLeft = saved.left;
    scrollRef.current.scrollTop = saved.top;
  };

  const endDrag = () => {
    drag.current = null;
  };

  const zoomStep = ZOOMS.indexOf(zoom);

  return (
    <>
      <Toolbar start={start} source={source} label={label}>
        <IconButton
          aria-label='Zoom out'
          onClick={() => changeZoom(ZOOMS[zoomStep - 1])}
          disabled={zoomStep === 0}
          sx={softPressSx}
        >
          <ZoomOutIcon />
        </IconButton>
        <Tooltip title='Fit to width'>
          <span>
            <Button
              onClick={() => changeZoom(1)}
              disabled={zoom === 1}
              aria-label={`Fit to width (zoom is ${zoom * 100}%)`}
              sx={[softPressSx, { minWidth: '4rem', fontVariantNumeric: 'tabular-nums' }]}
            >
              {zoom * 100}%
            </Button>
          </span>
        </Tooltip>
        <IconButton
          aria-label='Zoom in'
          onClick={() => changeZoom(ZOOMS[zoomStep + 1])}
          disabled={zoomStep === ZOOMS.length - 1}
          sx={softPressSx}
        >
          <ZoomInIcon />
        </IconButton>
      </Toolbar>

      <Box
        ref={scrollRef}
        role='region'
        aria-label={`${label} of the bid sheet`}
        tabIndex={0}
        onScroll={remember}
        onPointerDown={(event) => {
          if (event.pointerType !== 'mouse' || event.button !== 0) return;
          const el = scrollRef.current;
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            left: el.scrollLeft,
            top: el.scrollTop,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const el = scrollRef.current;
          el.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
          el.scrollTop = drag.current.top - (event.clientY - drag.current.y);
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        sx={[
          paneSx,
          {
            overflow: 'auto',
            p: 1,
            cursor: zoom > 1 ? 'grab' : 'default',
            '&:active': { cursor: zoom > 1 ? 'grabbing' : 'default' },
          },
        ]}
      >
        <Box
          component='img'
          src={source.url}
          alt={`Bid sheet, ${label}`}
          draggable={false}
          onLoad={restoreScroll}
          sx={{
            display: 'block',
            width: `${zoom * 100}%`,
            maxWidth: 'none',
            height: 'auto',
            borderRadius: 1,
            userSelect: 'none',
          }}
        />
      </Box>
    </>
  );
}

// A PDF goes to the browser's own viewer, opened at the row's page. Phones
// that can't show a PDF inline (Android) get the new-tab button instead.
function PdfPane({ source, label, start, page }) {
  const inline =
    typeof navigator === 'undefined' || navigator.pdfViewerEnabled !== false;

  return (
    <>
      <Toolbar start={start} source={source} label={label} />
      {inline ? (
        <Box
          component='iframe'
          key={page}
          src={`${source.url}#page=${page ?? 1}`}
          title={`Bid sheet, ${label}`}
          sx={[paneSx, { width: 1, border: 0 }]}
        />
      ) : (
        <Box sx={[paneSx, { p: 3 }]}>
          <Typography variant='body2'>
            This browser can&apos;t show the PDF here. Open it in a new tab
            with the button above
            {page ? `, and go to page ${page}` : ''}.
          </Typography>
        </Box>
      )}
    </>
  );
}

// The uploaded files a job was read from, next to its fields in the review
// dialog, so each value can be checked against the sheet itself. `index` is
// the file to show (the row's own, from the extraction, or the admin's pick);
// with more than one file, a toggle switches between them.
export default function BidSheetSourceViewer({
  sources,
  index,
  onIndexChange,
  page,
  memory,
  sx,
}) {
  const shown = Math.min(Math.max(index ?? 0, 0), sources.length - 1);
  const source = sources[shown];
  const label = sourceLabel(source, shown);

  const start = sources.length > 1 && (
    <Box
      role='group'
      aria-label='Uploaded files'
      sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
    >
      {sources.map((file, i) => (
        <Button
          key={file.id}
          aria-pressed={i === shown}
          onClick={() => onIndexChange(i)}
          title={file.name}
          sx={[softToggleSx, { borderRadius: 999, px: 2, minHeight: '2.5rem' }]}
        >
          {sourceLabel(file, i)}
        </Button>
      ))}
    </Box>
  );

  return (
    <Box
      sx={[
        { display: 'flex', flexDirection: 'column', minHeight: 0 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {source.kind === 'pdf' ? (
        <PdfPane key={source.id} source={source} label={label} start={start} page={page} />
      ) : (
        <ImagePane
          key={source.id}
          source={source}
          label={label}
          start={start}
          memory={memory}
        />
      )}
    </Box>
  );
}
