'use client';

import { useEffect } from 'react';

// Last-resort boundary: only renders when the root layout itself throws
// (Providers, Header, Footer). It replaces <html> and <body>, and the MUI
// theme provider may be the thing that crashed, so this stays plain HTML.
// Next.js only activates this file in production builds.
function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Unhandled root layout error:', error);
  }, [error]);

  return (
    <html lang='en'>
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h1 style={{ textTransform: 'uppercase', fontWeight: 800 }}>
          Something went wrong.
        </h1>
        <p style={{ maxWidth: '40rem' }}>
          Sorry about that. Try again, or reload the page.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type='button' onClick={() => reset()} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
            Try again
          </button>
          <a href='/' style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
            Go to Home
          </a>
        </div>
        {error?.digest && (
          <p style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.7 }}>
            Error reference: {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}

export default GlobalError;
