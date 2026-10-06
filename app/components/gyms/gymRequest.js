// One fetch wrapper for every gym / gym-comment mutation on the Planet Fitness
// page. Resolves `{ data }` on success or `{ error }` with a message to show —
// the API's own `{ error }` string when there is one (SUGGESTIONS.md #14).
export async function gymRequest(url, { method = 'POST', body } = {}) {
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
