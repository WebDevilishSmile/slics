'use client';

import NoteCard from './NoteCard';
import ThankYouNote from './ThankYouNote';

// A one-time thank-you on /home after a driver supports the app on Buy Me a
// Coffee (docs/BMC-SUPPORT.md stage 3), as a card with a sealed envelope
// (support/NoteCard.jsx). `support` is the newest support not yet thanked,
// from the server ({ type, receivedAt }). Closing the note, or dismissing the
// card, stamps the support so it won't come back.
export default function SupportThanks({ support, firstName }) {
  if (!support) return null;

  const markThanked = () => {
    // Best effort: if it fails, the card shows once more next visit.
    fetch('/api/users/me/thanks', { method: 'POST' }).catch(() => {});
  };

  return (
    <NoteCard
      name='thank'
      heading={`A note for you${firstName ? `, ${firstName}` : ''}`}
      onDone={markThanked}
      note={({ open, onClose }) => (
        <ThankYouNote
          open={open}
          onClose={onClose}
          type={support.type}
          date={support.receivedAt}
          firstName={firstName}
        />
      )}
    />
  );
}
