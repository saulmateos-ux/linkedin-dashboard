# Known Issues & Bug Tracking

**Project**: LinkedIn Analytics Dashboard
**Last Updated**: October 25, 2025

> **Auto-Update Instructions**: This file tracks all known bugs, issues, and their resolutions. Update this file when:
> - Discovering a new bug (add to appropriate section)
> - Fixing a bug (move to Resolved, add resolution details)
> - Identifying prevention strategies

---

## 🔴 Critical Bugs (Blocking)

*No critical bugs at this time.*

---

## 🟡 Known Issues (Non-Blocking)

### Issue #001: Playwright Browser Lock

**Status**: Known Issue - Auto-fixable
**Severity**: Medium (blocks testing, easy to fix)
**First Discovered**: October 2025
**Affects**: Local development with Playwright MCP

**Description**:
When using Playwright MCP for browser automation, the Chrome browser process doesn't always clean up properly. This leaves locked browser profiles in `/Users/saulmateos/Library/Caches/ms-playwright/mcp-chrome-c91e2f6`, preventing new browser instances from starting.

**Error Message**:
```
Error: Browser is already in use for /Users/saulmateos/Library/Caches/ms-playwright/mcp-chrome-c91e2f6,
use --isolated to run multiple instances of the same browser
```

**Root Cause**:
- Chrome processes from previous Playwright sessions don't terminate cleanly
- Browser profile remains locked even after session ends
- Multiple tabs or incomplete sessions compound the issue

**Auto-Fix Solution** (Documented in CLAUDE.md):

**Option 1: Use cleanup script (recommended)**:
```bash
/Users/saulmateos/cleanup-playwright.sh
```

**Option 2: Manual cleanup**:
```bash
# Kill stuck processes
pkill -f "ms-playwright/mcp-chrome"

# Wait for cleanup
sleep 1

# Retry the browser operation
```

**Verification**:
```bash
ps aux | grep -i "ms-playwright" | grep -v grep
# Should return nothing if cleaned up successfully
```

**Prevention Strategies**:
1. Always close browser sessions when done with testing
2. Never leave multiple tabs open unnecessarily
3. Kill processes proactively if browser gets sluggish
4. Use browser for specific tasks then close immediately

**Workaround**:
This is documented in CLAUDE.md with auto-fix instructions. AI assistants working on this project should automatically run the cleanup script when encountering this error, without asking the user.

**Related Files**:
- `CLAUDE.md` (Playwright MCP Browser Auto-Fix section)
- `/Users/saulmateos/cleanup-playwright.sh`

---

## 🐛 Minor Issues

### Issue #002: Large progress.md Files Over Time

**Status**: Preventable
**Severity**: Low
**First Discovered**: October 25, 2025 (Anticipated)
**Affects**: Long-running projects

**Description**:
The `progress.md` file will grow indefinitely as tasks are completed, potentially making it unwieldy.

**Prevention Strategy**:
- Archive old completed tasks monthly
- Keep only last 30 days of completed tasks in main section
- Move older entries to `progress-archive-YYYY-MM.md` files
- Document this process in progress.md header

**Resolution**:
N/A - Preventive measure documented

---

## ✅ Resolved Issues

### Issue #R004: MUI Grid Deprecation Warnings

**Status**: ✅ Resolved
**Severity**: Medium (console warnings, but no functional impact)
**Discovered**: October 27, 2025
**Resolved**: October 27, 2025
**Resolution Time**: 1 hour

**Description**:
Multiple console warnings appearing during compilation about deprecated MUI Grid props:
```
MUI Grid: The `item` prop has been removed and is no longer necessary. You can safely remove it.
MUI Grid: The `xs` prop has been removed. See https://mui.com/material-ui/migration/upgrade-to-grid-v2/
MUI Grid: The `sm` prop has been removed.
MUI Grid: The `lg` prop has been removed.
MUI Grid: The `md` prop has been removed.
```

