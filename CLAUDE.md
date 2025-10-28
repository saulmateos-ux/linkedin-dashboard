# CLAUDE.md

Guidelines for AI assistants working on the LinkedIn Analytics Dashboard project.

**Version**: 0.5.0 (Design System Documentation + Magic UI Integration Guide)
**Last Updated**: October 26, 2025

---

## Project Overview

A Next.js dashboard for analyzing LinkedIn posts with AI-powered insights. Users can track multiple profiles, visualize engagement trends, organize profiles into workspaces, and ask natural language questions about their LinkedIn performance.

**Key Features**:
- **Workspace Organization** - Group profiles into workspaces with batch scraping
- **Team Member Tracking** - Track team member profiles separately (NEW!)
- **Workspace Batch Scraping** - Scrape up to 6 profiles simultaneously (NEW!)
- **Company Page Support** - Track company LinkedIn pages
- Multi-profile tracking (personal + competitors + companies + team)
- Real-time statistics and engagement charts
- AI Assistant with GPT-4 function calling
- Workspace-aware navigation persistence
- CSV export and scraping triggers

**Tech Stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Neon PostgreSQL, OpenAI GPT-4 Turbo, Recharts

---

## Architecture

```
User Browser
    ↓
Next.js Dashboard (Server + Client Components)
    ├─ Workspace Switcher (Context API)
    ├─ Workspace Management Page
    └─ Profile Management (Personal + Company Pages)
    ↓
Neon PostgreSQL (300+ posts, 5 tables including workspaces)
    ├─ posts, profiles, workspaces
    ├─ workspace_profiles (join table)
    └─ scraping_runs
    ↓
GPT-4 AI Assistant (8 intelligence functions)
```

**Related Project**: LinkedIn CLI Scraper handles data collection via Apify. Both projects share the same Neon database.

**Key Tables**:
- `posts` - LinkedIn posts with engagement metrics
- `profiles` - Tracked profiles (personal + company + team)
- `workspaces` - Workspace definitions (id, name, description, color)
- `workspace_profiles` - Many-to-many relationship between workspaces and profiles
- `scraping_runs` - History of scraping operations

---

## Project Structure

```
app/
  page.tsx                    # Dashboard homepage
  insights/page.tsx           # AI Assistant
  profiles/                   # Profile management pages
  posts/page.tsx              # All posts view
  workspaces/page.tsx         # Workspace management (NEW!)
  layout.tsx                  # Root layout with WorkspaceProvider
  api/
    ai-query/route.ts         # AI endpoint (GPT-4)
    profiles/route.ts         # CRUD operations (supports companies!)
    scrape/route.ts           # Trigger scraping
    export/route.ts           # CSV export
    workspaces/               # Workspace API routes (NEW!)
      route.ts                # List & create workspaces
      [id]/route.ts           # Get, update, delete workspace
      [id]/profiles/route.ts  # Add/remove profiles
      [id]/posts/route.ts     # Get workspace posts

components/
  AIChat.tsx                  # Chat interface
  ProfileSelector.tsx         # Profile dropdown
  WorkspaceSwitcher.tsx       # Workspace dropdown with URL sync
  WorkspaceAwareNav.tsx       # Navigation with workspace persistence (NEW!)
  ScrapeWorkspaceButton.tsx   # Batch scrape workspace profiles (NEW!)
  AddProfileModal.tsx         # Add profile with workspace selector (UPDATED!)
  [Other UI components]

contexts/
  WorkspaceContext.tsx        # Workspace state management (URL-driven)

lib/
  db.ts                       # All database functions + AI functions + workspace functions (11 new!)
```

---

## Key Patterns

### Database Access

**Always use functions from `lib/db.ts`**:
```typescript
import { getStats, getTopPosts, getProfiles } from '@/lib/db';

// In Server Components or API routes
const stats = await getStats(profileId);
const posts = await getTopPosts(10, profileId);
```

**Never write raw SQL in components** - use the provided functions.

### Server vs Client Components

**Server Components** (default):
- Dashboard pages (`app/page.tsx`)
- Profile pages
- Any page that fetches data

**Client Components** (mark with `'use client'`):
- Interactive UI (dropdowns, modals, buttons)
- Charts (Recharts)
- AI chat interface
- Forms with state

