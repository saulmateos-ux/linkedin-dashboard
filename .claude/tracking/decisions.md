# Architecture Decision Records (ADR)

**Project**: LinkedIn Analytics Dashboard
**Last Updated**: November 12, 2025

> **Auto-Update Instructions**: This file documents all significant architecture and technology decisions. When making a major design choice, add a new entry with date, decision, rationale, alternatives considered, and trade-offs.

---

## Decision Log Format

Each decision follows this structure:
- **Date**: When the decision was made
- **Decision**: What was decided
- **Context**: Why the decision was needed
- **Rationale**: Why this choice was made
- **Alternatives Considered**: Other options evaluated
- **Trade-offs**: Pros and cons
- **Status**: Active | Deprecated | Superseded

---

## ADR-001: Next.js 15 App Router

**Date**: October 2025
**Status**: Active

### Decision
Use Next.js 15 with the App Router architecture instead of Pages Router or alternative frameworks.

### Context
Need a modern React framework for the dashboard that supports:
- Server-side rendering for performance
- API routes for backend logic
- TypeScript support
- Easy Vercel deployment

### Rationale
- **Server Components by default** - Better performance, reduced client bundle
- **Built-in API routes** - No need for separate backend
- **File-based routing** - Intuitive project structure
- **Streaming & Suspense** - Progressive loading capabilities
- **TypeScript first-class** - Excellent type safety

### Alternatives Considered
1. **Next.js Pages Router** - Older, more stable, but missing Server Components
2. **Remix** - Similar capabilities but smaller ecosystem
3. **Vite + React + Express** - More flexible but requires more setup
4. **Create React App** - Too basic, no SSR

### Trade-offs
✅ **Pros**:
- Modern patterns (Server Components)
- Great performance out of the box
- Excellent Vercel integration
- Strong TypeScript support

❌ **Cons**:
- App Router is newer, less documentation
- Learning curve for Server vs Client components
- Some libraries don't support Server Components yet

---

## ADR-002: Neon PostgreSQL as Database

**Date**: October 2025
**Status**: Active

### Decision
Use Neon serverless PostgreSQL as the shared database for both CLI and Dashboard.

### Context
Need a database that:
- Supports relational data (posts, profiles, relationships)
- Works with both Node.js CLI and Next.js dashboard
- Scales automatically
- Has generous free tier

### Rationale
- **Serverless** - No connection management complexity
- **PostgreSQL** - Full SQL support, ACID compliance
- **Shared access** - Both CLI and dashboard use same DB
- **Connection pooling** - Built-in via `pg.Pool`
- **Free tier** - Sufficient for development and small production

### Alternatives Considered
1. **Supabase** - Similar but includes auth/storage we don't need
2. **PlanetScale (MySQL)** - Good but prefer PostgreSQL for JSON support
3. **MongoDB** - NoSQL not ideal for relational analytics data
4. **SQLite** - Too simple, no concurrent access from CLI + dashboard

### Trade-offs
✅ **Pros**:
- Serverless, auto-scaling
- Generous free tier ($0/month for dev)
- True PostgreSQL (not MySQL/MariaDB)
- Connection pooling built-in
- Shared between CLI and dashboard

❌ **Cons**:
- Cold starts possible
- Vendor lock-in (though PostgreSQL is portable)
- Requires internet connection

---

## ADR-003: Apify for LinkedIn Scraping

**Date**: October 2025
**Status**: Active

### Decision
Use Apify actors (`harvestapi/linkedin-profile-posts`) for LinkedIn data collection.

### Context
LinkedIn has strict anti-scraping measures. Need a reliable, legal way to collect post data.

### Rationale
- **Managed infrastructure** - Apify handles proxies, rate limiting, captchas
- **Reliable actors** - Community-maintained, tested scrapers
- **Pay-per-use** - Only pay for actual scraping (~$2 per 1k posts)
- **Legal compliance** - Apify handles ToS considerations
- **API access** - Easy integration with Node.js

### Alternatives Considered
1. **Manual scraping (Puppeteer/Playwright)** - Would get blocked quickly
2. **LinkedIn API** - Very limited, no public post data access
3. **Bright Data** - More expensive, overkill for this use case
4. **ScrapingBee** - No LinkedIn-specific actors

### Trade-offs
✅ **Pros**:
- Reliable, won't get blocked
- Managed infrastructure
- Community support
- Legal compliance
- Batch scraping (6 profiles in parallel)

