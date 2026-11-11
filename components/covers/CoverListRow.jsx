'use client';

import { useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Button,
  ButtonBase,
  IconButton,
  ListSubheader,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { CloseOutlined, DragIndicator, UndoOutlined } from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';

import { DAY_FIELDS, DAY_LABELS, formatDayValue } from '@/lib/dayFormat';
import {
  softListItemSx,
  softPressSx,
  softRaised,
  softRaisedSmall,
} from '@/components/utility/soft';

// "Mon–Fri 06:00" when every day starts at the same time, otherwise each day
// with its time ("Mon 06:00 · Tue 07:30").
function daysSummary(job) {
  if (!job) return '';
  const days = DAY_FIELDS.filter((day) => job[day]);
  if (days.length === 0) return '';
  const times = new Set(days.map((day) => job[day]));
  if (times.size === 1) {
    const span =
      days.length > 2 && DAY_FIELDS.indexOf(days.at(-1)) - DAY_FIELDS.indexOf(days[0]) === days.length - 1
        ? `${DAY_LABELS[days[0]]}–${DAY_LABELS[days.at(-1)]}`
        : days.map((day) => DAY_LABELS[day]).join(' ');
    return `${span} ${formatDayValue(job[days[0]])}`;
  }
  return days.map((day) => `${DAY_LABELS[day]} ${formatDayValue(job[day])}`).join(' · ');
}

// A job key as a view-transition-name: letters, digits and dashes only (a
// key can hold a space or a slash), with its char codes so two keys that
// differ only in those never share a name.
const transitionId = (key) =>
  key.replace(/[^A-Za-z0-9-]/g, (char) => `_${char.charCodeAt(0)}`);

const iconButtonSx =[softPressSx, { width: '2.75rem', height: '2.75rem', flexShrink: 0 }];

const badgeSx = [
  softRaisedSmall,
  {
    width: '2.75rem',
    height: '2.75rem',
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'primary.main',
    typography: 'body2',
    fontWeight: 800,
  },
];

// A row's choice number. On a list the driver can change, it's a button that
// opens "Move 1234A to": every open place with the job there now, so they see
// what they'd push down. Picking one moves the job there in one save.
function ChoiceBadge({ entry, index, open, movable, onMoveTo }) {
  const [anchor, setAnchor] = useState(null);
  const menuId = `cover-move-${index}`;

  if (!movable) {
    return (
      <Box aria-hidden='true' sx={badgeSx}>
        {index + 1}
      </Box>
    );
  }

  const close = () => setAnchor(null);
  return (
    <>
      <ButtonBase
        aria-label={`Choice ${index + 1}, ${entry.jobNumber}. Move to another place`}
        aria-haspopup='menu'
        aria-expanded={anchor ? 'true' : undefined}
        aria-controls={anchor ? menuId : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={[...badgeSx, softPressSx]}
      >
        {index + 1}
      </ButtonBase>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        slotProps={{ paper: { sx: { maxHeight: '60vh', minWidth: '12rem' } } }}
      >
        <ListSubheader sx={{ bgcolor: 'transparent', position: 'static', lineHeight: 2.5, fontWeight: 700 }}>
          Move {entry.jobNumber} to
        </ListSubheader>
        {open.map((other, place) => (
          <MenuItem
            key={other.jobKey}
            selected={place === index}
            onClick={() => {
              close();
              if (place !== index) onMoveTo(entry.jobKey, place + 1);
            }}
            sx={[softListItemSx, { minHeight: '2.75rem', gap: 1 }]}
          >
            <Box component='span' sx={{ fontWeight: 800, minWidth: '1.5rem' }}>
              {place + 1}
            </Box>
            <Box component='span' sx={{ color: place === index ? 'inherit' : 'text.secondary' }}>
              {other.jobNumber}
            </Box>
            {place === index && (
              <Box component='span' sx={visuallyHidden}>
                (its place now)
              </Box>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

// Where a job removed with × was, for a few seconds: its number and Undo,
// which puts it back in its place (CoverBoard). Removing it took focus away
// with the ×, so focus lands on Undo when nothing else holds it.
// `component`: 'li' inside the list, 'div' under the empty-list message.
export function UndoRow({ jobNumber, onUndo, component = 'li' }) {
  const undoRef = useRef(null);
  useEffect(() => {
    if (!document.activeElement || document.activeElement === document.body) undoRef.current?.focus();
  }, []);

  return (
    <Box
      component={component}
      className='enter'
      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 0.75, minHeight: '3.5rem' }}
    >
      <Typography variant='body2' color='text.secondary' sx={{ flex: 1, minWidth: 0, pl: 1 }}>
        <Box component='span' sx={{ fontWeight: 700 }}>
          {jobNumber}
        </Box>{' '}
        removed
      </Typography>
      <Button
        ref={undoRef}
        startIcon={<UndoOutlined />}
        onClick={onUndo}
        aria-label={`Undo: put ${jobNumber} back on your list`}
        sx={[softRaisedSmall, softPressSx, { minHeight: '2.75rem', px: 2, flexShrink: 0 }]}
      >
        Undo
      </Button>
    </Box>
  );
}

// One open job on a driver's cover list (covers/CoverList.jsx): its choice
// number (a button that moves it), the job and its days, the drag handle and
// the remove button. The row is sortable (dnd-kit): only the handle starts a
// drag, so the rest of the row still scrolls the page on a phone, and the
// handle works from the keyboard too (Space, the arrows, Space).
// - `open`: every open entry, in order, for the number picker.
// - `job`: the week's driver row for this entry (its days), or undefined.
// - `editable`: the remove button shows; `movable` (editable, and more than
//   one open job) adds the picker and the handle.
// - `moved`: a number while this job glows where it just landed (a new one
//   replays the glow), else null; `onMovedShown` when the glow ends.
export default function CoverListRow({
  entry,
  index,
  open,
  job,
  editable,
  movable,
  onMoveTo,
  onRemove,
  moved = null,
  onMovedShown,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.jobKey, disabled: !movable });
  const theme = useTheme();
  // dnd-kit's own transition is for `transform` (or none while this row is
  // dragged); the lift on press eases in beside it.
  const lift = `${theme.transitions.duration.shortest}ms var(--ease-out)`;

  return (
    <Box
      component='li'
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition: [transition, `box-shadow ${lift}`, `scale ${lift}`].filter(Boolean).join(', '),
      }}
      sx={[
        {
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1,
          py: 0.75,
          borderRadius: 3,
          // Rows slide to their places after a pick from the number menu
          // (withViewTransition in CoverBoard). One name per row.
          viewTransitionName: `cover-row-${transitionId(entry.jobKey)}`,
        },
        // Floats from the moment the handle is pressed (CoverList's sensor
        // starts the drag on press), so the driver knows they've got it.
        isDragging && ((t) => ({ ...softRaised(t), zIndex: 1, scale: '1.02' })),
      ]}
    >
      {moved !== null && (
        // The brand-blue tint that shows where the job landed (.just-posted in
        // app/globals.css, stilled under reduced motion). Keyed by the move,
        // so a second move of the same job glows again.
        <Box
          key={moved}
          aria-hidden='true'
          className='just-posted'
          onAnimationEnd={() => onMovedShown?.()}
          sx={{ position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none' }}
        />
      )}
      <ChoiceBadge entry={entry} index={index} open={open} movable={movable} onMoveTo={onMoveTo} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700 }}>
          <Box component='span' sx={visuallyHidden}>
            Choice {index + 1}:{' '}
          </Box>
          {entry.jobNumber}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          {daysSummary(job)}
        </Typography>
      </Box>
      {movable && (
        <IconButton
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${entry.jobNumber}`}
          sx={[
            ...iconButtonSx,
            {
              touchAction: 'none',
              cursor: isDragging ? 'grabbing' : 'grab',
              // A long press on iOS must not select text or open a callout.
              WebkitUserSelect: 'none',
              userSelect: 'none',
              WebkitTouchCallout: 'none',
            },
          ]}
        >
          <DragIndicator fontSize='small' />
        </IconButton>
      )}
      {editable && (
        <IconButton
          aria-label={`Remove ${entry.jobNumber} from your list`}
          onClick={() => onRemove(entry.jobKey)}
          sx={iconButtonSx}
        >
          <CloseOutlined fontSize='small' />
        </IconButton>
      )}
    </Box>
  );
}
