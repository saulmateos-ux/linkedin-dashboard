# CLAUDE.md

Guidelines for AI assistants working on the LinkedIn Analytics Dashboard project.

**Version**: 0.7.0 (YouTube Dashboard Indicators)
**Last Updated**: January 29, 2026

---

## Project Overview

A Next.js dashboard for analyzing LinkedIn and YouTube content with AI-powered insights.

**Key Features**:
- Multi-platform support (LinkedIn posts + YouTube videos)
- Multi-profile tracking (personal + competitors + companies + team)
- Workspace organization with batch scraping (6 profiles in parallel)
- Automated news aggregation (RSS + GPT-4 analysis every 4 hours)
- AI Assistant with GPT-4 function calling
- Real-time statistics and engagement charts

**Tech Stack**: Next.js 15, TypeScript, Tailwind CSS, Neon PostgreSQL, OpenAI GPT-4, Recharts

---

## Architecture

```
User Browser
    ↓
Next.js Dashboard (Server + Client Components)
    ├─ Workspace System (URL-driven state)
    └─ Profile Management (Personal + Company Pages)
    ↓
Neon PostgreSQL (5 tables)
    ├─ posts, profiles, workspaces
    ├─ workspace_profiles (join table)
    └─ scraping_runs
    ↓
GPT-4 AI Assistant (8 intelligence functions)
```

**Related Project**: LinkedIn CLI Scraper shares same Neon database.

---

## Project Structure

```
app/
  page.tsx                    # Dashboard homepage
  insights/page.tsx           # AI Assistant
  profiles/                   # Profile management
  posts/page.tsx              # All posts view
  youtube/page.tsx            # YouTube overview
  youtube/channels/page.tsx   # YouTube channels
  workspaces/page.tsx         # Workspace management
  layout.tsx                  # Root layout with WorkspaceProvider
  api/
    ai-query/route.ts         # AI endpoint (GPT-4)
    profiles/route.ts         # CRUD operations
    scrape/route.ts           # Trigger scraping
    workspaces/               # Workspace API routes
    cron/aggregate/route.ts   # News aggregation

components/
  AIChat.tsx                  # Chat interface
  WorkspaceSwitcher.tsx       # Workspace dropdown
  WorkspaceAwareNav.tsx       # Navigation with workspace persistence
  [Other UI components]

contexts/
  WorkspaceContext.tsx        # Workspace state (URL-driven)

lib/
  db.ts                       # All database + AI functions
```

---

## Key Patterns

### Database Access

**Always use functions from `lib/db.ts`**. Never write raw SQL in components.

```typescript
import { getStats, getTopPosts, getProfiles } from '@/lib/db';

const stats = await getStats(profileId);
const posts = await getTopPosts(10, profileId);
```

### Server vs Client Components

**Server Components** (default):
- Pages that fetch data
- Dashboard views
- Profile pages

**Client Components** (`'use client'`):
- Interactive UI (dropdowns, modals, buttons)
- Charts (Recharts)
- AI chat interface
- Forms with state

### API Routes Pattern

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validate input
    // Call database functions
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error message' },
      { status: 500 }
    );
  }
}
```

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
4. Add to navigation if needed

### Adding an AI Function
1. Add function to `lib/db.ts`
2. Register in `app/api/ai-query/route.ts` tools array
3. Add to switch statement for execution
4. Test with AI chat interface

---

## Core Features

### Profile Types

6 profile types available:
- **Own** - Your personal profile
- **Competitor** - Competitor tracking
- **Inspiration** - Content ideas
- **Partner** - Partner/client profiles
- **Team** - Team member tracking (purple badge 👥)
- **Other** - Miscellaneous

### Workspace System

**What are Workspaces?**
- Logical groupings of profiles (e.g., "Personal", "Competitors", "Gain Company")
- URL-driven filtering: `?workspace=id`
- Many-to-many relationships (profiles can belong to multiple workspaces)
- Batch scraping (6 profiles in parallel)

**Key Components**:
- `WorkspaceSwitcher.tsx` - Dropdown in header
- `WorkspaceContext.tsx` - URL-synced state management
- `WorkspaceAwareNav.tsx` - Navigation with workspace persistence
- `ScrapeWorkspaceButton.tsx` - Batch scraping trigger

**Implementation Pattern**:
```typescript
// In page component
const params = await searchParams;
const workspaceId = params.workspace ? parseInt(params.workspace) : null;
const workspace = workspaceId ? await getWorkspace(workspaceId) : null;
const profiles = workspace
  ? await getWorkspaceProfiles(workspace.id)
  : await getProfiles();