❌ **Cons**:
- Costs money (~$2 per 1k posts)
- Dependency on third-party service
- Rate limits apply
- No real-time updates

---

## ADR-004: OpenAI GPT-4 for AI Assistant

**Date**: October 2025
**Status**: Active

### Decision
Use OpenAI GPT-4 Turbo with function calling for natural language analytics queries.

### Context
Users want to ask questions about their LinkedIn data in natural language instead of writing SQL or clicking through dashboards.

### Rationale
- **Function calling** - GPT-4 can select and call specific database functions
- **Natural language** - Users ask questions in plain English
- **Context awareness** - Understands analytics context
- **Reliable** - Production-ready, well-documented
- **Fast** - 3-10 second response times

### Alternatives Considered
1. **Claude (Anthropic)** - Similar capabilities, but less function calling examples
2. **Llama 3** - Open-source but requires self-hosting
3. **SQL generation only** - Less flexible, harder for users
4. **No AI** - Users would need to learn SQL or use limited UI

### Trade-offs
✅ **Pros**:
- Excellent function calling capabilities
- Natural language interface
- Fast responses
- Well-documented SDK
- 8 specialized functions working well

❌ **Cons**:
- API costs (~$0.03 per 1k input tokens)
- Requires API key
- Occasional hallucinations (mitigated with strict function schemas)
- Vendor dependency

---

## ADR-005: Workspace System Architecture

**Date**: October 2025
**Status**: Active

### Decision
Implement workspaces as filters with many-to-many relationships (profiles can belong to multiple workspaces).

### Context
Users need to organize profiles into logical groups (e.g., "Personal", "Competitors", "Gain Company") without duplicating data.

### Rationale
- **No data duplication** - Profiles stored once, referenced many times
- **Flexible organization** - Profile can be in multiple workspaces
- **Filter pattern** - Workspaces filter existing data, don't create new data
- **URL-driven state** - `?workspace=id` in URL for shareable links
- **Join table pattern** - Standard many-to-many database design

### Alternatives Considered
1. **Folders (strict hierarchy)** - Too rigid, profiles can't be in multiple groups
2. **Tags** - Less clear organizational structure
3. **Duplicating profiles** - Wasteful, data inconsistency issues
4. **Single workspace per profile** - Not flexible enough

### Trade-offs
✅ **Pros**:
- Flexible (many-to-many)
- No data duplication
- Standard SQL pattern
- URL-shareable filters
- Clean separation of concerns

❌ **Cons**:
- More complex queries (JOIN operations)
- Need to manage membership table
- Slightly more database calls

---

## ADR-006: URL Params as State Source of Truth

**Date**: October 2025
**Status**: Active (Supersedes localStorage approach)

### Decision
Use URL query parameters (`?workspace=id`) as the single source of truth for workspace selection, not localStorage.

### Context
Initial implementation used localStorage, causing sync issues between URL and dropdown. Navigation links would lose workspace context.

### Rationale
- **Shareable** - Users can share URLs with workspace filter applied
- **Bookmarkable** - Browser history works correctly
- **No sync issues** - URL is always correct
- **Server-side access** - Server components can read params
- **Standard web pattern** - Expected behavior for filters

### Alternatives Considered
1. **localStorage** - Not shareable, sync issues with URL
2. **React Context only** - Lost on page refresh
3. **Cookies** - Overkill, privacy concerns
4. **Database user preferences** - Too slow, requires auth

### Trade-offs
✅ **Pros**:
- Shareable URLs
- No sync issues
- Server components compatible
- Browser history works
- Clear state management

❌ **Cons**:
- Visible in URL (not a privacy issue here)
- Requires URL param handling in all pages
- Can't have "sticky" default workspace

---

## ADR-007: TypeScript Strict Mode

**Date**: October 2025
**Status**: Active

### Decision
Enable TypeScript strict mode and eliminate all `any` types from the codebase.

### Context
Initial development used `any` types for rapid prototyping. Led to runtime errors that TypeScript should have caught.

### Rationale
- **Type safety** - Catch errors at build time, not runtime
- **Better IDE support** - Autocomplete, refactoring tools work better
- **Self-documenting** - Types serve as inline documentation
- **Confidence** - Refactoring is safer with proper types
- **Best practice** - Industry standard for TypeScript projects

### Alternatives Considered
1. **Keep `any` types** - Faster development but more bugs
2. **Gradual typing** - Mixed approach, confusing
3. **Just use JSDoc** - Not as robust as TypeScript