**Root Cause**:
- Using MUI v7 Grid component with deprecated v5/v6 API
- Props like `item`, `xs`, `sm`, `lg` were replaced with new `size` prop in v7
- Components weren't migrated during MUI upgrade

**Resolution**:
Migrated all Grid instances to MUI v7 API:

**Before (deprecated)**:
```tsx
<Grid item xs={12} sm={6} lg={3}>
```

**After (MUI v7)**:
```tsx
<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
```

**Files Modified**:
- `app/page.tsx` (4 Grid instances)
- `components/ContentInsights.tsx` (3 Grid instances)

**Lessons Learned**:
- Check MUI migration guides when upgrading major versions
- MUI v7 consolidated responsive props into single `size` object
- Console warnings should be addressed promptly (indicate API changes)

**Prevention**:
- Review MUI changelog before upgrades
- Test compilation output for warnings
- Keep dependencies up to date

---

### Issue #R005: Insights Page searchParams Synchronous Access

**Status**: ✅ Resolved
**Severity**: High (runtime error blocking page)
**Discovered**: October 27, 2025
**Resolved**: October 27, 2025
**Resolution Time**: 15 minutes

**Description**:
The `/insights` route was throwing an error when accessing searchParams:
```
Error: Route "/insights" used `searchParams.workspace`.
`searchParams` should be awaited before using its properties.
```

**Root Cause**:
- Next.js 15 changed searchParams to be async (returns Promise)
- Code was accessing `searchParams.workspace` synchronously
- This was valid in Next.js 14 but breaks in Next.js 15

**Resolution**:
Updated page component to await searchParams:

**Before**:
```typescript
interface InsightsPageProps {
  searchParams: { workspace?: string };
}

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
  if (searchParams.workspace) { // ❌ Synchronous access
```

**After**:
```typescript
interface InsightsPageProps {
  searchParams: Promise<{ workspace?: string }>; // Promise type
}

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
  const params = await searchParams; // ✅ Await first
  if (params.workspace) {
```

**Files Modified**:
- `app/insights/page.tsx`

**Lessons Learned**:
- Next.js 15 requires awaiting searchParams (breaking change)
- Type system catches these issues at compile time
- Check migration guides for framework upgrades

**Prevention**:
- Review Next.js upgrade guides when updating versions
- Use TypeScript strict mode (catches type mismatches)
- Test all dynamic routes after framework upgrades

---

### Issue #R006: Dark Backgrounds in Light Mode (CSS Variables)

**Status**: ✅ Resolved
**Severity**: High (visual inconsistency, poor UX)
**Discovered**: October 27, 2025
**Resolved**: October 27, 2025
**Resolution Time**: 2 hours

**Description**:
SortablePostsTable and ProfileCard components were displaying with dark backgrounds despite implementing Materio light mode theme. This created visual inconsistency with the rest of the dashboard.

**Root Cause**:
- Components using CSS variables (`var(--color-bg-card)`) from dark mode theme
- CSS variables don't respect MUI theme context
- Not using MUI theme palette colors
- Components written with custom HTML/CSS instead of MUI components

**Resolution**:
Complete rewrite of both components using MUI components and theme-aware styling:

**SortablePostsTable.tsx Changes**:
- Replaced custom HTML/CSS with MUI Card, Table, TableCell components
- Changed `var(--color-bg-card)` to `background.paper` theme color
- Changed `var(--color-text)` to `text.primary`, `text.secondary`
- Added MUI sort icons (ArrowUpward, ArrowDownward, UnfoldMore)
- Used semantic colors: `success.main` (likes), `info.main` (comments), `warning.main` (shares)

**ProfileCard.tsx Changes**:
- Replaced custom HTML/CSS with MUI Card, Chip, IconButton components
- Changed profile type badges from custom styles to MUI Chip with semantic colors
- Added MUI icons: Edit, Star (primary), Business (company)
- Used theme palette throughout (no hardcoded colors)

