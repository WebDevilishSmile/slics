'use client';

import { ROLE_LABELS, STAFF_AREA_KEYS } from '@/constants';
import LetterNote from '@/components/support/LetterNote';
import { KEY } from '@/components/support/Envelope';
import { areaEntries, areaList } from '@/lib/staffAreas';

// Where each staff role finds its tools.
const HUBS = { admin: '/admin', dispatch: '/dispatch' };

// What the role's tools let them do, in a sentence. One tool says what it's
// for ("You can now add, edit and delete SLICs and their PDFs."); several are
// listed; every tool is said once.
function toolsLine(areas) {
  if (areas.length === STAFF_AREA_KEYS.length) return 'You can use every admin tool, from SLICs to Covers.';
  if (areas.length === 1) {
    const { description } = areaEntries(areas)[0];
    return `You can now ${description.charAt(0).toLowerCase()}${description.slice(1)}`;
  }
  if (areas.length > 1) return `Your tools: ${areaList(areas)}.`;
  return 'Your tools will be there as soon as they’re turned on.';
}

// The note's words for a role (`admin` or `dispatch`) and the tools it has
// (`areas`, keys).
export function welcomeCopy(role, areas, firstName) {
  const name = firstName ? `, ${firstName}` : '';
  const hub = ROLE_LABELS[role];
  return {
    title: role === 'admin' ? `Welcome to the team${name}!` : `Welcome to Dispatch${name}!`,
    paragraphs: [
      `${role === 'admin' ? 'You’re a SLICs admin now.' : 'You’re on Dispatch in SLICs now.'} ${toolsLine(areas)}`,
      `Thank you for helping keep SLICs right for every driver. You’ll find your tools under ${hub} in the menu.`,
    ],
  };
}

// The welcome note someone gets once when they're made an admin or a
// dispatcher (docs/STAFF-ROLES.md), in the envelope with a key on its seal
// (support/LetterNote.jsx). Its letterhead starts as the logo's dot alone,
// which draws the S once Tiago has signed (AnimatedSlicsMark's `dot` story).
// `date` is when the role was given (ISO); the main action opens their hub.
export default function WelcomeNote({ open, onClose, role, areas, date, firstName }) {
  const { title, paragraphs } = welcomeCopy(role, areas, firstName);
  return (
    <LetterNote
      open={open}
      onClose={onClose}
      name='welcome'
      label='A welcome note from Tiago'
      story='dot'
      seal={KEY}
      date={date}
      title={title}
      paragraphs={paragraphs}
      closing='Glad to have you,'
      action={{ href: HUBS[role], label: `Open ${ROLE_LABELS[role]}` }}
    />
  );
}