### Trade-offs
✅ **Pros**:
- Fewer runtime errors
- Better refactoring safety
- Self-documenting code
- Better IDE experience
- Easier onboarding

❌ **Cons**:
- Initial time investment to fix types
- Slightly more verbose code
- Learning curve for complex types

---

## ADR-008: Tailwind CSS for Styling

**Date**: October 2025
**Status**: Active

### Decision
Use Tailwind CSS 4 for all component styling instead of CSS modules or styled-components.

### Context
Need a scalable styling solution that works with Next.js Server Components and provides consistent design.

### Rationale
- **Utility-first** - Fast prototyping, consistent spacing
- **No context switching** - Write styles in JSX
- **Tree-shaking** - Unused styles removed automatically
- **Server Component compatible** - No CSS-in-JS issues
- **Responsive design** - Built-in breakpoints

### Alternatives Considered
1. **CSS Modules** - More verbose, harder to maintain
2. **styled-components** - Doesn't work well with Server Components
3. **Emotion** - Same Server Component issues
4. **Plain CSS** - Too manual, no design system

### Trade-offs
✅ **Pros**:
- Fast development
- Consistent design system
- Small bundle size (tree-shaking)
- Server Component compatible
- Great documentation

❌ **Cons**:
- Class names can get long
- Learning curve for utility classes
- Not traditional CSS

---

## ADR-009: Recharts for Data Visualization

**Date**: October 2025
**Status**: Active

### Decision
Use Recharts library for all charts and data visualizations.

### Context
Need to display engagement trends, comparisons, and analytics in visual format.

### Rationale
- **React-native** - Components fit React paradigm
- **Responsive** - Charts resize automatically
- **Customizable** - Easy to style with Tailwind colors
- **Simple API** - Declarative, not imperative
- **Good documentation** - Many examples available

### Alternatives Considered
1. **Chart.js** - Imperative API, harder to integrate with React
2. **D3.js** - Too low-level, steep learning curve
3. **Victory** - Similar but less popular, smaller community
4. **ApexCharts** - Good but license concerns

### Trade-offs
✅ **Pros**:
- React-native API
- Responsive by default
- Customizable
- Good TypeScript support
- Active community

❌ **Cons**:
- Bundle size (~100kb)
- Client-side only (no SSR)
- Some advanced features missing

---

## ADR-010: Centralized Database Functions (lib/db.ts)

**Date**: October 2025
**Status**: Active

### Decision
All database operations must go through functions in `lib/db.ts`, never raw SQL in components or API routes.

### Context
Need consistent data access patterns, error handling, and type safety across all database operations.

### Rationale
- **Single source of truth** - All queries in one place
- **Reusability** - Functions used by CLI, dashboard, AI assistant
- **Type safety** - TypeScript interfaces for all return types
- **Error handling** - Consistent error patterns
- **Testing** - Easy to mock database layer

### Alternatives Considered
1. **Raw SQL everywhere** - Duplication, inconsistent error handling
2. **ORM (Prisma, Drizzle)** - Overkill, adds complexity
3. **Repository pattern** - More structure than needed
4. **GraphQL** - Too complex for this use case

### Trade-offs
✅ **Pros**:
- Centralized logic
- Type-safe
- Reusable across CLI and dashboard
- Easy to test
- Consistent error handling

❌ **Cons**:
- All queries must be pre-defined
- Can't do ad-hoc queries easily
- Single file can get large (currently 500+ lines)

---

## ADR-011: Team Profile Type

**Date**: October 2025
**Status**: Active

### Decision
Add "Team" as a new profile type alongside "Own", "Competitor", "Inspiration", "Partner", "Other".

### Context
Users wanted to track team member LinkedIn activity separately from their own posts and competitors.

### Rationale
- **Clear categorization** - Distinct from other types
- **Visual identity** - Purple badge with 👥 icon
- **Analytics** - Can aggregate team performance
- **Flexible** - Profiles can change type later

### Alternatives Considered
1. **Use "Other" type** - Not specific enough
2. **Custom tags** - More complex to implement
3. **Separate table** - Overkill, unnecessary normalization

### Trade-offs
✅ **Pros**:
- Clear visual distinction
- Easy filtering
- No schema changes needed
- Backward compatible

❌ **Cons**:
- Another type to maintain
- Need to update UI in multiple places

---

## ADR-012: Workspace Batch Scraping

