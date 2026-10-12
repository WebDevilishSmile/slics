import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

// The preview card a link to SLICs gets in a text thread or a post: the app
// icon, the name and the tagline from the landing page, in the light scheme's
// colors (`tokens` in theme.js). Rendered once at build time. Its path,
// /opengraph-image, is public in middleware.js, or crawlers would get the
// sign-in redirect.
export const alt = 'SLICs: the Feeder binder, on your phone';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const icon = await readFile(join(process.cwd(), 'public/slics-icon.svg'));
  const iconSrc = `data:image/svg+xml;base64,${icon.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 56,
          padding: '0 80px',
          background: '#edf3fc',
          color: 'rgba(0, 0, 0, 0.87)', // text.primary
        }}
      >
        {/* ImageResponse draws plain <img>; next/image doesn't apply here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconSrc}
          width={240}
          height={240}
          alt=''
          style={{ borderRadius: 56 }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 120, fontWeight: 700, letterSpacing: -2 }}>
            SLICs
          </div>
          <div style={{ fontSize: 44, color: '#0172b5' }}>
            The Feeder binder, on your phone.
          </div>
          <div
            style={{ fontSize: 30, color: 'rgba(0, 0, 0, 0.6)', marginTop: 8 }}
          >
            Addresses, directions, phone numbers and driver tips.
          </div>
        </div>
      </div>
    ),
    size
  );
}
