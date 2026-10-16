'use client';

import { KEY } from '@/components/support/Envelope';
import NoteCard from '@/components/support/NoteCard';

import WelcomeNote from './WelcomeNote';

// A one-time card on /home after someone is made an admin or a dispatcher
// (docs/STAFF-ROLES.md): a sealed envelope (support/NoteCard.jsx) holding the
// welcome note. `notice` is { role, at } from getRoleNotice (lib/db/users.js);
// `areas` the tools the role has. Opening the note, or dismissing the card,
// clears it so it won't come back.
export default function WelcomeCard({ notice, areas, firstName }) {
  if (!notice) return null;

  const markSeen = () => {
    // Best effort: if it fails, the card shows once more next visit.
    fetch('/api/users/me/role-notice', { method: 'POST' }).catch(() => {});
  };

  return (
    <NoteCard
      name='welcome'
      heading={`A welcome note for you${firstName ? `, ${firstName}` : ''}`}
      seal={KEY}
      onDone={markSeen}
      note={({ open, onClose }) => (
        <WelcomeNote
          open={open}
          onClose={onClose}
          role={notice.role}
          areas={areas}
          date={notice.at}
          firstName={firstName}
        />
      )}
    />
  );
}
