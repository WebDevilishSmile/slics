'use client';

import LetterNote from './LetterNote';

// The note's words for each kind of support (`bmc-events` types).
export function noteCopy(type, firstName) {
  const name = firstName ? `, ${firstName}` : '';
  const why =
    'I build SLICs on my own time, so every driver can find the next stop easily.';
  if (type === 'membership.started') {
    return {
      title: `Welcome aboard${name}!`,
      paragraphs: [
        'Thank you for becoming a member. Your SLIC History is waiting for you in the menu.',
        `${why} Your membership keeps it running for all of us.`,
      ],
    };
  }
  if (type === 'recurring_donation.started') {
    return {
      title: `Thank you${name}!`,
      paragraphs: [
        'Thank you for supporting SLICs every month.',
        `${why} Support like yours keeps it running for all of us.`,
      ],
    };
  }
  return {
    title: `Thank you${name}!`,
    paragraphs: [
      'Your coffee made my day.',
      `${why} Support like yours keeps it running for all of us.`,
    ],
  };
}

// The thank-you note (docs/BMC-SUPPORT.md stage 3), in the envelope with the
// coffee cup on its seal (support/LetterNote.jsx). Its letterhead is a heart
// that beats twice and turns into the SLICs mark once Tiago has signed. `type`
// is the support's event type and `date` when it came in (ISO; the letter is
// dated with it). A membership's note opens SLIC History.
export default function ThankYouNote({ open, onClose, type, date, firstName }) {
  const { title, paragraphs } = noteCopy(type, firstName);
  return (
    <LetterNote
      open={open}
      onClose={onClose}
      name='thank'
      label='A thank-you note from Tiago'
      story='heart'
      date={date}
      title={title}
      paragraphs={paragraphs}
      closing='With gratitude,'
      action={type === 'membership.started' ? { href: '/history', label: 'Open SLIC History' } : null}
    />
  );
}
