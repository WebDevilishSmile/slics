# TODOs

## Ideas

### General Improvements

- [x] disable MUI ripple
- [x] when a user comes back to the app, it is logging the lookup again. Fixed server-side instead of redirecting: `recordSlicView` skips a repeat of the latest lookup within 30 minutes, so the card is still there after Maps.

### UI/UX Improvements

- [x] change dialogs, alerts, and other UI design to match neumorphic style and remove weird glow.

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

### Whip It In and Whip It Out Page

- [ ] can't unlike comment

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
