'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Alert, Box, Button, CircularProgress, Link, Typography } from '@mui/material';
import { PhoneOutlined } from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';

import { formatBidDay, leadLabel } from '@/lib/bidDay';
import { tapHaptic } from '@/lib/haptics';
import { formatWeekEnding } from '@/lib/onCallSheet';
import CoverListRow from '@/components/covers/CoverListRow';
import { softContainedSx, softInset, softRaised } from '@/components/utility/soft';

const listFormat = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
const listOf = (items) => listFormat.format(items);

const MODIFIERS = [restrictToVerticalAxis, restrictToParentElement];

const SCREEN_READER_INSTRUCTIONS = {
  draggable:
    'To move this job, press Space, then the up and down arrows to choose its place, then Space again to drop it. Escape cancels.',
};

// A verified driver's list for one week on /covers (docs/COVER-BIDDING.md,
// stage 2): the jobs they want, in order, ready to read off when they call
// dispatch at their call-in time. Jobs someone took drop off the list (they
// show quietly under it, and come back if they open up again). A job moves by
// its choice number (pick a place) or its drag handle; moving and removing
// save at once (CoverBoard does the saving). Each row is CoverListRow.
// - `entries`: [{ jobKey, jobNumber, status }] (lib/coverList.js).
// - `jobsByKey`: the week's driver rows by jobKey, for each job's days.
// - `editable`: false for a week that's over, or one the driver is off.
// - `offList`: the driver isn't on this week's posted pick list, so the list
//   is read only and there's no call to make.
// - `callIn`: the driver's call-in time that week, when they're on the list.
// - `bidDate`: the day they call in (lib/bidDay.js).
// - `dispatchPhone`: BETPA's phone (DISPATCH_NUM_SLIC), or null.
// - `preview`: the super admin's preview; the list isn't saved.
// - `reminderLeads`: the driver's call-in reminder times when that
//   notification is on (minutes), said under Call dispatch, or null.
// - `profileHref`: the driver's /profile, where the reminder is changed.
// - `nudge`: the notifications suggestion, after a save (CoverBoard).
// - `onMoveTo(jobKey, place, { drag })`: move a job to an open place
//   (1-based); `drag` when it was dropped there.
// - `lastMoved`: { key, n } for the job that just moved, which glows where it
//   landed; `onMovedShown` when the glow is done.
export default function CoverList({
  weekEnding,
  entries,
  jobsByKey,
  editable,
  offList,
  saving,
  error,
  announcement,
  callIn,
  bidDate,
  dispatchPhone,
  preview = false,
  reminderLeads = null,
  profileHref = null,
  nudge = null,
  onMoveTo,
  onRemove,
  lastMoved = null,
  onMovedShown,
}) {
  const open = entries.filter((entry) => entry.status === 'open');
  const taken = entries.filter((entry) => entry.status !== 'open');
  const movable = editable && open.length > 1;

  // Only the handle starts a drag (it has `touch-action: none`), so a few
  // pixels of movement is enough to tell a drag from a tap.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const numberOf = (key) => open.find((entry) => entry.jobKey === key)?.jobNumber ?? 'The job';
  const placeOf = (key) => open.findIndex((entry) => entry.jobKey === key) + 1;
  // What a screen reader hears while a job is dragged. The drop itself is
  // said by the save ("1234A is now choice 2."), in the live region below.
  const announcements = {
    onDragStart: ({ active }) => `Picked up ${numberOf(active.id)}, choice ${placeOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${numberOf(active.id)} over choice ${placeOf(over.id)}.` : `${numberOf(active.id)} is not over a place.`,
    onDragEnd: ({ active, over }) =>
      over && over.id !== active.id ? '' : `${numberOf(active.id)} stays choice ${placeOf(active.id)}.`,
    onDragCancel: ({ active }) => `Move cancelled. ${numberOf(active.id)} stays choice ${placeOf(active.id)}.`,
  };

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    onMoveTo(active.id, placeOf(over.id), { drag: true });
  };

  return (
    <Box
      component='section'
      aria-labelledby='cover-list-title'
      sx={[softRaised, { borderRadius: 4, p: { xs: 2, sm: 3 }, my: 2.5 }]}
    >
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2 }}>
        <Typography id='cover-list-title' variant='h5' component='h2' sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
          Your list
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {saving && <CircularProgress size={14} aria-label='Saving' />}
          Week ending {formatWeekEnding(weekEnding)}
        </Typography>
      </Box>
      <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
        {editable
          ? 'The jobs you want, in order. Add them with + in the jobs below. Tap a number or drag to reorder. Taken jobs drop off.'
          : offList
            ? "You're not on this week's cover or on-call list, so your list is read only."
            : 'This week is over. Your list is kept for four weeks.'}
        {preview && ' Preview: this list isn’t saved.'}
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={[softInset, { mt: 2, borderRadius: 3, p: 1 }]}>
        {open.length === 0 ? (
          <Typography color='text.secondary' sx={{ p: 1.5 }}>
            {taken.length > 0 ? 'Every job on your list has been taken.' : 'No jobs on your list yet.'}
          </Typography>
        ) : (
          <DndContext
            id='cover-list-dnd'
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={MODIFIERS}
            accessibility={{ announcements, screenReaderInstructions: SCREEN_READER_INSTRUCTIONS }}
            onDragStart={() => tapHaptic()}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={open.map((entry) => entry.jobKey)} strategy={verticalListSortingStrategy}>
              <Box component='ol' sx={{ listStyle: 'none', m: 0, p: 0 }}>
                {open.map((entry, index) => (
                  <CoverListRow
                    key={entry.jobKey}
                    entry={entry}
                    index={index}
                    open={open}
                    job={jobsByKey.get(entry.jobKey)}
                    editable={editable}
                    movable={movable}
                    onMoveTo={onMoveTo}
                    onRemove={onRemove}
                    moved={lastMoved?.key === entry.jobKey ? lastMoved.n : null}
                    onMovedShown={onMovedShown}
                  />
                ))}
              </Box>
            </SortableContext>
          </DndContext>
        )}
      </Box>

      {taken.length > 0 && (
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1.5, px: 1 }}>
          Taken since you added {taken.length === 1 ? 'it' : 'them'}:{' '}
          <Box component='span' sx={{ fontWeight: 700 }}>
            {taken.map((entry) => entry.jobNumber).join(', ')}
          </Box>
          . {taken.length === 1 ? 'It comes' : 'They come'} back if {taken.length === 1 ? 'it opens' : 'they open'} up again.
        </Typography>
      )}

      {dispatchPhone && !offList && (
        <Box sx={{ mt: 2.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
          <Button
            variant='contained'
            href={`tel:${dispatchPhone}`}
            startIcon={<PhoneOutlined />}
            sx={[softContainedSx, { minHeight: '3rem', px: 3 }]}
          >
            Call dispatch
          </Button>
          <Typography variant='body2' color='text.secondary'>
            {callIn ? (
              <>
                Your call-in:{' '}
                <Box component='span' sx={{ color: 'text.primary', fontWeight: 700 }}>
                  {bidDate ? `${formatBidDay(bidDate)} at ${callIn}` : callIn}
                </Box>
                {' · '}
              </>
            ) : null}
            BETPA {dispatchPhone}
          </Typography>
        </Box>
      )}

      {reminderLeads?.length > 0 && profileHref && callIn && !offList && editable && (
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1.5 }}>
          Reminder {listOf(reminderLeads.map(leadLabel))} before your call-in, on each device with
          notifications on. Change it in{' '}
          <Link href={profileHref} sx={{ fontWeight: 600 }}>
            Profile
          </Link>
          .
        </Typography>
      )}

      {nudge && <Box sx={{ mt: 2 }}>{nudge}</Box>}

      <Box aria-live='polite' sx={visuallyHidden}>
        {announcement}
      </Box>
    </Box>
  );
}