### API Routes

**Pattern**:
```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validate input
    // Call database functions
    // Return NextResponse.json()
  } catch (error) {
    return NextResponse.json(
      { error: 'Error message' },
      { status: 500 }
    );
  }
}
```

**Always**:
- Validate inputs
- Use try-catch
- Return consistent error format: `{ error: string }`
- Set appropriate HTTP status codes

---

## Common Tasks

### Adding a New API Endpoint

1. Create `app/api/[name]/route.ts`
2. Export `POST`, `GET`, `PUT`, or `DELETE` function
3. Use database functions from `lib/db.ts`
4. Return `NextResponse.json()`

### Adding a Database Function

1. Open `lib/db.ts`
2. Add async function with TypeScript types
3. Use parameterized queries (`$1, $2, etc.`)
4. Export the function
5. Document in `TECHNICAL-REFERENCE.md`

### Adding a New Page

1. Create `app/[name]/page.tsx`
2. Make it a Server Component (default)
3. Fetch data with `lib/db.ts` functions
4. Import and use components
5. Add to navigation if needed

### Adding an AI Function

1. Add function to `lib/db.ts` (returns specific data)
2. Register in `app/api/ai-query/route.ts` tools array
3. Add to switch statement for execution
4. Test with AI chat interface

---

## Profile Types & Team Tracking (October 2025)

**NEW**: Added "Team" profile type for tracking team member posts.

### Profile Type Categories

Profiles can be classified into 6 types:

1. **Own** - Your personal LinkedIn profile
2. **Competitor** - Competitor profiles to track
3. **Inspiration** - Influential profiles for content ideas
4. **Partner** - Partner/client profiles
5. **Team** - Team member profiles (NEW!)
6. **Other** - Miscellaneous profiles

### Team Profile Features

