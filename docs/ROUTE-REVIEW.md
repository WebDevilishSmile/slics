# ROUTE-REVIEW.md

Claude's review of the 65 directions PDFs, `SLIC-DIRECTIONS.md` stage 0 (2026-11-12). The
PDFs were read as they are on Vercel Blob; nothing was changed.

**How to use this:** every finding is something to **confirm with a driver who runs it**,
not a checked fact. Claude didn't drive or look up these roads. Fix a wrong address or
phone on the SLIC's edit page (it goes through history). A route change waits for stage
1, where routes become text in the app. Check an item off with what was decided.

No phone numbers or codes are written here (the repo is public): a phone mismatch only
says the two differ. Compare them on the SLIC's edit page and in its PDF.

## Summary

- **65 PDFs, every one with a text layer** (no scans), so stage 1 can import them all.
- **1 security problem:** a gate pass code in a public PDF (below).
- **4 routes depend on fitting under a low clearance,** and 1 uses a parkway where trucks
  are usually banned.
- **28 SLICs where the PDF and the app disagree** on an address, a city or zip, or a
  phone. One side is wrong each time; the app is what drivers see.
- **Format:** the PDFs mix three kinds of text, which stage 1 has to keep apart (see
  [What this changes in stage 1](#what-this-changes-in-stage-1)).

## Do first

- [ ] **NWTVA: the PDF contains the gate's pass code.** The PDF is a public URL
      (`SECURITY.md` #13), and the old Supabase copy may still sit at a guessable path
      (`<alpha>.pdf`). Ask the building whether the code should change, take it out of
      the PDF (re-upload without it), and keep codes out of routes in stage 1: a code
      belongs in a signed-in-only note, if anywhere.
- [ ] **Low clearances: write down the height each route assumes.** These routes tell
      drivers to ignore a posted limit or pass under a low bridge because "you will fit".
      That's true only for the equipment the writer drove. Confirm the trailer height it
      assumes, and say it in the route ("for 13'6" pups: …").
  - **1110 (Queens North) and ISLNY, MQUNY:** the BQE sign "all trucks over 12'8" must
    exit" is to be disregarded, running the middle lane to clear an overhang.
  - **1110:** Van Dam St, under a bridge marked 12'6".
  - **ISLNY, MQUNY (way back):** Maurice Ave, "will seem tight but you will fit".
  - **FOSNY (both ways):** Linden Blvd, under a bridge marked 12'4".
- [ ] **BRUNY (way back): the Hutchinson River Parkway** ("it's ok to be on this road"). New
      York's parkways generally ban commercial vehicles. Confirm the stretch it uses is
      allowed, or find a way back without it.
- [ ] **M43NY and MANNY: Manhattan street legs** (Amsterdam, Columbus, 57th St, 11th and
      10th Ave). Check them against New York City's truck route map. Through trucks must
      stay on designated routes.

## The app and the PDF disagree

Confirm with the building, then fix whichever is wrong. If it's the app, use the edit
page; if it's the PDF, stage 1's import drops the PDF's header anyway.

| SLIC | What differs |
|---|---|
| 1110 | City: app "Long Island", PDF "Long Island City" |
| 0703 | Phone: the app has none; the PDF gives the Meadowlands number |
| BBRNJ | Phone differs; city and zip: app Bound Brook 08805, PDF Bridgewater Township 08807 |
| BRUNY | Phone differs (the PDF's is the Manhattan dispatch number, as on M43NY) |
| CHRDE | Street: app and route "Ruthar Dr", PDF header "Ruther Drive" (the PDF's typo) |
| CRONJ | Zip: app 07307, PDF 07097 |
| EDINJ, TRENJ | Both the app and both PDFs give the same phone for Edison and Trenton; confirm whose it is |
| ELMNY | Phone: the app has the Manhattan dispatch number (as on M43NY); the PDF has a local number |
| EWR55 | Street number: app 154, PDF 344 Brewster Rd (the PDF says its address is only approximate); phone differs |
| HVAMD | City: PDF "Sparks Glenco" (Glencoe), app "Sparks" |
| M43NY | Street number: app 643, PDF 601 W 43rd St |
| MANNO | City and zip: app "New York, NY 10451", PDF "Bronx, NY 10454" |
| MANNY | Phone differs (the PDF says 43rd St's dispatch runs MANNY) |
| MDTAS | Street number: app 100, PDF 161 Airport Dr; the PDF has no phone |
| MEANJ | Street number: app **493**, PDF **439** County Ave (transposed digits) |
| MOLNJ | Phone differs |
| MOUNY | Phone differs |
| NEWPA | Phone differs by the last digit |
| NOBG | Address: app 6201 Tonnelle Ave, PDF 3722 69th St (the route enters the yard from 69th St; a parking pin may suit better than either) |
| OREPA | Street: app "15 E Oregon Ave", PDF "15 Oregon Ave" |
| PARNJ | Phone differs by one digit |
| PGHRR | Phone differs |
| POTPA | Street: app "1 Industrial Dr", PDF "1 International Drive (this is correct!)" |
| REAPA | Street number: app 4250, PDF 410 Reading Crest Ave; phone differs |
| SCRPA | Phone differs by the last digit |
| STAVA | Phone differs; city: app "Fisherville", PDF "Fishersville" (the town's spelling) |
| STRCT | City: app "Startford" (typo); zip: app 06497, PDF 06615 |

Smaller ones, likely both right: CRBNJ (Jamesburg vs Monroe Township, same zip), MOLNJ
(Mount Olive vs Budd Lake, same zip), SADNJ (app "Saddlebrook", the town is "Saddle
Brook").

## Route by route

"None" means nothing stood out beyond the general notes. **Arrival** marks a note about
getting in at the destination (gates, doors, check-in), which stage 1 keeps apart from
the route.

| SLIC | Findings |
|---|---|
| 1110 | Clearances (Do first). Two ways. Typo "DISREGARED" |
| 0703 | None |
| ALBNY | Arrival: weekend guard, arrival and departure log |
| BALMD | None |
| BBRNJ | None |
| BOMD | Arrival: railyard kiosks and staging, long. A railyard map would help (stage 3) |
| BRUNY | Hutchinson River Parkway on the way back (Do first). No name line in the PDF |
| BURMD | None |
| CHRDE | Arrival: the second entrance "may have do not enter signs" |
| CRBNJ | Two ways, the second marked easier |
| CRHCT | Typo "phone polls" |
| CRLPA | None |
| CRONJ | Arrival: scanner garage, kiosks, staging, the way out, and on to MEANJ. A railyard map would help |
| EDINJ | None |
| ELMNY | Uses the Saw Mill Pkwy exit but not the parkway, and says so: keep that warning |
| EWR55 | Written with "…" between steps; "follow airport signs for the south area" |
| EZRPA | None |
| FOSNY | Clearance (Do first). Two ways, each with its own way back. Caton Ave is marked a truck route: good |
| GAIMD | Two starting points (BETPA, Burtonsville). Uses Rt. 200, a toll road |
| HARCT | Arrival: second entrance, wait for the guard to cut the seal |
| HARPA | Arrival: on weekends the main gate is locked, use the back guard shack |
| HBGRR | None |
| HOMPA | Two starting points (BETPA, I-81) |
| HVAMD | Two starting points. Spellings: "Cockysville" (Cockeysville), "Towsen" (Towson) |
| ISLNY | Clearances (Do first). Arrival: inbound to learn yard or door. Way back |
| LAKNJ | Garden State Parkway south from Rt. 18 "with a truck and trailer": matches the parkway's rule that trucks are allowed south of interchange 105; confirm |
| LANPA | Arrival: supervisor at door 10 |
| LAWNJ | None |
| M43NY | Manhattan streets (Do first). Arrival: inbound on the IVIS at 45th St, a bay-numbered map of 43rd St (a document to upload in stage 3). Way back |
| MANNO | Way back |
| MANNY | Manhattan streets (Do first). Two ways; points to M43NY for details |
| MDTAS | Arrival: "from what I have been told", unconfirmed. Way back |
| MEANJ | Three ways, plus a back entrance "preferred with a set of doubles" |
| MELNY | Arrival: first entrance in, the second is exit only |
| MOLNJ | Arrival: the "UPS employees" driveway is the right one |
| MOUNY | None |
| MQUNY | Clearances (Do first). Way back |
| MTLPA | Way back |
| NASNY | Way back |
| NEWPA | None |
| NOBG | Two ways. Arrival: turn into the yard before the bridge |
| NWCDE | Arrival: the second UPS entrance (third left-turn lane) |
| NWTVA | **Gate code (Do first).** Typo "Blacklick" (Backlick). Way back |
| OREPA | Written with "…". Way back |
| PARNJ | None |
| PGHRR | Typo "Northfolk" (Norfolk) |
| PHLPA | Arrival: gate 8 for hub loads, gate 2 for air loads (A2–A5) |
| PLENJ | Arrival: where to break a set, doors 1–4 |
| POTPA | Address conflict (table above) |
| REAPA | Arrival: the "customer center" driveway is the right one |
| RUTPA | Arrival: register on a first visit, the bobtail lane, zip-tying container locks |
| SADNJ | A different layout: the way back to BETPA and a list of dispatch phone numbers. A night rule: don't use the lower road at night (residential); keep it prominent |
| SCRPA | Two ways (476, 81) |
| STAVA | None |
| STRCT | Says "(Tappan Zee)" where the others say "(Old Tappan Zee)" |
| STRPA | Arrival: the second Rockdale Lane entrance; the first is residential |
| SYRNY | All capitals. Syracuse's I-81 project renumbers I-481 as I-81: "81 north to exit 16A for 481 north" may no longer match the signs. Confirm |
| TRENJ | None |
| VINNJ | "UPS building is 5 miles on the right" after a ½-mile road: check the distance. Arrival: a U-turn cutout to break a set, inbound doors 1–3 |
| WATCT | None |
| WBAPA | Two starting points |
| WCHPA | Keeps a clear warning about the 422 lane: good |
| WILPA | All capitals |
| WORMA | The Mass Pike exit already gives the new and old numbers: good. Landmarks (a pizza place, a care home) can change |
| YORNY | None |

## Readability, every route

- One paragraph per way. Stage 1 shows **one step per line**, which suits a cab far
  better.
- Common spellings to fix: "bare" → "bear", "Old Tappan Zee" (fine to keep both names),
  "pass" → "past".
- A few are all capitals (SYRNY, WILPA) or use "…" between steps (EWR55, OREPA).
- ½, ¾ and "Café" appear; stage 1's import has to keep them (read as UTF-8).

## What this changes in stage 1

Recorded in `SLIC-DIRECTIONS.md` → Stage 1:

1. **A route has sections.** 24 of the 65 have more than one: "Way 1 / Way 2", a way back,
   "From Burtonsville", "476 Turnpike way / 81 way". The text keeps them as heading lines,
   and the sheet shows each section with its own steps.
2. **Arrival notes are the destination's, not the route's.** Gates, doors, check-in,
   weekend rules and railyard procedures are the same whichever hub a driver comes from,
   so they belong with the SLIC (shared), not in BETPA's route.
3. **No codes in route text.** A gate code goes nowhere public; at most, a signed-in-only
   arrival note.
4. **The import drops the header** (address, phone), so the app's record is the one source.
   This table is the list to settle first.