```

**Details**: See `TECHNICAL-REFERENCE.md` for complete workspace API and database schema.

### Company Page Support

- Track LinkedIn company pages (`linkedin.com/company/name`)
- Automatically detected via URL
- Database field: `is_company` BOOLEAN
- Shows company icon in UI

### News Aggregation System

**Automated**: RSS feeds fetched every 4 hours via Vercel Cron Jobs
**Manual Fallback**: "Refresh News" button on `/news` page
**Processing**: GPT-4 analyzes each article (relevance, sentiment, entities)

**Configuration**: See `VERCEL-CRON-SETUP.md` for complete setup guide.

---

## Development Guidelines

### UI Development & Design System

**Before making UI changes**:
1. Read `.claude/docs/DESIGN-STRATEGY.md` - Design philosophy
2. Check `.claude/docs/DESIGN-SYSTEM.md` - Component implementation

**Design System Stack**:
- Magic UI (150+ animated components)
- shadcn/ui (base components)
- Framer Motion (animations)
- Tailwind CSS (styling)
- Geist Fonts (typography)

**Adding Components**:
```bash
# Magic UI (animated)
npx shadcn@latest add "https://magicui.design/r/[component-name]"

# shadcn/ui (base)
npx shadcn@latest add [component-name]
```

### Database Schema

**5 Tables**:
- `profiles` - LinkedIn profiles (personal + company + team)
- `posts` - LinkedIn posts + YouTube videos with engagement metrics (`platform` field: 'linkedin' or 'youtube')
- `scraping_runs` - Scraping operation history
- `workspaces` - Workspace definitions
- `workspace_profiles` - Many-to-many join table

**Key Column Names** (important for AI queries):
- Use `author_name` (NOT "author")
- Use `published_at` (NOT "date_posted")
- Use `profile_id` for filtering
- Use `workspace_id` for workspace filtering

### Environment Variables

**Required** in `.env.local`:
```bash
DATABASE_URL=postgresql://...
APIFY_API_KEY=apify_api_...
LINKEDIN_PROFILE_URL=https://linkedin.com/in/...
OPENAI_API_KEY=sk-...
CRON_SECRET=cron_[64-char-hex]  # For Vercel cron jobs
```

**Important**: `CRON_SECRET` must also be in Vercel dashboard (Settings → Environment Variables → Production).

### TypeScript

- Strict mode enabled
- No `any` types
- All database functions have TypeScript interfaces
- Interfaces in `lib/db.ts` and `TECHNICAL-REFERENCE.md`

### Error Handling Pattern

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

## Context Management (Ultrathink Methodology)

### Best Practices

**Proactive Compaction**:
- Monitor context at 70-80% capacity
- Use `/compact` command with custom instructions
- Alert before starting new tasks if context < 40%

**What to Preserve**:
1. Active architecture decisions
2. Current bugs and resolutions
3. Recent progress (last 7 days)
4. Workspace system state
5. Ongoing feature development context

### Structured Note-Taking

**3 Auto-Updating Tracking Files**:

1. `.claude/tracking/progress.md` - Task completion tracking
   - Update after each significant task
   - ✅ Completed, 🚧 In Progress, 📋 Next Steps

2. `.claude/tracking/decisions.md` - Architecture Decision Records (ADR)
   - Update when making design decisions
   - 14+ ADRs documenting key choices

3. `.claude/tracking/bugs.md` - Bug tracking and resolutions
   - Update when bugs discovered or fixed
   - 🔴 Critical, 🟡 Known, ✅ Resolved

**Update Protocol**: After completing each significant task:
1. Update `progress.md` with completion details
2. If architecture decision made, document in `decisions.md`
3. If bug encountered or fixed, update `bugs.md`

### Sub-Agent Architecture

**5 Specialized Sub-Agents** (`.claude/agents/` directory):
1. **coordinator** - Task analysis and delegation
2. **web-developer** - Frontend/backend development
3. **database-architect** - Database design
4. **api-designer** - API endpoints
5. **devops-engineer** - Deployment

**When to Use**:
- **Single agent** for focused, single-domain tasks
- **Coordinator + specialists** for complex multi-domain features
- **Parallel analysis** for performance optimization

**Important**: Sub-agents add overhead - only use for genuinely complex tasks.

---

## AI Assistant

**How It Works**:
1. User asks question in chat
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

---

## Testing

**ALWAYS use Vercel CLI for local testing** to simulate production environment accurately.

### Vercel CLI (Required for Testing)

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Run local Vercel environment (PREFERRED METHOD)
vercel dev
```

