import { NextResponse } from 'next/server';

// An error the data layer throws on purpose, with the status and the message
// a route should answer with: a 404 for a missing SLIC, a 400 for a bad field
// (docs/SECURITY.md #23). Anything else that's thrown is unexpected, and its
// text never reaches the browser.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

// A route's catch: an HttpError's own status and message, otherwise a 500
// with `fallback`. The caller has already console.error'd the error.
export function errorResponse(error, fallback = 'Internal server error') {
  // A body that isn't JSON: request.json() throws a SyntaxError.
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: fallback }, { status: 500 });
}
