# The ON CALL SHEET notifier (your Apps Script)

A small Google Apps Script, run from your own Google account, that tells the SLICs app
when the ON CALL SHEET changes:

- When the **Jobs** tab is edited, the app re-reads it, records what changed, and alerts
  you on the admin pages.
- When a **dated tab** (`10/17/2026`) is edited, the app quietly updates that cover week's
  jobs and picks, if the week isn't over yet.
- **Edits anywhere else** (ON CALL, HUB Drivers, SHIFTERS…) send nothing.

The app side is stage 3 of `docs/ON-CALL-SHEET-SYNC.md`. **Until it's deployed,
`testPing` answers 404.** You can install the script before then; its pings just go
nowhere.

## What it does and doesn't do

**It does:**

- On an edit, read the **name** of the tab that was edited.
- Send the app one small message: `{ "tab": "Jobs" }`, or `{ "changeType": "INSERT_ROW" }`
  when rows, columns or tabs are added or removed.

**It doesn't:**

- Read cells.
- Write anything to the sheet.
- Send any of the sheet's contents.

The app then reads the sheet on its own, read-only, with its API key.

**Why a standalone script** (script.google.com), not Extensions → Apps Script on the sheet:
anyone with the sheet's link can edit it, and anyone who can edit a sheet can open, read
(secret included) or delete a script attached to it. A standalone project is private to
your account.

**Tell your superior.** It changes nothing, but a one-line heads-up is better than them
finding out later. For example: "I'm running a read-only notifier from my own Google
account so the app updates when the sheet changes. It doesn't touch the sheet."

## You'll need

- **Your Google account** that can open the sheet.
  - Setting up a trigger on a sheet needs edit access, which the link gives you. The
    script never uses it.
  - If the sheet's sharing ever changes so you lose access, the script stops. The daily
    backstop and the Refresh buttons still work.
- **The sheet ID:** the part of the sheet's address between `/d/` and `/edit`. It's also
  `ON_CALL_SHEET_ID` in `.env`.
- **The webhook secret:** `ON_CALL_SHEET_WEBHOOK_SECRET`, generated in stage 3
  (`openssl rand -hex 32`) and set in `.env` and on Vercel. The script stores the same
  value as `APP_SECRET`.

## Install

1. Go to **https://script.google.com** → **New project**. Rename it
   **SLICs sheet notifier**.
2. Replace everything in `Code.gs` with the script below. Put the sheet ID on the first
   line, then save (Ctrl+S).
3. **Project Settings** (⚙) → **Script properties** → **Add script property**.
   **Property:** `APP_SECRET`. **Value:** the webhook secret. Save.
4. Back in the **Editor** (< >), choose **install** in the dropdown next to **Run**, then
   click **Run**.
   - **First time:** **Review permissions** → your account. On "Google hasn't verified
     this app", click **Advanced** → **Go to SLICs sheet notifier (unsafe)**. That's normal
     for your own script. Then **Allow**.
   - Google asks for Sheets access because watching a sheet requires it. The script only
     reads the edited tab's name.
   - The log should say `Watching the sheet…`.
5. Choose **testPing** → **Run**. Once stage 3 is deployed, the log says
   `Success: the SLICs app received the test.`

```javascript
// SLICs sheet notifier
// Tells the SLICs app when the ON CALL SHEET changes. It reads only the name
// of the tab that was edited and never changes the sheet; the app then reads
// the sheet itself, read-only. Edits to tabs the app doesn't use send nothing.

const SHEET_ID = 'PASTE_SHEET_ID_HERE';
const APP_URL = 'https://slics.vercel.app/api/webhooks/on-call-sheet';
// A tab whose whole name is a date (10/17/2026, 6/01/24, 03.04.23) is a cover week.
const DATE_TAB = /^\s*\d{1,2}[\/.]\d{1,2}[\/.](\d{2}|\d{4})\s*$/;

// Run once to start watching. Safe to run again: it replaces the old triggers.
function install() {
  removeTriggers_();
  ScriptApp.newTrigger('onSheetEdit').forSpreadsheet(SHEET_ID).onEdit().create();
  ScriptApp.newTrigger('onSheetChange').forSpreadsheet(SHEET_ID).onChange().create();
  Logger.log('Watching the sheet. Edits to Jobs and the dated tabs will notify the SLICs app.');
}

// Run to stop watching. Nothing else to undo.
function uninstall() {
  removeTriggers_();
  Logger.log('Stopped. The SLICs app is no longer notified.');
}

// Run to check the app gets the message. Changes nothing anywhere.
function testPing() {
  const code = send_({ changeType: 'TEST' });
  Logger.log(code === 200 || code === 202
    ? 'Success: the SLICs app received the test.'
    : 'The app answered ' + code + ' (401/403: APP_SECRET is wrong; 404: the app side is not deployed yet).');
}

// A cell was edited: say which tab, only if the app reads it.
function onSheetEdit(e) {
  const tab = e.range.getSheet().getName();
  if (tab.trim().toLowerCase() === 'jobs' || DATE_TAB.test(tab)) send_({ tab: tab });
}

// Rows, columns or tabs were added or removed. Google doesn't say where, so
// the app re-reads everything it uses. Plain edits are onSheetEdit's job.
function onSheetChange(e) {
  if (e.changeType !== 'EDIT') send_({ changeType: e.changeType });
}

function send_(body) {
  const secret = PropertiesService.getScriptProperties().getProperty('APP_SECRET');
  if (!secret) throw new Error('APP_SECRET is missing: Project Settings → Script properties.');
  const response = UrlFetchApp.fetch(APP_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-sheet-secret': secret },
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });
  return response.getResponseCode();
}

function removeTriggers_() {
  ScriptApp.getProjectTriggers()
    .filter(function (trigger) {
      return ['onSheetEdit', 'onSheetChange', 'ping'].indexOf(trigger.getHandlerFunction()) !== -1;
    })
    .forEach(function (trigger) { ScriptApp.deleteTrigger(trigger); });
}
```

## Day to day

- **Is it running?** In the script project, **Triggers** (⏰) should list two triggers:
  `onSheetEdit` "From spreadsheet – On edit" and `onSheetChange` "From spreadsheet – On
  change".
- **Recent runs:** **Executions**. Each run is one edit by someone on the sheet.
  `onSheetEdit` runs for every edit, but only sends for Jobs and dated tabs.
- **Failures:** Google emails you when runs keep failing. The app also shows on
  `/admin/jobs` when it last heard from the sheet, and warns after 2 days of silence.
- **Changing the secret:** set the new value on Vercel, redeploy, and update `APP_SECRET`
  in Script properties. No code change.

## Turning it off

None of these affects the sheet:

- **From the code:** run **uninstall**.
- **From the Triggers page:** delete both triggers.
- **Remove it completely:** at script.google.com, use the ⋮ menu on the project and choose
  **Remove**.

To turn it back on, run **install**.

## Limits

- **Free:** it stays well within Apps Script's free quotas. A run takes about a second,
  and only edits to Jobs and dated tabs send anything.
- **Bursts:** while drivers enter picks, edits come in bursts. The app combines
  overlapping pings (stage 3's sync lock), so the last edit is always read.
- **No editor slowdown:** edits made in the sheet aren't slowed down; triggers run
  separately, after the edit is saved.
- **Script edits aren't caught:** Google doesn't fire `onEdit` for changes made by other
  scripts or the API. If someone fills the sheet that way, the daily backstop or a Refresh
  press catches it.
