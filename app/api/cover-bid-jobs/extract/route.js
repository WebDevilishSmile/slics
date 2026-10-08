import { GoogleGenAI, Type } from '@google/genai';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ALLOWED_MEDIA_TYPES = new Set(['image/jpeg', 'application/pdf']);

const ROW_PROPERTIES = {
  jobNumber: { type: Type.STRING },
  name: { type: Type.STRING },
  assignedDriver: { type: Type.STRING },
  coverReason: { type: Type.STRING },
  sun: { type: Type.STRING },
  mon: { type: Type.STRING },
  tue: { type: Type.STRING },
  wed: { type: Type.STRING },
  thu: { type: Type.STRING },
  fri: { type: Type.STRING },
  sat: { type: Type.STRING },
  description: { type: Type.STRING },
};

const ROWS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    rows: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: ROW_PROPERTIES,
        required: Object.keys(ROW_PROPERTIES),
      },
    },
  },
  required: ['rows'],
};

const EXTRACTION_PROMPT = `You will be shown one or more photos and/or PDF documents of a printed weekly "AVAILABLE FOR W/E [date]" cover-jobs bid sheet used by a trucking dispatch office. A PDF may contain multiple pages; treat each page inside it the same way you would treat a separate photo. Extract every job row from all provided pages into structured data.

Table layout — the columns are ALWAYS in this fixed order, left to right: Job #, Name, Assigned Driver, Cover Reason, Sun, Mon, Tue, Wed, Thu, Fri, Sat, Description. This column order holds even on a photo that does not show a header row at all — only the first page of a multi-page sheet displays the day-of-week header labels, so a continuation-page photo must still be read using this same fixed layout.
- The leftmost column is the Job # (e.g. "LV56", "BP02", "BCP1", "AIL1", "BUB4"). Job # codes are short: a few letters followed by one or two digits. Read digits and letters carefully — a trailing character that could be read as either a digit or a similar-looking letter (e.g. "4" vs "A", "0" vs "O") should be read as a digit if the rest of the code matches this letters-then-digits pattern.
- The Job # cell is sometimes blank even though the row has real schedule data (a Cover Reason and day times) — for example a row labeled "NEW JOB" or "EXTRA TEMPORARY JOB" with no code to its left. Still extract that row; output jobNumber: "" for it. Only skip a row entirely if it has no Cover Reason text AND no values in any day column — that is a blank spacer row, a section header, or one of the "PICK #" seniority list rows near the bottom of the sheet (rows with a person's name and a pick number, not part of the main job table).
- Name is the next column after Job # — it is usually blank, but sometimes holds text like "STA REQUIRED".
- Assigned Driver is next — usually the last name of the driver originally covering that job (e.g. "PRICE", "HEALY").
- Cover Reason is next — free text like "VACATION", "OTHER", "COMBO WEEK", "FMLA / VACATION".
- The box immediately after Cover Reason is always Sunday, followed by Mon, Tue, Wed, Thu, Fri, Sat in order — seven day boxes total, even if the visible header text only labels Mon through Sat.
- The rightmost column contains a long route description (e.g. "Mon-Fri: BETPA>VVSPA>BETPA>FLPPA>BETPA>BENPA>BETPA") — this is the Description for that job.
- Some day cells are shaded a solid color (e.g. green or gray) with no visible number printed in them — that shading means no value applies for that job on that day. Output "" for that cell. Never copy a value from a neighboring day into a shaded or otherwise blank cell, even if it looks like the schedule "should" continue.

Row boundaries are strict: each printed horizontal row on the sheet is one, and only one, output row. Never combine text, times, or route codes from two different printed rows into a single output row — this applies even when two rows sit close together, the sheet was photographed at an angle, or a photo shows the seam/edge between two physical pages.

For every job row, output:
- jobNumber: the Job # exactly as printed, or "" if that row has no Job # code
- name: the Name column's text, or "" if blank
- assignedDriver: the Assigned Driver column's text, or "" if blank
- coverReason: the Cover Reason column's text, or "" if blank
- sun, mon, tue, wed, thu, fri, sat: the value printed in that day's cell for this job (a time like "06:30", or the empty string "" if that day's cell is blank or shaded for this job)
- description: the full text of the rightmost description column for this job, exactly as printed

If you are given more than one photo, they are different physical pages of the same weekly sheet, in the order they were uploaded. Extract rows from every photo using this same fixed column layout, and combine them all into one single ordered list — first all rows from photo 1, then all rows from photo 2, and so on. If the same row appears in more than one photo because the framing overlapped slightly, include it only once.

Return every job row extracted, across all photos, in the order they appear.`;

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { images } = await request.json();

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'images is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    if (
      images.some(
        (img) =>
          !img?.data || !img?.mediaType || !ALLOWED_MEDIA_TYPES.has(img.mediaType)
      )
    ) {
      return NextResponse.json(
        {
          error:
            'each file must have data and a supported mediaType (image/jpeg or application/pdf)',
        },
        { status: 400 }
      );
    }

    const imageParts = images.flatMap((img, index) => [
      { text: `File ${index + 1} of ${images.length}, in upload order:` },
      { inlineData: { mimeType: img.mediaType, data: img.data } },
    ]);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: EXTRACTION_PROMPT }, ...imageParts],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: ROWS_SCHEMA,
        temperature: 0,
      },
    });

    if (!response.text) {
      return NextResponse.json(
        { error: 'The model returned no output for this image.' },
        { status: 422 }
      );
    }

    const parsed = JSON.parse(response.text);

    return NextResponse.json(
      { success: true, rows: parsed.rows },
      { status: 200 }
    );
  } catch (error) {
    console.error('API Error extracting cover bid jobs:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