**Light Mode Colors Applied**:
- White card backgrounds (#FFFFFF via `background.paper`)
- Light gray page background (#F4F5FA via `background.default`)
- Dark text (rgba(76, 78, 100, 0.87) via `text.primary`)
- Vibrant accent colors from MUI palette

**Files Modified**:
- `components/SortablePostsTable.tsx` (complete rewrite)
- `components/ProfileCard.tsx` (complete rewrite)

**Lessons Learned**:
- Always use MUI theme palette instead of CSS variables for theme-aware apps
- MUI components provide better theme integration than custom HTML
- sx prop with theme colors ensures proper light/dark mode support
- Semantic color names (success, info, warning) better than hex codes

**Prevention**:
- Use MUI components from the start (Card, Chip, IconButton, etc.)
- Never use CSS variables for colors in MUI apps
- Always reference theme palette: `bgcolor: 'background.paper'`
- Test components in both light and dark modes

---

### Issue #R001: Workspace Dropdown Out of Sync with URL

**Status**: ✅ Resolved
**Severity**: High (core functionality)
**Discovered**: October 2025
**Resolved**: October 2025 (v0.4.0)
**Resolution Time**: 1 day

**Description**:
The workspace dropdown selection and URL parameters (`?workspace=id`) would get out of sync. User could select a workspace in the dropdown, but the URL wouldn't update. Or vice versa - URL had `?workspace=2` but dropdown showed "All Profiles".

**Root Cause**:
- Used localStorage as source of truth
- URL params and localStorage could diverge
- Navigation components didn't preserve query params
- Context updated from localStorage, not URL

**Resolution**:
Changed architecture to use URL params as single source of truth (see ADR-006 in decisions.md):

1. **Updated WorkspaceContext.tsx**:
   - Read from `useSearchParams()` instead of localStorage
   - Removed localStorage dependency
   - Context syncs from URL on mount and when params change

2. **Created WorkspaceAwareNav.tsx**:
   - New navigation component that preserves workspace params
   - All nav links append `?workspace=id` automatically
   - Replaced static nav in `app/layout.tsx`

3. **Updated All Pages**:
   - Server components read `searchParams.workspace`
   - Client components use `useWorkspace()` hook
   - All links preserve current workspace

**Files Modified**:
- `contexts/WorkspaceContext.tsx`
- `components/WorkspaceAwareNav.tsx` (new)
- `app/layout.tsx`

**Lessons Learned**:
- URL params should be source of truth for shareable state
- localStorage causes sync issues with URL-based state
- Navigation must preserve query parameters
- Test state management across page transitions

**Prevention**:
- Always use URL params for shareable/bookmarkable state
- Document state management decisions (ADR-006)
- Test navigation thoroughly across all pages

---

### Issue #R002: TypeScript `any` Types Causing Runtime Errors

**Status**: ✅ Resolved
**Severity**: Medium
**Discovered**: October 2025
**Resolved**: October 2025
**Resolution Time**: 2-3 hours

**Description**:
Initial development used `any` types extensively for rapid prototyping. This led to runtime errors that TypeScript strict mode would have caught at build time.

**Examples**:
- Missing property checks causing `undefined` errors
- Incorrect type assumptions in API responses
- Database function return types not validated

**Root Cause**:
- Rapid prototyping without proper typing
- Not using TypeScript strict mode
- Lack of interfaces for database entities

**Resolution**:

1. **Enabled TypeScript Strict Mode** (`tsconfig.json`)
2. **Fixed all type errors** - Removed all `any` types
3. **Added proper type assertions** where needed
4. **Created interfaces** for all database entities (in `lib/db.ts`)
5. **Documented decision** (ADR-007)

**Commits**:
- `3b38345` - Fix all TypeScript type errors with proper assertions
- `156dfd9` - Fix TypeScript/ESLint errors: remove any types

**Lessons Learned**:
- Use strict mode from the start, even for prototypes
- Invest time in proper typing upfront (saves debugging time later)
- Create interfaces for all data structures
- `any` is tech debt that compounds

**Prevention**:
- TypeScript strict mode enabled in `tsconfig.json`
- ESLint rule: `@typescript-eslint/no-explicit-any: error`
- Code review checklist: No `any` types allowed
- Document in CLAUDE.md: "Always use proper types, never `any`"

---

### Issue #R003: Navigation Losing Workspace Filter

**Status**: ✅ Resolved
**Severity**: High (poor UX)
**Discovered**: October 2025
**Resolved**: October 2025 (v0.4.0)
**Resolution Time**: 2 hours

**Description**:
When viewing a workspace (e.g., `/?workspace=2`), clicking navigation links like "All Posts" or "Profiles" would lose the workspace filter and show all profiles instead.

**Root Cause**:
- Static navigation links in `app/layout.tsx` didn't include query params
- Links were hardcoded: `<Link href="/posts">` instead of `<Link href={`/posts${workspaceParam}`}>`
- No mechanism to preserve workspace selection across navigation

**Resolution**:

1. **Created WorkspaceAwareNav.tsx component**:
   ```typescript
   const { currentWorkspace } = useWorkspace();
   const workspaceParam = currentWorkspace ? `?workspace=${currentWorkspace.id}` : '';

   <Link href={`/posts${workspaceParam}`}>All Posts</Link>
   ```

2. **Replaced static nav in layout.tsx**:
   - Removed hardcoded nav links
   - Added `<WorkspaceAwareNav />` component
   - Now all navigation preserves workspace context

**Files Modified**:
- `components/WorkspaceAwareNav.tsx` (new)
- `app/layout.tsx` (updated)

**Lessons Learned**:
- Navigation components must be aware of global state
- Query params need explicit preservation in links
- Test all navigation paths with active filters

**Prevention**:
- Use workspace-aware navigation component everywhere
- Document pattern in CLAUDE.md
- Test navigation from all pages with workspace active

---

## 📊 Bug Statistics

### By Severity
- 🔴 Critical: 0 active
- 🟡 Known Issues: 1 active
- 🐛 Minor: 1 active
- ✅ Resolved: 6 total

### Resolution Time
- Average: ~1.2 hours
- Fastest: 15 minutes (Issue #R005 - searchParams fix)
- Slowest: 1 day (Issue #R001 - workspace sync)

---

## 🎓 Prevention Strategies Learned

### General Practices

1. **Type Safety First**
   - Always use TypeScript strict mode
   - Never use `any` types
   - Create interfaces for all entities
   - Validate at build time, not runtime

2. **State Management**
   - Use URL params for shareable state
   - Avoid localStorage for sync-critical state
   - Document state source of truth
   - Test state across navigation

3. **Browser Automation**
   - Always close browser sessions
   - Kill processes proactively
   - Use cleanup scripts
   - Document common issues

4. **File Management**
   - Archive old data regularly
   - Keep tracking files manageable
   - Document maintenance procedures
   - Set up automated cleanup

### Code Review Checklist

Before merging any code, verify:
- [ ] No `any` types used
- [ ] All database functions have proper types
- [ ] Navigation preserves query params where needed
- [ ] Browser/resource cleanup handled properly
- [ ] Error handling for all external calls
- [ ] TypeScript build passes with no errors

---

## 📝 Reporting New Bugs

When discovering a new bug, add it with this template:

```markdown
### Issue #XXX: Brief Description

**Status**: New | In Progress | Blocked
**Severity**: Critical | High | Medium | Low
**First Discovered**: Date
**Affects**: What parts of the system

**Description**:
Clear description of the bug and how to reproduce.

**Error Message** (if applicable):
```
Exact error text
```

**Root Cause** (if known):
Technical explanation of why this happens.

**Workaround** (if available):
Temporary solution while permanent fix is developed.

**Related Files**:
- List of files involved
```

---

## Notes

- This file is part of the Ultrathink methodology implementation
- Update this file when bugs are discovered, fixed, or prevention strategies learned
- Move resolved bugs to the Resolved section with full details
- Keep Critical and Known Issues sections current
- Reference bug numbers in commit messages and PR descriptions
