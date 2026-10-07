// Fetch wrapper for the client components that call this app's own API
// (gyms, places). Resolves `{ data }` on success or `{ error }` with a message
// to show — the API's own `{ error }` string when there is one
// (SUGGESTIONS.md #14). Defaults to POST; pass `method: 'GET'` to read.
export async function apiRequest(url, { method = 'POST', body } = {}) {
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { error: 'Network error. Check your connection and try again.' };
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { error: data.error || 'Something went wrong. Please try again.' };
  }
  return { data };
}