**Date**: October 2025
**Status**: Active

### Decision
Use Apify's `targetUrls` array parameter to scrape all profiles in a workspace with a single API call, scraping up to 6 profiles in parallel.

### Context
Users wanted to refresh all profiles in a workspace without triggering individual scrape operations.

### Rationale
- **6x faster** - Parallel scraping vs sequential
- **Single API call** - Simpler, less error-prone
- **Same cost** - Apify charges per post, not per actor run
- **Automatic mapping** - Posts mapped to correct profile via `authorProfileUrl`
- **Better UX** - Single progress modal

### Alternatives Considered
1. **Sequential scraping** - 6x slower, worse UX
2. **Client-side parallel calls** - Race conditions, harder to track
3. **Background job queue** - Overkill for this use case

### Trade-offs
✅ **Pros**:
- Much faster (6 profiles in ~30 seconds)
- Single API call
- Same cost as sequential
- Clean progress tracking
- Automatic profile mapping

❌ **Cons**:
- More complex post-processing (mapping posts to profiles)
- All-or-nothing (one failure affects all)
- Harder to debug individual failures

---

## ADR-013: Magic UI + shadcn/ui Design System

**Date**: October 26, 2025
**Status**: Active

### Decision
Adopt Magic UI and shadcn/ui as the design system foundation, adding animated components to enhance the dashboard experience.

### Context
The dashboard was functional but lacked visual polish and modern UI patterns. Users expected a professional SaaS-quality experience with smooth animations and engaging interactions.

### Rationale
- **Perfect stack alignment** - Built on same technologies we use (Next.js, Tailwind, TypeScript)
- **Copy-paste philosophy** - No external dependencies, full code ownership
- **150+ animated components** - Extensive library of dashboard-ready components
- **Professional animations** - Purposeful, subtle animations that enhance UX
- **Free and open-source** - MIT license, no ongoing costs
- **Built on shadcn/ui** - Uses same CLI and patterns as shadcn/ui
- **Animation engine (Framer Motion)** - Industry-standard, GPU-accelerated
- **Dashboard-optimized** - Number tickers, animated charts, bento grids

### Alternatives Considered
1. **Keep current UI** - Functional but looks dated compared to modern SaaS products
2. **Build animations from scratch** - Time-consuming, reinventing the wheel
3. **Use a heavy UI library (MUI, Ant Design)** - Too opinionated, bundle bloat, hard to customize
4. **Headless UI + custom animations** - More work, less cohesive
5. **Framer Motion only** - Would need to build all components ourselves
6. **Tailwind UI** - Not free, limited animated components

### Trade-offs
✅ **Pros**:
- Professional, modern appearance
- 150+ ready-to-use components
- Copy-paste approach (full code ownership)
- No external dependencies (code lives in our repo)
- Perfect for dashboards (number tickers, charts, stats)
- GPU-accelerated animations (60 FPS)
- Accessibility built-in (ARIA compliant)
- Works with Next.js Server Components
- Free and open-source

❌ **Cons**:
- Initial setup time (~30 minutes)
- Need to learn new component API
- Framer Motion adds ~50kb to bundle
- More code in `components/ui/` folder
- Need to maintain copied components
- Risk of over-animating (requires discipline)

### Implementation Plan
**Phase 1 (Week 1)**: Setup + high-impact components (number-ticker, bento-grid, blur-fade)
**Phase 2 (Week 2)**: Visual polish (sparkles, animated-border, dot-pattern)
**Phase 3 (Week 3)**: Advanced features (animated-beam, shimmer-button)

### Success Criteria
- [ ] Dashboard looks "SaaS-quality" professional
- [ ] Stat changes animate smoothly (number-ticker)
- [ ] Page transitions feel polished (blur-fade)
- [ ] All animations maintain 60 FPS
- [ ] Respects `prefers-reduced-motion`
- [ ] No negative performance impact

### Documentation
See `.claude/docs/DESIGN-SYSTEM.md` for complete implementation guidelines, component catalog, and animation principles.

---

## Technology Choices Summary

### Frontend Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.7 (strict mode)
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts 3.2.1
- **State**: React Context + URL params
- **Deployment**: Vercel

### Backend Stack
- **Runtime**: Node.js 18+
- **Database**: Neon PostgreSQL
- **ORM**: None (raw SQL via `pg`)
- **API**: Next.js API Routes
- **CLI**: Commander.js

