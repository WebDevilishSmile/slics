import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

import { requireSuperAdmin } from '@/lib/authz';
import {
  attachmentKind,
  EMAIL_ATTACHMENT_PREFIX,
  EMAIL_ATTACHMENTS_MAX_BYTES,
} from '@/lib/emailAttachments';
import { checkRateLimit } from '@/lib/rateLimit';

// Hands the compose form on /admin/super/email a one-time token to upload a
// file straight from the browser to Vercel Blob (lib/emailAttachments.js says
// why). Super admin only. The token allows one file, under
// `email-attachments/`, of the type its name says, for ten minutes. Nothing
// is trusted from it later: POST /api/emails checks the URL is this store's
// and reads the file's first bytes before attaching it.

const LIMIT = 60;
const WINDOW_MS = 60 * 60 * 1000; // an hour
const TOKEN_MINUTES = 10;

export async function POST(request) {
  const { session, denied } = await requireSuperAdmin();
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Only token requests. Without onUploadCompleted no callback is asked for,
  // so Blob never posts here itself.
  if (body?.type !== 'blob.generate-client-token') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const rate = await checkRateLimit({
    key: `email-attachment:${session.user.id}`,
    limit: LIMIT,
    windowMs: WINDOW_MS,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "You've attached a lot of files. Please try again later." },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        const kind = attachmentKind(pathname);
        if (!pathname.startsWith(EMAIL_ATTACHMENT_PREFIX) || pathname.includes('..') || !kind) {
          throw new Error('Not an email attachment.');
        }
        return {
          allowedContentTypes: [kind.contentType],
          maximumSizeInBytes: EMAIL_ATTACHMENTS_MAX_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + TOKEN_MINUTES * 60 * 1000,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error making an email attachment upload token:', error?.message ?? 'Error');
    return NextResponse.json({ error: "That file can't be attached." }, { status: 400 });
  }
}