**Why use `vercel dev`?** It simulates Vercel's actual runtime:
* Serverless function behavior
* Edge functions
* Environment variable handling
* API route cold starts
* Cron job endpoints

### Testing Cron Jobs Locally

```bash
# Test cron endpoint with authentication
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/aggregate
```

### Alternative Commands

```bash
npm run dev              # Quick dev server (less accurate)
npm run build && npm start  # Production build (no serverless simulation)
```

**Note**: Only use `npm run dev` for quick iterations. Always validate with `vercel dev` before deploying.

---

## Documentation

**Quick reference**: This file (CLAUDE.md)

**Detailed specs**: `TECHNICAL-REFERENCE.md`
- Complete database schema
- All API endpoints
- TypeScript interfaces
- SQL queries

**Design system**:
- `.claude/docs/DESIGN-STRATEGY.md` - Design philosophy
- `.claude/docs/DESIGN-SYSTEM.md` - Component guide

**System overview**: `MASTER-DOCUMENTATION.md`
- Complete system architecture
- CLI + Dashboard integration
- Deployment guides
- Cost breakdown

**Troubleshooting**: See "Common Issues" section below or `TECHNICAL-REFERENCE.md`

**Users**: `README.md`
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

**Database connection errors**:
- Verify `DATABASE_URL` in `.env.local`
- Check Neon console for database status

**Workspace issues**:
- URL params are source of truth (`?workspace=id`)
- Navigation preserves workspace filter
- Dropdown syncs from URL automatically

**News aggregation not updating**:
- Check `last_fetched_at` in database
- Verify `CRON_SECRET` in Vercel dashboard
- Use manual "Refresh News" button as fallback
- See `VERCEL-CRON-SETUP.md` for troubleshooting

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
4. **Test** changes with `vercel dev` (simulates production)
5. **Validate** types with `npm run build`
6. **Update** tracking files after significant tasks

---

## Recent Changes

**See `.claude/tracking/progress.md` for detailed changelog.**

**Current Version**: 0.7.0 (January 2026)
- YouTube dashboard indicators (sidebar nav, platform badges, profile pills)
- Multi-platform support (LinkedIn + YouTube)
- `/youtube` and `/youtube/channels` routes

**Previous Version**: 0.6.0 (January 2025)
- Optimized CLAUDE.md (1,221 → ~450 lines, 63% reduction)
- Removed redundant workspace documentation
- Condensed verbose sections
- Moved detailed content to appropriate docs

**Previous Version**: 0.5.1 (November 2025)
- Vercel cron job authentication fix
- Manual "Refresh News" button added
- News aggregation system fully documented

**See Also**:
- `.claude/tracking/decisions.md` - 14 Architecture Decision Records
- `.claude/tracking/bugs.md` - Known issues and resolutions

---

**Remember**: Keep it simple, follow the patterns, and refer to documentation when unsure.

**Last Updated**: January 29, 2026