### External Services
- **Scraping**: Apify (harvestapi/linkedin-profile-posts)
- **AI**: OpenAI GPT-4 Turbo
- **Database Hosting**: Neon
- **Deployment**: Vercel

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Formatting**: Prettier (via VS Code)
- **Version Control**: Git + GitHub

---

## Future Decisions Needed

### Under Consideration

1. **Vector Database Integration (Weaviate)**
   - Context: Want semantic search over posts
   - Options: Weaviate, Pinecone, Qdrant
   - Status: Research phase, see `.claude/docs/WEAVIATE-SETUP.md`

2. **Authentication System**
   - Context: Currently no user authentication
   - Options: NextAuth.js, Clerk, Supabase Auth
   - Status: Not yet needed, single-user application

3. **Caching Layer**
   - Context: Some queries are slow on large datasets
   - Options: Redis, in-memory cache, React Query
   - Status: Performance adequate for now

4. **Testing Strategy**
   - Context: No automated tests yet
   - Options: Jest, Vitest, Playwright E2E
   - Status: Needed before major refactors

---

---

## ADR-014: Vercel Cron Jobs for News Aggregation

**Date**: November 12, 2025
**Status**: Active

### Decision
Use Vercel Cron Jobs with Bearer token authentication to automate RSS feed aggregation every 4 hours.

### Context
News intelligence system needs to:
- Fetch articles from 15 RSS feeds automatically
- Run GPT-4 analysis on each article (relevance, sentiment, entities)
- Store processed articles in database
- Run reliably without manual intervention
- Support manual triggering for emergencies

### Rationale
- **Vercel native** - Built into platform, no third-party services
- **Serverless** - No infrastructure to manage
- **Flexible scheduling** - Cron expression support (`0 */4 * * *`)
- **Bearer token auth** - Secure, prevents unauthorized triggers
- **5-minute timeout** - Sufficient for ~300 articles with GPT-4 analysis
- **Manual fallback** - Can bypass auth in dev mode for testing

### Implementation Details
```typescript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/aggregate",
      "schedule": "0 */4 * * *"  // Every 4 hours
    }
  ]
}

// Environment variable
CRON_SECRET=cron_[64-char-hex]  // Must be set in Vercel dashboard

// API route authentication
const authHeader = request.headers.get('authorization');
const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
if (process.env.CRON_SECRET && authHeader && authHeader !== expectedAuth) {
  return new Response('Unauthorized', { status: 401 });
}
```

### Alternatives Considered
1. **GitHub Actions cron** - Would work but requires separate workflow file, harder to test locally
2. **External cron service (cron-job.org)** - Reliable but adds external dependency
3. **Long-running process** - Not serverless-friendly, requires dedicated server
4. **Vercel Edge Functions** - Can't use GPT-4 (needs Node.js runtime)

### Trade-offs
✅ **Pros**:
- Zero infrastructure management
- Integrated with Vercel deployments
- No additional cost
- Manual trigger option for testing
- 5-minute execution window sufficient
- Logs integrated with Vercel dashboard

❌ **Cons**:
- Tied to Vercel platform
- Environment variable can be lost during migrations
- Silent failures if not monitored
- 5-minute max duration (could be limiting for larger datasets)

### Manual Fallback Pattern
Added `RefreshNewsButton` component:
- Calls same `/api/cron/aggregate` endpoint
- No auth required in development mode
- Shows progress modal with stats
- Critical UX when cron fails

### Lessons Learned (Nov 2025)
- **Template migrations can break cron jobs** - TailAdmin migration on Nov 4th removed `CRON_SECRET`, breaking automated fetches for 9 days
- **Always add manual fallback** - Users need immediate control when automation fails
- **Monitor last_fetched_at timestamps** - Easy way to detect cron failures
- **Document environment variables** - Created `VERCEL-CRON-SETUP.md` for future reference

---

## Deprecated Decisions

### DEP-001: localStorage for Workspace State (Deprecated Oct 2025)

**Original Decision**: Use localStorage to persist selected workspace.

**Why Deprecated**: Caused sync issues with URL params. URLs couldn't be shared. Navigation broke workspace context.

**Superseded By**: ADR-006 (URL Params as State Source of Truth)

---

## Notes

- This file is part of the Ultrathink methodology implementation
- Update this file when making significant architecture or technology decisions
- Follow ADR format for consistency
- Reference this file in code comments when implementing decisions
- Keep "Future Decisions" section updated with considerations