**Visual Identity**:
- Purple badge with 👥 icon in profile cards
- Dedicated "Team" tab on profiles page
- Color-coded display: Purple (#9333ea)

**Default Behavior**:
- New profiles default to "Team" type
- Can be changed to any other type after creation

**Use Cases**:
- Track team member LinkedIn activity
- Monitor company employee advocacy
- Aggregate team engagement metrics
- Compare team vs competitor performance

### Database Schema

```typescript
// profiles table
profile_type: 'own' | 'competitor' | 'inspiration' | 'partner' | 'team' | 'other'
```

**No migration needed** - "Team" is a new value for existing `profile_type` field.

---

## Workspace System (October 2025)

**NEW**: Organize profiles into workspaces for better tracking and filtering.

### What are Workspaces?

Workspaces group profiles into logical collections (e.g., "Personal", "Competitors", "Gain Company") without duplicating data. They act as filters across the dashboard.

### Dashboard Components

**1. Workspace Switcher** (`components/WorkspaceSwitcher.tsx`)
- Dropdown in header
- Shows current workspace with color indicator
- Updates URL params when changed: `?workspace=id`
- Uses `useWorkspace()` hook from context
- **URL-driven state** (URL params are source of truth)

**2. Workspace Context** (`contexts/WorkspaceContext.tsx`)
- React Context for global workspace state
- **Syncs with URL params** (removed localStorage dependency)
- Uses `useSearchParams()` to read current workspace from URL
- Provides: `currentWorkspace`, `workspaces`, `setCurrentWorkspace()`
- Auto-refreshes workspace list from API

**3. Workspace Management Page** (`app/workspaces/page.tsx`)
- Create, edit, delete workspaces
- Manage profile memberships
- Color picker for UI customization
- Profile add/remove modal

**4. Workspace-Aware Navigation** (`components/WorkspaceAwareNav.tsx`) - NEW!
- Navigation links that preserve workspace selection
- Automatically adds `?workspace=id` to Dashboard, All Posts, Profiles links
- Replaces static navigation in layout
- Maintains filter state across page transitions

**5. Workspace Batch Scraping** (`components/ScrapeWorkspaceButton.tsx`) - NEW!
- Appears on profiles page when workspace is active
- Triggers parallel scraping of all profiles in workspace
- Uses Apify's `targetUrls` array parameter
- Scrapes up to 6 profiles concurrently
- Shows progress modal with real-time updates

### How Filtering Works

**URL-based filtering**:
1. User selects workspace in switcher
2. URL updates: `/?workspace=2`
3. Server components detect `searchParams.workspace`
4. Pages fetch workspace-specific data
5. Profile selector hidden when workspace active

**Server Components** (all support workspace filtering):
- `app/page.tsx` - Dashboard homepage
- `app/posts/page.tsx` - All posts view
- `app/profiles/page.tsx` - Profiles view

### API Routes

**Workspace CRUD**:
- `GET/POST /api/workspaces` - List all / Create new
- `GET/PATCH/DELETE /api/workspaces/[id]` - Individual operations

**Profile Management**:
- `GET/POST /api/workspaces/[id]/profiles` - List profiles / Add profile
- `DELETE /api/workspaces/[id]/profiles?profileId=X` - Remove profile

**Data Access**:
- `GET /api/workspaces/[id]/posts` - Filtered posts with pagination

### Database Functions (lib/db.ts)

**11 new workspace functions** added:

```typescript
// Workspace CRUD
getWorkspaces() -> WorkspaceWithCounts[]
getWorkspace(id: number) -> Workspace | null
getWorkspaceByName(name: string) -> Workspace | null
createWorkspace(data) -> Workspace
updateWorkspace(id, data) -> Workspace
deleteWorkspace(id) -> boolean

// Profile Management
getWorkspaceProfiles(workspaceId) -> Profile[]
addProfileToWorkspace(workspaceId, profileId) -> void
removeProfileFromWorkspace(workspaceId, profileId) -> boolean

// Data Access
getWorkspacePosts(workspaceId, options) -> { posts, total }
getWorkspaceStats(workspaceId) -> Stats
```

### Implementation Pattern

**1. Add workspace param to page**:
```typescript
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const workspaceId = params.workspace ? parseInt(params.workspace) : null;
  const workspace = workspaceId ? await getWorkspace(workspaceId) : null;

  const profiles = workspace
    ? await getWorkspaceProfiles(workspace.id)
    : await getProfiles();
  // ... rest of logic
}
```

**2. Show workspace context in UI**:
```tsx
{workspace && (
  <p>Viewing workspace: <span style={{ color: workspace.color }}>{workspace.name}</span></p>
)}
```

### Workspace Batch Scraping (October 2025)

**NEW**: Scrape multiple profiles in a workspace simultaneously with a single API call.

**Architecture**:

1. **Frontend** (`components/ScrapeWorkspaceButton.tsx`):
   - Button appears on profiles page when workspace is active
   - Shows confirmation modal with profile count
   - Sends `workspaceId` to `/api/scrape` endpoint
   - Displays progress modal during scraping

2. **Backend** (`app/api/scrape/route.ts`):
   - Accepts `workspaceId` parameter
   - Queries all profiles in workspace: `getWorkspaceProfiles(workspaceId)`
   - Builds `targetUrls` array with all profile URLs
   - Makes single Apify actor call with array parameter
   - Apify scrapes up to 6 profiles in parallel
   - Maps posts back to correct `profile_id` using `authorProfileUrl` field

3. **Apify Actor** (`harvestapi/linkedin-profile-posts`):
   - Accepts `targetUrls: string[]` parameter
   - Scrapes profiles concurrently (6 at a time)
   - Returns all posts with `authorProfileUrl` metadata
   - Cost: Same as sequential scraping ($2 per 1k posts)

**Key code snippet**:
```typescript
// In /api/scrape/route.ts
if (workspaceId) {
  const profiles = await getWorkspaceProfiles(workspaceId);
  const targetUrls = profiles.map(p => p.profile_url);

  const input = {
    targetUrls: targetUrls,  // Array of profile URLs
    maxPosts: maxPosts || 100
  };

  const run = await apifyClient.actor(actorId).call(input);
  const dataset = await apifyClient.dataset(run.defaultDatasetId).listItems();

  // Map posts to profile_id using authorProfileUrl
  for (const post of dataset.items) {
    const profile = profiles.find(p =>
      post.authorProfileUrl?.includes(p.username)
    );
    if (profile) {
      post.profile_id = profile.id;
    }
  }
}
```

**Benefits**:
- **6x faster**: Parallel vs sequential scraping
- **Single API call**: Reduces complexity
- **Same cost**: No additional Apify charges
- **Automatic mapping**: Posts linked to correct profile
- **Progress feedback**: Real-time UI updates

**Usage**:
1. Navigate to `/profiles?workspace=2`
2. Click "Scrape Workspace" button (appears in header)
3. Confirm in modal showing profile count
4. Wait for progress modal (shows scraping status)
5. Posts automatically assigned to correct profiles

### Workspace-Aware Profile Adding (October 2025)

**NEW**: Add profiles directly to workspaces when creating them.

**Features**:

1. **Workspace Selector in Add Profile Modal** (`components/AddProfileModal.tsx`):
   - Dropdown showing all available workspaces
   - Pre-selects current workspace when adding from workspace view
   - Option to select "No workspace" (profile won't be added to any workspace)
   - Can manually choose any workspace regardless of current view

2. **API Integration** (`app/api/profiles/route.ts`):
   - Accepts optional `workspaceId` parameter in POST request
   - Creates profile first
   - Automatically calls `addProfileToWorkspace(workspaceId, profileId)` if workspace provided
   - Returns created profile with workspace association

3. **User Experience**:
   - When viewing "All Profiles": Workspace selector defaults to "No workspace"
   - When viewing workspace (e.g., `?workspace=2`): Selector pre-selects that workspace
   - User can override selection before submitting
   - Profile immediately appears in selected workspace

**Code snippet**:
```typescript
// AddProfileModal.tsx
const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(
  currentWorkspace?.id || null  // Pre-select current workspace
);

// Submit handler
const response = await fetch('/api/profiles', {
  method: 'POST',
  body: JSON.stringify({
    profileUrl,
    displayName,
    profileType,
    workspaceId: selectedWorkspaceId  // Optional workspace association
  })
});

// API route (app/api/profiles/route.ts)
const profile = await addProfile({ username, profile_url, display_name, profile_type });

if (workspaceId) {
  await addProfileToWorkspace(workspaceId, profile.id);
}
```

### Navigation Persistence (October 2025)

**BUG FIX**: Navigation now preserves workspace selection when moving between pages.

**Problem Solved**:
- Previously: Clicking "Dashboard" from a workspace view would lose workspace filter
- Previously: URL had `?workspace=2` but navigation links didn't preserve it
- Previously: Users had to re-select workspace after each navigation

**Solution** (`components/WorkspaceAwareNav.tsx`):

1. **New Component**: Replaced static navigation links in `app/layout.tsx`
2. **URL Param Preservation**: Reads current workspace from URL, adds to all nav links
3. **Context Integration**: Uses `useWorkspace()` hook to get current workspace
4. **Dynamic Links**: Automatically appends `?workspace=id` to Dashboard, All Posts, Profiles

**Implementation**:
```typescript
// WorkspaceAwareNav.tsx
'use client';

import { useWorkspace } from '@/contexts/WorkspaceContext';

export default function WorkspaceAwareNav() {
  const { currentWorkspace } = useWorkspace();
  const workspaceParam = currentWorkspace ? `?workspace=${currentWorkspace.id}` : '';

  return (
    <nav>
      <Link href={`/${workspaceParam}`}>Dashboard</Link>
      <Link href={`/posts${workspaceParam}`}>All Posts</Link>
      <Link href={`/profiles${workspaceParam}`}>Profiles</Link>
      <Link href="/insights">AI Insights</Link>
      <Link href="/workspaces">Workspaces</Link>
    </nav>
  );
}
```

**State Management Fix**:

Previous approach:
- localStorage as source of truth
- URL params sometimes out of sync
- Dropdown showed wrong selection when URL changed

New approach:
- **URL params are source of truth**
- Context syncs from URL on mount and when params change
- Dropdown always reflects URL state
- Navigation always preserves URL state

```typescript
// WorkspaceContext.tsx (updated)
const searchParams = useSearchParams();
const workspaceIdParam = searchParams.get('workspace');

useEffect(() => {
  if (workspaceIdParam) {
    const id = parseInt(workspaceIdParam);
    const workspace = workspaces.find(w => w.id === id);
    setCurrentWorkspace(workspace || null);
  } else {
    setCurrentWorkspace(null);
  }
}, [workspaceIdParam, workspaces]);
```

---

## Company Page Support (October 2025)

**NEW**: Track LinkedIn company pages in addition to personal profiles.

### How It Works

**1. Database**: Added `is_company` BOOLEAN to profiles table

**2. URL Validation** (`app/api/profiles/route.ts`):
- Accepts `linkedin.com/in/username` (personal)
- Accepts `linkedin.com/company/name` (company)
- Automatically detects type and sets `is_company` flag

**3. Profile Display**:
- Profile cards show company icon if `is_company=true`
- Profile URLs work for both types
- Scraping handled by appropriate Apify actor

### Adding Company Profiles

**Via Dashboard**:
1. Navigate to `/profiles`
2. Click "Add Profile"
3. Enter: `https://linkedin.com/company/gain-grow/`
4. Display name: "Gain (Company)"
5. System detects company URL automatically

**Database updates**:
```typescript
// In addProfile function
is_company: isCompanyPage,  // true if URL contains /company/
```

### Status

- ✅ **Dashboard**: Fully implemented
- ⚠️ **CLI**: Pending scraping integration (needs to use company-specific actor)

---

## Development Guidelines

### UI Development & Design System

**IMPORTANT**: Before making any UI changes:
1. **Read `.claude/docs/DESIGN-STRATEGY.md`** - Understand the overall design philosophy and roadmap
2. **Check `.claude/docs/DESIGN-SYSTEM.md`** - Get tactical component implementation details

**Two-Level Approach:**
- **Strategic** (DESIGN-STRATEGY.md): Why we design, what patterns to use, accessibility standards, design tokens
- **Tactical** (DESIGN-SYSTEM.md): How to install/use specific Magic UI components

**Design System Stack**:
- **Magic UI** - 150+ animated components for dashboards
- **shadcn/ui** - Base component library (Magic UI builds on this)
- **Framer Motion** - Animation engine
- **Tailwind CSS** - Utility-first styling
- **Geist Fonts** - Modern typography

**Key Principles**:
1. **Always use approved components** from `.claude/docs/DESIGN-SYSTEM.md`
2. **Follow implementation phases** - Don't skip ahead to advanced features
3. **Purposeful animations only** - Enhance UX, don't distract
4. **Performance first** - 60 FPS or don't animate
5. **Accessibility matters** - Respect `prefers-reduced-motion`

**Adding New Components**:
```bash
# Magic UI components (animated)
npx shadcn@latest add "https://magicui.design/r/[component-name]"

# shadcn/ui components (base)
npx shadcn@latest add [component-name]
```

**Component Priority** (from design system):
- **Tier 1** (High Impact): number-ticker, bento-grid, animated-list, blur-fade
- **Tier 2** (Visual Polish): sparkles, animated-border, meteors, dot-pattern
- **Tier 3** (Advanced): animated-bar-chart, animated-beam, shimmer-button

**Reference**: See ADR-013 in `.claude/tracking/decisions.md` for the architectural decision.

### Database Schema

**5 Tables**:
- `profiles` - LinkedIn profiles being tracked (personal + company pages, now with `is_company` field)
- `posts` - LinkedIn posts with engagement metrics
- `scraping_runs` - History of scraping operations
- `workspaces` - Workspace definitions (NEW!)
- `workspace_profiles` - Many-to-many join table (NEW!)

**Key Column Names** (important for AI queries):
- Use `author_name` (NOT "author")
- Use `published_at` (NOT "date_posted")
- Use `profile_id` for filtering
- Use `workspace_id` for workspace filtering (NEW!)

**Workspace Fields**:
- `workspaces.name` - Unique workspace name
- `workspaces.color` - UI color (#hex format)
- `workspace_profiles.workspace_id`, `workspace_profiles.profile_id` - Relationships

### Environment Variables

**Required** in `.env.local`:
```bash
DATABASE_URL=postgresql://...
APIFY_API_KEY=apify_api_...
LINKEDIN_PROFILE_URL=https://linkedin.com/in/...
OPENAI_API_KEY=sk-...
```

### TypeScript

- All database functions have TypeScript interfaces
- Use proper types (no `any`)
- Interfaces defined in `lib/db.ts` and `TECHNICAL-REFERENCE.md`

### Error Handling

**Pattern**:
```typescript
try {
  const result = await databaseFunction();
  return { success: true, data: result };
} catch (error) {
  console.error('Operation failed:', error);
  return {
    error: error instanceof Error ? error.message : 'Unknown error'
  };
}
```

---

## Ultrathink Methodology (Context Engineering)

**Version**: 1.0.0
**Implemented**: October 25, 2025

This project uses the Ultrathink methodology for effective context management and AI agent reliability. These practices ensure consistent performance on long-running development sessions.

### Context Management Best Practices

**Proactive Compaction Strategy**:
- **Monitor context at 70-80% capacity** - Don't wait for autocompact at 90%
- **Manual compaction preferred** - Use `/compact` command with custom instructions
- **Alert before tasks** - Check context availability before starting new work
- **Context command** - Regularly run to check remaining space

**What to Preserve During Compaction**:
1. Active architecture decisions
2. Current bugs and resolutions
3. Recent progress (last 7 days)
4. Workspace system state
5. Ongoing feature development context

**Sonnet 4.5 Intelligence**:
- Model automatically trims previous tool call results
- Built-in context editing expands usable space
- Improved ability to determine what's important to retain
- Trust the model's judgment while maintaining explicit control

**Context Alert Rule** (in project memory):
> Before starting any new task, check context usage. If below 40% remaining, alert user and suggest running `/compact` to ensure adequate space for task completion.

### Structured Note-Taking Protocol

**Auto-Updating Tracking Files**:

This project maintains structured notes outside the active context window:

1. **`.claude/tracking/progress.md`** - Task completion tracking
   - ✅ Recently Completed Tasks (last 7 days)
   - 🚧 In Progress (current sprint)
   - 📋 Next Steps (prioritized backlog)
   - 🎯 Current Focus Area
   - **Update after each significant task**

2. **`.claude/tracking/decisions.md`** - Architecture Decision Records (ADR)
   - Database and technology choices
   - Design pattern decisions
   - Trade-offs and alternatives considered
   - **Update when making design decisions**

3. **`.claude/tracking/bugs.md`** - Bug tracking and resolutions
   - 🔴 Critical Bugs (blocking)
   - 🟡 Known Issues (non-blocking)
   - ✅ Resolved Issues (with resolution details)
   - **Update when bugs discovered or fixed**

**File Reference Pattern**:
- Files identified by semantic names for just-in-time loading
- Reference files explicitly: "See `.claude/tracking/decisions.md` for ADR-005"
- No need to keep all content in active context
- Load specific files only when needed

**Update Instructions**:
After completing each significant task:
1. Update `progress.md` with completion details
2. If architecture decision made, document in `decisions.md`
3. If bug encountered or fixed, update `bugs.md`
4. Keep tracking files current for future sessions

### Sub-Agent Architecture

**When to Use Sub-Agents**:

This project includes 5 specialized sub-agents with isolated contexts:

1. **coordinator** - Lead agent (task analysis, delegation, results compilation)
2. **web-developer** - Frontend/backend development (Next.js, React, TypeScript)
3. **database-architect** - Database design (PostgreSQL, queries, schema)
4. **api-designer** - API endpoints (REST, Apify, OpenAI integration)
5. **devops-engineer** - Deployment (Vercel, environment, performance)

**Decision Matrix**:

Use **single agent** for:
- Focused, single-domain tasks (e.g., "Fix dropdown not updating")
- Simple bug fixes in specific areas
- Small UI changes or database queries

Use **coordinator + specialists** for:
- Complex multi-domain features (frontend + backend + database)
- Major refactors affecting multiple systems
- Architecture decisions requiring cross-domain analysis

Use **parallel analysis** for:
- Performance optimization (multiple perspectives needed)
- Complex refactors (gather insights before execution)

**Agent Configurations**:
- All agent specs in `.claude/agents/` directory
- Each agent has specific tools, responsibilities, success criteria
- Coordinator delegates, specialists execute
- Read agent markdown files for detailed instructions

**Important**:
- Sub-agents add coordination overhead (slower execution)
- Only use for genuinely complex tasks
- Simple tasks are better served by single well-managed agent
- Test coordinator pattern before applying to all tasks

### Memory Tool Instructions

**File-Based Memory System**:

This project uses Claude's memory tool with file-based persistence:

1. **CLAUDE.md** - Project constitution (this file)
   - Project guidelines and patterns
   - Always loaded, serves as persistent context
   - Update when discovering new patterns

2. **Project Memory** (via hash command)
   - Persistent instructions across sessions
   - Add critical reminders using `/hash` command
   - Examples: context alerts, update protocols, safety checks

3. **Tracking Files** (`.claude/tracking/`)
   - Structured notes outside active context
   - Referenced by file paths for semantic loading
   - Updated after each task execution

**Using the Hash Command**:

Save persistent instructions:
```
#remember [instruction]
```

Examples already saved:
- Context monitoring rules (alert at 40% remaining)
- Structured note-taking protocol (update tracking files)
- File reference patterns (semantic paths)

**File Path Semantics**:
- `.claude/tracking/progress.md` - Current project state
- `.claude/tracking/decisions.md` - Architecture context
- `.claude/tracking/bugs.md` - Known issues
- `.claude/agents/[name].md` - Sub-agent configurations
- `.claude/docs/` - Archived documentation

**Just-in-Time Loading**:
- Don't load all files into active context
- Reference files by path, load when needed
- Trust file names to convey purpose
- System retrieves specific information on-demand

---

## AI Assistant

**How It Works**:
1. User asks question in chat (`components/AIChat.tsx`)
2. Request sent to `/api/ai-query`
3. GPT-4 selects functions to call
4. Functions query database
5. GPT-4 analyzes results
6. Response returned to chat

**8 Available Functions**:
- `getTrendingHashtags()` - Popular hashtags (30 days)
- `getCompetitiveIntel()` - Profile comparison
- `getTopicPerformance()` - Engagement per hashtag
- `getPostingPatterns()` - Best posting times
- `getRecentActivity()` - Last 7 days summary
- `getStats()` - Overall statistics
- `getTopPosts()` - Top performing posts
- `query_database()` - Custom SQL (SELECT only)

**All AI functions in**: `lib/db.ts`

---

## Important Conventions

### Naming

- **Files**: kebab-case (`profile-card.tsx`)
- **Components**: PascalCase (`ProfileCard`)
- **Functions**: camelCase (`getTopPosts`)
- **Database columns**: snake_case (`profile_id`)

### Imports

```typescript
// External libraries
import { useState } from 'react';

// Next.js imports
import Link from 'next/link';

// Internal imports (use @ alias)
import { getStats } from '@/lib/db';
import ProfileCard from '@/components/ProfileCard';
```

### Component Structure

```typescript
// Server Component (default)
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// Client Component
'use client';
export default function Component() {
  const [state, setState] = useState();
  return <div>{state}</div>;
}
```

---

## Testing

**Manual Testing**:
```bash
npm run dev              # Start dev server
open http://localhost:3000

# Test:
# - Dashboard loads
# - Profile selector works
# - AI Assistant responds
# - Can add new profile
# - Export works
```

**Production Build**:
```bash
npm run build           # Build for production
npm start              # Start production server
```

---

## Documentation

**For quick reference**: This file (CLAUDE.md)

**For detailed specs**: `TECHNICAL-REFERENCE.md`
- Complete database schema
- All API endpoints
- TypeScript interfaces
- SQL queries
- Error handling

**For design system**:
- `.claude/docs/DESIGN-STRATEGY.md` - **START HERE** - Complete modern SaaS design philosophy, patterns, and roadmap
- `.claude/docs/DESIGN-SYSTEM.md` - Tactical guide for Magic UI + shadcn/ui components

**For system overview**: `MASTER-DOCUMENTATION.md`
- Complete system architecture
- CLI + Dashboard integration
- Deployment guides
- Cost breakdown

**For users**: `README.md`
- Feature overview
- Installation guide
- Usage examples

---

## Common Issues

**Dashboard loads slowly**:
- Use production mode: `npm run build && npm start`
- Dev mode doesn't cache

**AI returns "column does not exist"**:
- Check column names in query
- Use `author_name` (NOT "author")
- Use `published_at` (NOT "date_posted")

**Type errors**:
- Run `npm run build` to check types
- Ensure interfaces match database schema
- Check `TECHNICAL-REFERENCE.md` for correct types

**Database connection errors**:
- Verify `DATABASE_URL` in `.env.local`
- Check Neon console for database status
- Verify connection string format

**Workspace dropdown shows wrong selection (FIXED in v0.4.0)**:
- Was: localStorage and URL params out of sync
- Fix: URL params now source of truth
- Context syncs from URL automatically
- Dropdown always reflects current URL state

**Navigation loses workspace filter (FIXED in v0.4.0)**:
- Was: Clicking nav links dropped `?workspace=id` param
- Fix: New `WorkspaceAwareNav` component
- All navigation links preserve workspace param
- Workspace filter persists across page transitions

**Workspace batch scraping issues**:
- Ensure all profiles have valid LinkedIn URLs
- Check Apify API key has sufficient credits
- Maximum 6 profiles scraped in parallel
- Posts map to profiles via `authorProfileUrl` matching
- If mapping fails, check username extraction is correct

---

## Quick Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm start                      # Start production server

# Database (via psql)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM posts;"
psql $DATABASE_URL -c "SELECT * FROM profiles;"

# Testing AI endpoint
curl -X POST http://localhost:3000/api/ai-query \
  -H "Content-Type: application/json" \
  -d '{"question": "What are my trending hashtags?"}'
```

---

## When Working on This Project

1. **Read** this file first for guidelines
2. **Check** `TECHNICAL-REFERENCE.md` for detailed specs
3. **Follow** the patterns shown in existing code
4. **Test** changes with `npm run dev`
5. **Validate** types with `npm run build`

---

**Remember**: Keep it simple, follow the patterns, and refer to documentation when unsure.

## Recent Updates

### v0.5.0 (October 26, 2025) - Design System Documentation

**New Documentation**:
1. Comprehensive design system guide (`.claude/docs/DESIGN-SYSTEM.md`)
2. Magic UI + shadcn/ui integration guidelines
3. Component catalog with 3 priority tiers
4. Animation principles and performance guidelines
5. Implementation phases (3-week rollout plan)

**Architecture Decisions**:
1. ADR-013: Magic UI + shadcn/ui Design System
2. Added to Technology Choices Summary
3. Updated CLAUDE.md with UI development guidelines

**Design Stack**:
- Magic UI (150+ animated components)
- shadcn/ui (base component library)
- Framer Motion (animation engine)
- Geist fonts (modern typography)
- Tailwind CSS (utility-first styling)

**Future Implementation** (not yet started):
- Phase 1: Setup + high-impact components (Week 1)
- Phase 2: Visual polish (Week 2)
- Phase 3: Advanced features (Week 3)

### v0.4.0 (October 17, 2025) - Team Profiles + Navigation

**New Features**:
1. Team profile type with purple badges and dedicated tab
2. Workspace batch scraping (6 profiles in parallel)
3. Workspace-aware profile adding with pre-selection
4. Navigation persistence across pages

**Bug Fixes**:
1. Workspace dropdown sync with URL params
2. Navigation links now preserve workspace filter
3. Context state management uses URL as source of truth

**Architecture Changes**:
1. New `WorkspaceAwareNav` component
2. New `ScrapeWorkspaceButton` component
3. Updated `AddProfileModal` with workspace selector
4. Updated `WorkspaceContext` to sync from URL params
5. Updated `/api/scrape` to support `workspaceId` and batch scraping
6. Updated `/api/profiles` to support `workspaceId` parameter

---

**Last Updated**: October 26, 2025
- #remember Context Management Rules: 1. Check context before starting new tasks - alert if < 40%
   remaining. 2. Run manual compact at 70-80% capacity with preservation instructions. 3. 
  Preserve: architecture decisions, active bugs, progress tracking, workspace state
- #remember Structured Note-Taking Protocol: 1. Update .claude/tracking/progress.md after 
  completing each significant task. 2. Log architecture decisions to 
  .claude/tracking/decisions.md when making design choices. 3. Document bugs and resolutions in 
  .claude/tracking/bugs.md. 4. Reference tracking files using semantic paths