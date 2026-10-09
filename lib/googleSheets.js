// Read-only access to the "ON CALL SHEET" through the Google Sheets API v4
// (docs/ON-CALL-SHEET-SYNC.md). It authenticates with an API key, which can
// read a link-shared sheet but can never write to one, so nothing here can
// change the sheet. Server-only: the key must never reach the browser. No
// imports, so the dry-run script can load it in plain Node.

const API = 'https://sheets.googleapis.com/v4/spreadsheets';

// A failed call to Google. The message never includes the request URL, which
// carries the key.
export class SheetsApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'SheetsApiError';
    this.status = status;
  }
}

function config() {
  const key = process.env.GOOGLE_SHEETS_API_KEY;
  const spreadsheetId = process.env.ON_CALL_SHEET_ID;
  if (!key || !spreadsheetId) {
    throw new SheetsApiError('GOOGLE_SHEETS_API_KEY or ON_CALL_SHEET_ID is not set', 500);
  }
  return { key, spreadsheetId };
}

async function get(path, params) {
  const { key, spreadsheetId } = config();
  const query = new URLSearchParams({ ...params, key });
  const response = await fetch(`${API}/${spreadsheetId}${path}?${query}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new SheetsApiError(
      `Sheets API ${response.status}: ${body?.error?.message ?? response.statusText}`,
      response.status
    );
  }
  return response.json();
}

// Every tab's name and id. Names only: no cell data comes back.
export async function listTabs() {
  const data = await get('', { fields: 'sheets.properties(sheetId,title)' });
  return (data.sheets ?? []).map(({ properties }) => ({
    id: properties.sheetId,
    title: properties.title,
  }));
}

// One tab's cells as shown in the sheet (FORMATTED_VALUE), as rows of strings.
// Google trims trailing empty cells and rows, so rows are ragged.
export async function getTabValues(title) {
  const range = `'${title.replace(/'/g, "''")}'`;
  const data = await get(`/values/${encodeURIComponent(range)}`, {
    valueRenderOption: 'FORMATTED_VALUE',
  });
  return data.values ?? [];
}
