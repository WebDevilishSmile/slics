# TODOs

## Ideas

### General Improvements

- [x] disable MUI ripple
- [x] when a user comes back to the app, it is logging the lookup again. Fixed server-side instead of redirecting: `recordSlicView` skips a repeat of the latest lookup within 30 minutes, so the card is still there after Maps.

### UI/UX Improvements

- [x] change dialogs, alerts, and other UI design to match neumorphic style and remove weird glow.
- [ ] change the heading to a neumorphic style embossed look

#### Neumorphic Design

- [x] use the new neumorphic design elements throughout the app
  - [x] apply neumorphic design to all buttons and interactive elements
  - [x] apply neumorphic design to all cards and containers
  - [x] apply neumorphic design to all input fields and forms
  - [x] apply neumorphic design to all modals and dialogs
  - [x] apply neumorphic design to all navigation elements (e.g., menus, tabs)
  - [x] apply neumorphic design to all typography elements (e.g., headings, paragraphs)
  - [x] about page
  - [x] cover-bid-jobs page
  - [x] privacy and terms pages
  - [x] membership page

### Admin Page

- [x] consider changing users search to url so navigating back preserves the search state
- [ ] improve the UI/UX for better user experience
- [x] slics page
- [x] comments page
- [x] users page
- [x] cover drivers page
- [x] cover jobs page
- [x] drivers page
- [x] planet fitness page

- [x] the table when adding the cover bids from a photo is tough to use. The cells are so small I can't see what is written, the sun-sat cells should be times (date/time picker maybe), the description on the end is never big enough to see fully (I understand its limited, but maybe during the upload before we can have a button to open a dialog that the admin can verify each job thoroughly... accuracy is very important. Consider adding a preview or expand option for each row to make it easier to review the details. Take advantage of the screen size when available. Also, take into mind the admin may have to adjust some entries on mobile, so accessing and manipulating the data on mobile (although a secondary issue) has to be considered and optimized.
  - Done 2026-10-08. A "Review jobs" dialog steps through the jobs one at a time beside the uploaded photo (zoom, drag to pan, opened at the job's own photo or PDF page). "Looks right" marks a job checked, and the list shows how many are checked and flagged.
  - Day cells are 24-hour time fields typed as printed ("0630").
  - On a wide screen (lg+), each job takes two lines of the table, so the description gets the full width and long text wraps instead of being cut off.
  - On a phone, each job is a readable card that opens the full-screen dialog.
  - The saved week below uses the same table, cards and dialog.

### Whip It In and Whip It Out Page

- [x] can't unlike comment

### SLIC Lookup

- [ ] improve the UI/UX for better user experience
- [ ] add ability for driver to add photos or attachments to comments (must reduce file size, use vercel blob storage)
- [x] add ability for driver to add gps coordinates or pin to comment ("Add pin" in the tip and reply boxes and when editing, with or without text; "Pinned spot" opens it in the driver's maps app)
- [x] add ability to cycle through tips on empty state display (a "next tip" arrow; each visit starts at the tip after the last one seen)
- [x] add ability for driver to edit their own comments

### SLIC Comments

- [x] allow user's to reply to SLIC comments (one thread per comment)
- [x] consider removing tiptap and just using textfield or textarea

### My History

- [x] add the ability to search by slic or date or customer name or any keyword or address
- [x] add sorting and filtering options
- [x] add pagination or infinite scroll
- [x] improve the UI/UX for better user experience
- [x] add the ability to delete history items
- [x] add the ability to edit history items
- [x] sticky header for dates in history so user doesn't get lost.
