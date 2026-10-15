'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

// The parts of a session the client reads. `expires` is left out: it moves on
// every request, and would make every server render look like a change.
const sessionKey = (session) =>
  session?.user
    ? JSON.stringify([
        session.user.id,
        session.user.role,
        session.user.bmcMember,
        session.user.superAdmin,
        session.user.driverVerified,
        session.features,
      ])
    : '';

// SessionProvider reads the session Providers hands it only once. When a later
// server render of the root layout sees a different one (a sign-out by server
// action, a Buy Me a Coffee membership picked up by RefreshOnReturn), this
// brings the client's copy up to date with one fetch. Nothing else re-fetches
// it: refetchOnWindowFocus is off.
export default function SessionSync({ session }) {
  const { data, status, update } = useSession();
  const server = sessionKey(session);
  const synced = useRef(server);

  useEffect(() => {
    if (status === 'loading' || synced.current === server) return;
    synced.current = server;
    if (sessionKey(data) !== server) update();
  }, [server, status, data, update]);

  return null;
}
