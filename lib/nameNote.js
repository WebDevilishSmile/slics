// A NAME cell on a cover tab that dispatch marked as a note, not a driver
// (since 2026-11-11, docs/print/ON-CALL-SHEET-CONVENTIONS.pdf): it starts with an
// asterisk, "*COVER DAY-BY-DAY". A # works too.
//
// Dispatch writes notes under NAME now and then ("COVER DAY-BY-DAY", "NO PT
// TO COVER"), about a dozen in the 19 weeks to 11/21/2026, and the app read
// each as a driver by that name. With the mark:
//   - on a job's row, the job is spoken for all the same (isPicked,
//     lib/coverBidJobRow.js: drivers see it as taken, as they always have),
//     but admins see "Note" and the words, not "Picked" by someone;
//   - in the pick list, the row isn't a driver at all and is skipped
//     (lib/coverSheetParser.js).
// A note without the mark is read as before. No imports, so the sheet parser
// can load it in plain Node.

const MARK = /^\s*[*#]+\s*/;

export const isNameNote = (name) => MARK.test(String(name ?? ''));

// The note's words without the mark: "COVER DAY-BY-DAY".
export const nameNoteText = (name) => String(name ?? '').replace(MARK, '').trim();
