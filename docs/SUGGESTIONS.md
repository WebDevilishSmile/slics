# SLICS — Improvement Suggestions

Work through these one at a time. Each item is self-contained with the exact files to touch.

---

## 🔴 Critical — Security

### [x] 1. Add auth check to SLIC edit/delete API
**Files:** `app/api/slic/[id]/route.js`

Both PATCH and DELETE have no authentication. Anyone who knows a slic ID can edit or delete it directly via curl/Postman, bypassing the admin UI.

**Fix:** At the top of the PATCH and DELETE handlers, add:
```js
const session = await auth();
if (!session || session.user.role !== 'admin')
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

---

### [x] 2. Add auth check to Drivers API
**Files:** `app/api/drivers/route.js`, `app/api/drivers/[id]/route.js`

POST (create), PATCH (edit), and DELETE on drivers have no authentication at all.

**Fix:** Same auth check as above on each unprotected handler.

---

### [x] 3. Add auth check to Cover scheduling API
**File:** `app/api/cover/[position]/route.js`

The PATCH handler that updates cover scheduling has no auth check.

**Fix:** Same auth check as above.

---

### [x] 4. Add auth check to Comment deletion API
**File:** `app/api/comments/[commentId]/route.js`

The DELETE handler has no authentication. Anyone can delete any comment.

**Fix:** Add auth check, and also verify `session.user.id === comment.userId` (ownership) before allowing deletion, unless the user is admin.

---

### [x] 5. Stop trusting client-provided `userId` in comment creation
**File:** `app/api/comment/route.js`

The `userId` is read from `req.body`, meaning anyone can post comments as any user.

**Fix:** Replace `const { userId, ... } = await req.json()` with `const session = await auth()` and use `session.user.id` for the userId field.

---

### [x] 6. Remove hardcoded email guard in UserCard
**File:** `app/components/admin/users/UserCard.jsx`

```js
const isProtected = user?.email === 'webdevilishsmile@gmail.com'  // line 28
```

This hardcodes your personal email as a special case to prevent self-demotion.

**Fix:** Replace with `const isProtected = user?.id === session?.user?.id` (prevent any admin from changing their own role).

---

## 🟠 High Priority — Performance & Data

### [x] 7. Fix N+1 comment author fetches
**File:** `app/components/comments/Comment.jsx`

Each `Comment` component fires a separate `fetch(/api/users/${userId})` inside `useEffect`. With 20 comments that's 20 serial HTTP requests.

**Fix options (pick one):**
- In `Comments.jsx`, after fetching the comment list, collect unique userIds and batch-fetch them once, then pass each comment its `author` as a prop.
- Or in the comments API (`/api/comments/route.js`), use a MongoDB `$lookup` aggregation to join author data server-side.

---

### [x] 8. Move comment sorting to MongoDB
**File:** `lib/` or wherever `commentsApi.js` / `getCommentsBySlic()` lives

Currently fetches all comments and sorts them in JavaScript.

**Fix:**
```js
// Instead of: comments.sort(...)
find({ numSlic }).sort({ upVotes: -1, created_at: -1 }).limit(50).toArray()
```

---

### [x] 9. Add MongoDB indexes
**File:** Create `scripts/createIndexes.js` (run once) or add to your DB init code.

Missing indexes that will hurt as data grows:
```js
db.collection('users').createIndex({ email: 1 })
db.collection('comments').createIndex({ numSlic: 1, upVotes: -1 })
db.collection('slicViews').createIndex({ userId: 1, viewedAt: -1 })
db.collection('slics').createIndex({ numSlic: 1 })
```

---

### [x] 10. Remove hardcoded `'test'` database name
**Files:** Check `lib/slicsApi.js`, `lib/usersApi.js`, `lib/commentsApi.js` and any file calling `db.db('test')`

Several utility files explicitly connect to the `test` database instead of the default. In production this causes queries to hit the wrong database.

**Fix:** Replace all `db.db('test')` with `db.db()` (uses the database from your connection string) or `db.db(process.env.MONGODB_DB)`.

---

## 🟡 Medium Priority — Code Quality

### [x] 11. Merge duplicate form components
**Files:** `app/components/newSlic/NewSlicForm.jsx`, `app/components/createEditSlic/SlicForm.jsx`

These two files are ~90% identical — same fields, same validation `useEffect`, same submission logic. `SlicForm.jsx` already accepts a `mode` prop.

**Fix:** Update `app/admin/new/page.jsx` to import and use `SlicForm` with `mode="create"` and default empty values, then delete `NewSlicForm.jsx` and its sub-components.

---

### [x] 12. Fix SLIC update/delete ID mismatch
**File:** `app/api/slic/[id]/route.js`

PATCH looks up by `numSlic` (string), DELETE looks up by `_id` (ObjectId). The route param `id` means something different per HTTP method — confusing and fragile.

**Fix:** Pick one. Using `_id` (ObjectId) is the MongoDB convention and is already used by DELETE. Update PATCH to also filter by `{ _id: new ObjectId(id) }` with proper `ObjectId.isValid()` guard.

---

### [x] 13. Remove or wire up `CommentRefreshContext`
**File:** `app/context/CommentRefreshContext.js`

Originally dead code. It has since been wired up as the shared "list is refreshing" lock for the server-rendered comment lists (`profile/ProfileComments.jsx`, `admin/user-page/UserComments.jsx`): after one `CommentDelete` succeeds, every delete button in that list disables until `router.refresh()` has re-rendered it. It is unrelated to the home-page `comments/` feature, whose `refetchComments` is client-side and now only prop-drilled two levels — not worth a context.

**Done:** kept, and rebuilt on `useTransition` so `isRefreshing` reflects the real `router.refresh()` completion instead of a guessed `setTimeout`. The provider exposes `{ isRefreshing, refresh }`.

---

### [x] 14. Standardize API error response shape
**Files:** All `app/api/*/route.js` files

Some routes return `{ error: msg }`, others `{ message: msg }`. Client-side error handling has to guess which key to read.

**Fix:** Pick one format (e.g. `{ error: msg }`) and apply it consistently everywhere.

---

### [x] 15. Fix date format inconsistency
**Files:** `app/components/newSlic/NewSlicForm.jsx`, `app/components/createEditSlic/SlicForm.jsx`

`NewSlicForm` writes `created_at: dayjs().format('MM/DD/YY')` (a plain string).
`SlicForm` writes `created_at: new Date().toISOString()` (an ISO string).

MongoDB ends up with mixed types in the same field.

**Fix:** Use `new Date()` in both places so MongoDB stores a proper BSON Date.

---

## 🟢 Low Priority — UX & Accessibility

### [x] 16. Add loading state to comment submit button
**File:** `app/components/comments/CommentEditor.jsx`

No disabled/loading state while the comment POST is in flight — users can double-submit.

**Fix:** Add `const [submitting, setSubmitting] = useState(false)`. Set it true before `fetch`, false in `finally`. Pass `disabled={submitting}` to the Submit button.

---

### [x] 17. Remove or explain the disabled image upload button
**File:** `app/components/comments/CommentsContainer.jsx` (line ~63)

An image upload button is rendered but hardcoded `disabled={true}` with no tooltip or explanation.

**Fix:** Either remove it until the feature is ready, or add `<Tooltip title="Coming soon">` around it so users know it's intentional.

---

### [x] 18. Fix carousel placeholder alt text
**File:** `app/components/home/EmblaCarousel.jsx` (line ~86)

`alt='Your alt text'` — a forgotten placeholder.

**Fix:** Pass real descriptive alt text as a prop from wherever the carousel image data is defined.

---

### [x] 19. Add ARIA labels to icon-only buttons
**Files:** Various components using MUI `IconButton` without text labels

Icon buttons without labels are invisible to screen readers.

**Fix:** Add `aria-label="Descriptive action"` to each `IconButton`, or wrap it in `<Tooltip title="Action name">` (MUI Tooltip sets the accessible label automatically).

---

### [x] 20. Add an error boundary
**File:** `app/components/layout/Providers.jsx` (or a new `ErrorBoundary.jsx`)

Many `fetch` calls have empty `.catch(() => {})` handlers, leaving users with a blank/broken screen on error.

**Fix:** Add a React error boundary around the main content area. MUI doesn't include one — use a simple class component or the `react-error-boundary` package.

---

### [x] 21. Optimistic updates on comment votes
**File:** `app/components/comments/CommentFooter.jsx` (or wherever vote click is handled)

After clicking vote, the UI waits for a full refetch before updating the count. Feels sluggish.

**Fix:** Immediately update the local vote count on click (`setVotes(v => v + 1)`), then call the API. On error, revert the count.

---

## Summary

| # | Category | Effort |
|---|---|---|
| 1–6 | Security | Small each |
| 7–10 | Performance/Data | Small–Medium |
| 11–15 | Code Quality | Small–Medium |
| 16–21 | UX / Accessibility | Small each |
