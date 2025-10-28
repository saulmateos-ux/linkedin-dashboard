# LinkedIn Analytics System - Master Documentation

**System**: LinkedIn Scraper (CLI) + Analytics Dashboard (Web) + AI Assistant
**Version**: 2.0.0 (Multi-Profile) + 0.2.0 (AI Assistant)
**Status**: ✅ **PRODUCTION READY**
**Last Updated**: October 16, 2025
**Completion**: 100%

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Completed Features](#completed-features)
4. [Technical Stack](#technical-stack)
5. [Database Schema](#database-schema)
6. [CLI Commands Reference](#cli-commands-reference)
7. [Dashboard Features](#dashboard-features)
8. [AI Assistant](#ai-assistant)
9. [API Documentation](#api-documentation)
10. [File Structure](#file-structure)
11. [Configuration](#configuration)
12. [Testing](#testing)
13. [Deployment](#deployment)
14. [What's Next](#whats-next)

---

## 🎯 System Overview

### What It Is

A **complete LinkedIn analytics ecosystem** consisting of three integrated components:

1. **LinkedIn CLI Scraper** - Node.js command-line tool for data collection
2. **Analytics Dashboard** - Next.js web application for visualization
3. **AI Assistant** - GPT-4 powered intelligence layer for insights

### What It Does

- ✅ **Track multiple LinkedIn profiles** (your own + competitors/influencers)
- ✅ **Scrape posts** from any profile using Apify actors
- ✅ **Compare performance** side-by-side with detailed analytics
- ✅ **Export data** in multiple formats (Excel multi-sheet, CSV, JSON)
- ✅ **Visualize analytics** in a web dashboard with charts and filters
- ✅ **AI-powered insights** - Ask questions in natural language
- ✅ **Manage profiles** via CLI or web UI

### Key Capabilities

**Data Collection (CLI)**:
- Multi-profile scraping with cost controls
- Incremental updates (only new posts)
- Automated scheduling support
- Profile comparison analytics
- Advanced multi-sheet Excel exports

**Visualization (Dashboard)**:
- Real-time statistics and engagement charts
- Profile switching and filtering
- Search and sort functionality
- CSV exports
- Profile management UI

**Intelligence (AI Assistant)**:
- Natural language queries
- 8 specialized intelligence functions
- Trending hashtag analysis
- Competitive intelligence
- Content strategy recommendations
- Posting pattern analysis

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Neon PostgreSQL Database                      │
│  • 300+ LinkedIn posts (yours + competitors)                     │
│  • 3 tables: profiles, posts, scraping_runs                      │
│  • Connection pooling, optimized indexes                         │
└───────────────┬─────────────────────┬───────────────────────────┘
                │                     │
    ┌───────────▼──────────┐    ┌────▼──────────────────┐
    │  LinkedIn CLI        │    │  Analytics Dashboard   │
    │  (Node.js)           │    │  (Next.js 15)          │
    ├──────────────────────┤    ├───────────────────────┤
    │ • Profile CRUD       │    │ • Profile selector     │
    │ • Multi-scraping     │    │ • Add profile UI       │
    │ • Comparison         │    │ • Stats/charts         │
    │ • Enhanced exports   │    │ • Profile management   │
    └──────────┬───────────┘    └───────────┬───────────┘
               │                            │
               └────────────┬───────────────┘
                            │
                ┌───────────▼────────────┐
                │   Apify Scraper API    │
                │  (LinkedIn Post Data)  │
                └────────────────────────┘
                            │
                            ▼
                ┌───────────────────────────┐
                │  AI Intelligence Layer     │
                │  (GPT-4 Function Calling)  │
                ├───────────────────────────┤
                │ • getTrendingHashtags()   │
                │ • getCompetitiveIntel()   │
                │ • getTopicPerformance()   │
                │ • getPostingPatterns()    │
                │ • getRecentActivity()     │
                │ • getStats()              │
                │ • getTopPosts()           │
                │ • query_database()        │
                └───────────────────────────┘
```

### Data Flow

**Scraping Flow**:
1. **CLI/Dashboard** → Triggers scrape for profile(s)
2. **Apify** → Scrapes LinkedIn posts (respects rate limits)
3. **Transform** → Normalizes data, extracts metadata
4. **Neon DB** → Stores posts with profile_id foreign key
5. **Dashboard/CLI** → Queries filtered by profile, displays analytics

**AI Query Flow**:
1. **User** → Asks question in chat interface
2. **Frontend** → POST to `/api/ai-query`
3. **GPT-4** → Analyzes question, selects functions to call
4. **Functions** → Execute SQL queries on Neon database
5. **GPT-4** → Analyzes results, generates insights
6. **Frontend** → Displays answer in chat

---

## ✅ Completed Features

### CLI Features (v2.0.0)

**Profile Management** ✅
- Add/remove/update profiles
- List profiles with filtering by type
- Set primary profile
- Profile metadata (headline, industry, notes)
- Validation and duplicate checking

**Multi-Profile Scraping** ✅
- Single profile scraping
- Bulk scraping (`--all` flag)
- Type-based scraping (`--type competitor`)
- Sequential execution with delays
- Cost estimation and controls
- Error handling with partial success

**Comparison & Analytics** ✅
- Head-to-head profile comparison
- Detailed statistics per profile
- Engagement rate analysis
- Content pattern detection
- Winner determination

**Enhanced Exports** ✅
- Multi-sheet Excel exports
- Profile comparison summary sheet
- Color-coded by profile type
- CSV with profile columns
- Nested JSON format
- Filtering and sorting options

### Dashboard Features (v0.2.0)

**Core Dashboard** ✅
- Real-time statistics cards
- Engagement over time chart (30 days)
- Top posts table
- Profile selector dropdown
- Refresh button with post count options

**Profile Management** ✅
- Profile list page with type filtering
- Add profile modal with validation
- Profile detail pages
- Profile cards with post counts
- Type badges and primary indicators

**Posts Management** ✅
- All posts view with pagination
- Search by content or author
- Sort by date/likes/comments/shares/engagement
- Profile filtering
- CSV export

**Data Management** ✅
- Trigger scraping from browser
- CSV export with filters
- Profile CRUD operations
- Profile switching with URL params

### AI Assistant Features (v0.2.0) ✅

**Chat Interface** ✅
- Beautiful chat UI at `/insights`
- Suggested questions (6 pre-built)
- Conversation history
- Typing indicators
- Timestamps
- Clear chat button

**Intelligence Functions** ✅
- `getTrendingHashtags()` - Popular hashtags (last 30 days)
- `getCompetitiveIntel()` - Compare all profiles
- `getTopicPerformance()` - Engagement per hashtag
- `getPostingPatterns()` - Best days/times to post
- `getRecentActivity()` - Last 7 days summary
- `getStats()` - Overall statistics
- `getTopPosts()` - Highest performing posts
- `query_database()` - Custom SQL queries

**AI Capabilities** ✅
- Natural language queries
- GPT-4 function calling
- Direct database access
- 3-10 second response times
- Context-aware responses
- Multi-function orchestration

---

## 💻 Technical Stack

### Backend (CLI)
- **Language**: Node.js 18+
- **Database**: Neon PostgreSQL (async with `pg` client)
- **Scraping**: Apify Client SDK
- **CLI Framework**: Commander.js
- **Logging**: Winston
- **Export Libraries**: ExcelJS, csv-writer, JSON
- **Utilities**: ora, chalk, inquirer

### Frontend (Dashboard)
- **Framework**: Next.js 15.5.5 (App Router)
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS 4
- **Database**: Neon PostgreSQL (`pg` client)
- **Charts**: Recharts 3.2.1
- **Deployment**: Vercel
- **Rendering**: React Server Components + Client Components

### AI Layer
- **Model**: OpenAI GPT-4 Turbo
- **API**: OpenAI Node.js SDK
- **Pattern**: Function Calling
- **Functions**: 8 specialized intelligence functions
- **Integration**: Next.js API Routes

### Database
- **Provider**: Neon (serverless PostgreSQL)
- **Connection**: Connection pooling via `pg.Pool`
- **Schema**: 3 tables (profiles, posts, scraping_runs)
- **Shared**: Both CLI and dashboard use same database
- **Performance**: Optimized indexes, connection pooling

---

## 🗄️ Database Schema

### profiles table
```sql
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  profile_url TEXT UNIQUE NOT NULL,
  display_name VARCHAR(255),
  headline TEXT,
  follower_count INTEGER,
  is_primary BOOLEAN DEFAULT false,
  profile_type VARCHAR(50) DEFAULT 'competitor',
  industry VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure only one primary profile
CREATE UNIQUE INDEX idx_one_primary_profile
  ON profiles(is_primary) WHERE is_primary = true;

CREATE INDEX idx_profiles_type ON profiles(profile_type);
CREATE INDEX idx_profiles_username ON profiles(username);
```

### posts table
```sql
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  profile_id INTEGER REFERENCES profiles(id),
  post_url TEXT UNIQUE NOT NULL,
  content TEXT,
  content_preview TEXT,
  author_name TEXT NOT NULL,
  author_username TEXT,
  published_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ,
  media_type VARCHAR(50),
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  engagement_total INTEGER DEFAULT 0,
  engagement_rate REAL DEFAULT 0,
  hashtags JSONB,
  mentions JSONB,
  reactions JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_profile_id ON posts(profile_id);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_engagement_total ON posts(engagement_total DESC);
CREATE INDEX idx_posts_author_username ON posts(author_username);
CREATE INDEX idx_posts_author_name ON posts(author_name);
```

### scraping_runs table
```sql
CREATE TABLE scraping_runs (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER REFERENCES profiles(id),
  run_id TEXT,
  actor_id TEXT,
  status VARCHAR(50),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  posts_scraped INTEGER,
  new_posts INTEGER,
  updated_posts INTEGER,
  cost_usd DECIMAL(10, 4),
  error_message TEXT
);

CREATE INDEX idx_scraping_runs_profile_id ON scraping_runs(profile_id);
CREATE INDEX idx_scraping_runs_started_at ON scraping_runs(started_at DESC);
```

---

## 📝 CLI Commands Reference

### Profile Management

```bash
# Add a profile
profile add <url> [options]
  --name <name>          Display name
  --type <type>          competitor|inspiration|partner|other
  --notes <notes>        Notes about profile

# Examples
profile add https://linkedin.com/in/satyanadella --type inspiration --name "Satya Nadella"
profile add https://linkedin.com/in/competitor1 --type competitor

# List profiles
profile list [options]
  --type <type>          Filter by type

# Remove profile
profile remove <username> [options]
  --yes                  Skip confirmation
  --delete-posts         Also delete all posts

# Set primary profile
profile set-primary <username> [options]
  --yes                  Skip confirmation

# Update profile
profile update <username> [options]
  --name <name>          Update display name
  --type <type>          Update type
  --notes <notes>        Update notes
```

### Multi-Profile Scraping

```bash
# Scrape single profile (default: primary)
scrape [options]
  --profile <username>   Scrape specific profile
  --all                  Scrape all profiles
  --type <type>          Scrape all of type
  --max-posts <number>   Max posts per profile (default: 500)
  --incremental          Only new posts since last scrape

# Examples
scrape                                    # Primary profile only
scrape --profile competitor1 --max-posts 50
scrape --all --max-posts 100             # All profiles, 100 posts each
scrape --type competitor --incremental    # All competitors, new posts only
```

### Comparison & Analytics

```bash
# Compare two profiles
compare <profile1> <profile2> [options]
  --detailed             Include top posts analysis

# Examples
compare yourname competitor1
compare yourname competitor1 --detailed

# Stats
stats [options]
  --profile <username>   Stats for specific profile
  --all                  Combined stats for all
  --period <period>      all|last-week|last-month|last-year
  --detailed             Include trends

# Examples
stats                                     # Primary profile
stats --profile competitor1
stats --all                              # All profiles combined
```

### Enhanced Exports

```bash
# Export
export [options]
  -f, --format <format>      json|csv|excel (default: json)
  -o, --output <path>        Output file path
  --profile <username>       Export specific profile
  --type <type>             Export all of type
  -a, --all                 Export all profiles
  --separate-sheets          Multi-sheet Excel (one per profile)
  --date-from <date>        Filter from date (YYYY-MM-DD)
  --date-to <date>          Filter to date (YYYY-MM-DD)
  --min-likes <number>      Minimum likes threshold

# Examples
export --format json --profile yourname
export --format csv --type competitor
export --format excel --all --separate-sheets --output comparison.xlsx
export --format json --all                # Nested JSON format
```

---

## 🌐 Dashboard Features

### URLs

```
/                          Dashboard (with ProfileSelector)
/?profile=123              Dashboard for specific profile
/?profile=all              Dashboard for all profiles

/insights                  AI Assistant chat interface
/insights                  Ask AI questions about your data

/profiles                  Profile management page
/profiles?type=competitor  Filter by competitor type
/profiles/123              Profile detail page

/posts                     All posts page
/posts?profile=123         Posts from specific profile
```

### Key Components

**ProfileSelector** (`components/ProfileSelector.tsx`)
- Dropdown in header (top-right)
- Shows all profiles with ⭐ for primary
- Client-side navigation with URL params
- "All Profiles" aggregation option

**AIChat** (`components/AIChat.tsx`)
- Full chat interface with message history
- Suggested questions (6 pre-built)
- Typing indicators and timestamps
- Conversation memory
- Error handling
- Clear chat button

**ProfilesHeader** (`components/ProfilesHeader.tsx`)
- Page header with "Add Profile" button
- Opens AddProfileModal

**AddProfileModal** (`components/AddProfileModal.tsx`)
- Form for adding profiles
- Fields: URL, name, type, notes
- Client-side validation
- Error handling
- Auto-refresh on success

**ProfileCard** (`components/ProfileCard.tsx`)
- Shows profile info with avatar initials
- Post count badge
- Type badge (color-coded)
- "View Details" link

**StatsCard** (`components/StatsCard.tsx`)
- Displays metrics (posts, likes, comments, shares)
- Shows average per post
- Icon + number + subtitle

**EngagementChart** (`components/EngagementChart.tsx`)
- 30-day trend line chart
- Filtered by selected profile
- Recharts library
- Responsive design

**PostsTable** (`components/PostsTable.tsx`)
- Top posts with engagement metrics
- Sorted by total engagement
- Shows content preview, hashtags, media type
- Links to LinkedIn posts

**RefreshButton** (`components/RefreshButton.tsx`)
- Triggers scrape from browser
- Dropdown for post count (10/20/50/100/200/500)
- Shows loading state
- Success/error notifications

---

## 🤖 AI Assistant

### Overview

The AI Assistant is a **GPT-4 powered intelligence layer** that allows you to query your LinkedIn data in natural language. It uses **Function Calling** to directly query the database with 8 specialized functions.

**Location**: http://localhost:3000/insights (or your deployed URL)

### How It Works

1. **User asks a question** in the chat interface (e.g., "What are my trending hashtags?")
2. **Frontend sends request** to `/api/ai-query` with question + conversation history
3. **GPT-4 analyzes the question** and selects appropriate function(s) to call
4. **Functions execute SQL queries** against Neon PostgreSQL database
5. **Results returned to GPT-4** for analysis and insight generation
6. **AI responds** with natural language insights and recommendations

### Available Functions

**1. getTrendingHashtags(limit)**
- Returns most popular hashtags from last 30 days
- Includes post count, total engagement, avg engagement per post
- Sorted by total engagement

**2. getCompetitiveIntel()**
- Compares all tracked profiles
- Returns post counts, averages, top hashtags per profile
- Ideal for competitive analysis

**3. getTopicPerformance(limit)**
- Shows engagement metrics for each hashtag/topic
- Calculates avg likes, comments, shares per hashtag
- Helps identify what topics resonate

**4. getPostingPatterns()**
- Analyzes best days and times to post
- Groups by day of week and hour of day
- Shows avg engagement and post count

**5. getRecentActivity()**
- Daily summary of posts from last 7 days
- Shows post count and total engagement per day
- Quick snapshot of recent performance

**6. getStats(profileId)**
- Overall statistics: total posts, likes, comments, shares
- Averages per post
- Can filter by specific profile

**7. getTopPosts(limit, profileId)**
- Highest performing posts by engagement
- Returns full post details
- Can filter by profile

**8. query_database(sql)**
- Executes custom SQL queries (SELECT only)
- For complex analysis not covered by other functions
- Security: Only SELECT queries allowed

### Example Questions

Try asking:
- "What are my trending hashtags this month?"
- "How do I compare to Nicolas Boucher?"
- "When is the best time to post?"
- "Show me my top 5 posts"
- "What content strategy should I focus on?"
- "What topics perform best?"
- "Tell me the last 5 posts from Saul"
- "Compare Saul Mateos to competitors"
- "What days get the most engagement?"
- "Show me posts from last week"

### Suggested Questions

The interface provides 6 pre-built questions:
1. 📈 What are my trending hashtags this month?
2. ⚔️ How do I compare to my competitors?
3. ⏰ When is the best time to post?
4. 🎯 What topics perform best?
5. 🏆 Show me my top 5 posts
6. 💡 What content strategy should I focus on?

### Architecture

**Files**:
- `app/api/ai-query/route.ts` - Main AI endpoint (371 lines)
- `components/AIChat.tsx` - Chat interface (267 lines)
- `app/insights/page.tsx` - Insights landing page
- `lib/db.ts` - 8 intelligence functions

**Technology**:
- OpenAI GPT-4 Turbo (`gpt-4-turbo-preview`)
- Function Calling pattern
- Direct database access (no external API)
- Server-side rendering (Next.js API routes)

**Performance**:
- Response time: 3-10 seconds
- Depends on query complexity
- Multiple function calls in single query
- Real-time data (no caching)

### Configuration

Add to `.env.local`:
```bash
OPENAI_API_KEY=sk-...your-openai-api-key...
```

No other setup needed! Uses same `DATABASE_URL` as the rest of the system.

---

## 🔌 API Documentation

### POST /api/ai-query

Query the AI Assistant with natural language questions.

**Request Body**:
```json
{
  "question": "What are my trending hashtags?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "previous question"
    },
    {
      "role": "assistant",
      "content": "previous answer"
    }
  ]
}
```

**Response** (Success - 200):
```json
{
  "answer": "Based on your last 30 days of posts, your trending hashtags are...",
  "data": {
    "name": "get_trending_hashtags",
    "data": [...]
  },
  "functionsCalled": ["get_trending_hashtags"]
}
```

**Response** (Error - 400/500):
```json
{
  "error": "Failed to process your question",
  "details": "Error message"
}
```

---

### POST /api/profiles

Add a new LinkedIn profile to track.

**Request Body**:
```json
{
  "profileUrl": "https://linkedin.com/in/username",
  "displayName": "Display Name",
  "profileType": "competitor|inspiration|partner|other",
  "notes": "Optional notes"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "profile": {
    "id": 2,
    "username": "username",
    "profileUrl": "https://linkedin.com/in/username",
    "displayName": "Display Name",
    "profileType": "competitor",
    "isPrimary": false
  }
}
```

**Validations**:
- Profile URL must contain `linkedin.com/in/`
- Display name required
- Profile type required
- Username extracted automatically
- Duplicate checking

---

### POST /api/scrape

Trigger LinkedIn post scraping from browser.

**Request Body**:
```json
{
  "profileId": 1,
  "maxPosts": 10
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "Scrape complete! 5 new posts, 5 updated",
  "postsFound": 10,
  "newPosts": 5,
  "updatedPosts": 5,
  "runId": "apify-run-id"
}
```

---

### GET /api/export

Export posts to CSV.

**Query Params**:
- `profileId` - Filter by profile
- `search` - Search in content
- `sortBy` - Sort field (date, likes, comments, etc.)
- `order` - Sort order (asc, desc)

**Response**: CSV file download

---

## 📁 File Structure

### CLI Project (`linkedin scraper/`)

```
linkedin scraper/
├── bin/
│   └── cli.js                      # Main CLI entry point
├── src/
│   ├── commands/                   # Command handlers
│   │   ├── scrape.js              # Multi-profile scraping
│   │   ├── export.js              # Enhanced exports
│   │   ├── compare.js             # Profile comparison
│   │   ├── stats.js               # Stats command
│   │   ├── list.js                # List posts
│   │   ├── config.js              # Configuration
│   │   └── profile.js             # Profile management
│   ├── services/                   # Business logic
│   │   ├── apify-service.js       # Apify API wrapper
│   │   ├── linkedin-service.js    # Data transformation
│   │   ├── profile-service.js     # Profile CRUD
│   │   └── comparison-service.js  # Comparison logic
│   ├── storage/
│   │   └── database.js            # PostgreSQL operations
│   ├── export/                     # Export modules
│   │   ├── json-exporter.js       # JSON export (nested format)
│   │   ├── csv-exporter.js        # CSV export (profile columns)
│   │   └── excel-exporter.js      # Excel export (multi-sheet)
│   └── utils/                      # Utilities
│       ├── config-loader.js       # Config management
│       ├── logger.js              # Winston logger
│       ├── validators.js          # Input validation
│       └── date-utils.js          # Date formatting
├── docs/                           # Documentation
│   ├── MASTER-DOCUMENTATION.md    # Complete system docs
│   ├── multi-profile-implementation-plan.md
│   ├── web-ui-dashboard-plan.md
│   ├── TESTING-GUIDE.md
│   └── linkedin-visualization-project.md
├── scripts/                        # Migration scripts
│   ├── migrate-add-profiles.js
│   └── rollback-profiles.js
├── .env.example
├── CLAUDE.md
├── package.json
└── README.md
```

### Dashboard Project (`linkedin-dashboard/`)

```
linkedin-dashboard/
├── app/                            # Next.js App Router
│   ├── page.tsx                   # Dashboard (profile-filtered)
│   ├── insights/
│   │   └── page.tsx               # AI Assistant page
│   ├── profiles/
│   │   ├── page.tsx               # Profile list + Add button
│   │   └── [id]/page.tsx          # Profile detail
│   ├── posts/
│   │   └── page.tsx               # All posts page
│   ├── layout.tsx                 # Root layout
│   └── api/                       # API routes
│       ├── ai-query/route.ts      # AI Assistant endpoint
│       ├── profiles/route.ts      # Add profile API
│       ├── scrape/route.ts        # Scrape trigger
│       └── export/route.ts        # CSV export
├── components/                     # React components
│   ├── AIChat.tsx                 # AI chat interface
│   ├── ProfileSelector.tsx        # Profile dropdown
│   ├── ProfilesHeader.tsx         # Header with Add button
│   ├── AddProfileModal.tsx        # Add profile modal
│   ├── ProfileCard.tsx            # Profile card
│   ├── StatsCard.tsx              # Stat display
│   ├── EngagementChart.tsx        # Chart component
│   ├── PostsTable.tsx             # Posts table
│   ├── RefreshButton.tsx          # Scrape trigger
│   └── SearchBar.tsx              # Search/filter
├── lib/
│   └── db.ts                      # Database functions + AI functions
├── public/                         # Static assets
├── MASTER-DOCUMENTATION.md         # This file
├── CLAUDE.md                       # Technical documentation
├── README.md                       # User-facing documentation
├── PLAN.md                         # Implementation roadmap (archived)
├── .env.local                      # Environment variables
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## ⚙️ Configuration

### Environment Variables

**Required** (both CLI and Dashboard):
```bash
# Database
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require

# Apify (for scraping)
APIFY_API_KEY=apify_api_xxxxxx
LINKEDIN_PROFILE_URL=https://linkedin.com/in/yourname

# OpenAI (for AI Assistant)
OPENAI_API_KEY=sk-...your-openai-api-key...
```

**Optional**:
```bash
# Scraping
DEFAULT_MAX_POSTS=500
MAX_COST_PER_SCRAPE=5.00
COST_WARNING_THRESHOLD=1.00
DEFAULT_ACTOR=harvestapi/linkedin-profile-posts

# Multi-profile
PROFILES_AUTO_SCRAPE_BEHAVIOR=primary-only
PROFILES_MAX_PER_SCRAPE=10
PROFILES_SCRAPE_DELAY_SECONDS=30

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true

# Export
EXPORT_DIR=./data/exports
EXPORT_DATE_FORMAT=ISO
```

### Config Files

**CLI**:
- `config/default.json` - Default settings
- `config/local.json` - Local overrides (git-ignored)
- `.env` - Environment overrides (highest priority)

**Dashboard**:
- `.env.local` - Local environment variables (git-ignored)

---

## 🧪 Testing

### Quick Test Checklist

**CLI** (5 minutes):
```bash
cd "/Users/saulmateos/Documents/GitHub/linkedin scraper"

# Test profile management
profile list

# Test scraping
scrape --profile yourname --max-posts 5

# Test comparison
compare yourname competitor1

# Test export
export --format excel --all --separate-sheets --output ~/Desktop/test.xlsx
open ~/Desktop/test.xlsx
```

**Dashboard** (5 minutes):
```bash
cd /Users/saulmateos/Documents/GitHub/linkedin-dashboard

# Start dev server
npm run dev

# Visit http://localhost:3000
# 1. Test ProfileSelector - switch profiles
# 2. Visit /profiles - click "Add Profile"
# 3. Visit /insights - ask AI question
# 4. Test scraping with Refresh button
```

### Manual Testing Checklist

**CLI Features**:
- [ ] Add 2-3 test profiles
- [ ] List profiles and filter by type
- [ ] Scrape single profile
- [ ] Scrape all profiles with `--all`
- [ ] Compare two profiles
- [ ] Export to Excel with `--separate-sheets`
- [ ] Verify Excel has summary sheet + profile sheets

**Dashboard Features**:
- [ ] Visit homepage - see stats
- [ ] Click ProfileSelector - switch profiles
- [ ] Stats update when switching
- [ ] Visit `/profiles` page
- [ ] Click "Add Profile" button
- [ ] Add a new profile successfully
- [ ] See new profile card appear
- [ ] Filter profiles by type
- [ ] Visit profile detail page
- [ ] Export CSV from posts page

**AI Assistant**:
- [ ] Visit `/insights` page
- [ ] Click a suggested question
- [ ] AI responds with insights
- [ ] Ask custom question
- [ ] AI remembers conversation context
- [ ] Test question: "What are my trending hashtags?"
- [ ] Test question: "Compare me to competitors"
- [ ] Test question: "Show my top 5 posts"
- [ ] Verify response time (3-10 seconds)
- [ ] Test Clear Chat button

### Automated Testing

```bash
# CLI tests (if available)
cd "/Users/saulmateos/Documents/GitHub/linkedin scraper"
npm test

# Dashboard tests (if available)
cd /Users/saulmateos/Documents/GitHub/linkedin-dashboard
npm test
```

---

## 🚀 Deployment

### CLI Deployment

**Option 1: Local Machine**
```bash
# Install globally
cd "/Users/saulmateos/Documents/GitHub/linkedin scraper"
npm link

# Use from anywhere
scrape --all
stats --all
export --format excel --all --separate-sheets
```

**Option 2: Server (PM2)**
```bash
# For scheduled scraping
pm2 start ecosystem.config.js
pm2 save
```

---

### Dashboard Deployment

**Option 1: Vercel (Recommended)**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd /Users/saulmateos/Documents/GitHub/linkedin-dashboard
vercel

# Set environment variables in Vercel dashboard:
# DATABASE_URL
# APIFY_API_KEY
# LINKEDIN_PROFILE_URL
# OPENAI_API_KEY
```

**Option 2: Self-Hosted**

```bash
# Build
cd /Users/saulmateos/Documents/GitHub/linkedin-dashboard
npm run build

# Start production server
npm start

# Or with PM2
pm2 start npm --name "linkedin-dashboard" -- start
```

**Option 3: Docker**

```bash
# Build image
docker build -t linkedin-dashboard .

# Run container
docker run -p 3000:3000 --env-file .env.local linkedin-dashboard
```

---

## 🎯 What's Next

### Completed (100%) ✅

**CLI (v2.0.0)**:
- [x] Multi-profile tracking and management
- [x] Multi-profile scraping (single, bulk, type-based)
- [x] Profile comparison analytics
- [x] Enhanced exports (multi-sheet Excel)
- [x] Profile CRUD operations
- [x] Cost controls and error handling

**Dashboard (v0.2.0)**:
- [x] Profile selector with filtering
- [x] Profile management pages
- [x] Add profile UI with modal
- [x] Profile-filtered dashboard
- [x] Profile detail pages
- [x] CSV export
- [x] Scraping trigger from browser

**AI Assistant (v0.2.0)**:
- [x] GPT-4 function calling integration
- [x] 8 intelligence functions
- [x] Chat interface at `/insights`
- [x] Suggested questions
- [x] Conversation history
- [x] Natural language queries
- [x] Real-time database access

### Optional Enhancements (Future)

**Dashboard**:
1. **Comparison Mode UI** - Side-by-side profile comparison page
2. **Profile Delete UI** - Delete profiles from dashboard
3. **Profile Avatars** - Upload/fetch profile photos
4. **Advanced Filters** - Date ranges, hashtag filtering
5. **Dashboard Customization** - Drag-and-drop widgets

**AI Assistant**:
1. **Semantic Search** - pgvector embeddings for content search
2. **Custom GPT** - Standalone GPT accessible anywhere
3. **Slack Integration** - Query AI from Slack
4. **Sentiment Analysis** - Analyze post sentiment
5. **Content Recommendations** - AI suggests topics
6. **Predictive Engagement** - ML model for performance prediction
7. **Competitive Alerts** - Notifications for competitor activity
8. **Scheduled Reports** - Weekly/monthly AI summaries via email

**CLI**:
1. **Scheduled Scraping** - Cron job integration
2. **Email Notifications** - Alerts on scraping completion
3. **Advanced Comparison** - Time-series comparison charts
4. **Bulk Operations** - Batch profile import from CSV

---

## 📊 System Status

### Current Status

| Component | Version | Status | Completion |
|-----------|---------|--------|------------|
| **CLI Scraper** | v2.0.0 | ✅ Production | 100% |
| **Analytics Dashboard** | v0.2.0 | ✅ Production | 100% |
| **AI Assistant** | v0.2.0 | ✅ Production | 100% |
| **Overall System** | v2.0.0 | ✅ Production | 100% |

### Key Metrics

- **Total Profiles**: 2+ (primary + competitors)
- **Total Posts**: 300+
- **Database**: Neon PostgreSQL (cloud)
- **CLI Commands**: 8 main commands
- **Dashboard Pages**: 5 main pages
- **AI Functions**: 8 intelligence functions
- **API Endpoints**: 4 endpoints
- **Response Time**: <10s for AI queries

### Deployment Status

- **CLI**: Installed locally, ready for server deployment
- **Dashboard**: Deployed on Vercel (production)
- **Database**: Neon (serverless, auto-scaling)
- **AI**: OpenAI GPT-4 Turbo (API)

---

## 💰 Cost Breakdown

### Monthly Operational Costs

| Service | Cost | Notes |
|---------|------|-------|
| **Neon Database** | $0 | Free tier (0.5GB storage, 100 compute hours) |
| **OpenAI API** | ~$0.50 | AI queries (~100 queries/month @ $0.005 each) |
| **Apify Scraping** | ~$2 | 100 posts/day, $0.002 per post |
| **Vercel Hosting** | $0-20 | Hobby ($0) or Pro ($20) |
| **Total** | **$3-23/month** | Depending on usage and hosting tier |

### Cost Optimization Tips

1. Use `--incremental` flag for scraping (only new posts)
2. Scrape less frequently (weekly instead of daily)
3. Reduce `--max-posts` to only what you need
4. Use Vercel hobby tier if within limits
5. Monitor OpenAI API usage in dashboard

---

## 🛠️ Troubleshooting

### Common Issues

**Dashboard loads slowly**
- **Solution**: Use production mode (`npm run build && npm start`)
- Development mode doesn't cache data
- Expected: ~1s first load, instant after

**Author names showing "[object Object]"**
- **Cause**: Bug in scraper v0.1.0
- **Fixed in**: v0.2.0 (October 2025)
- **Solution**: Re-scrape posts OR run SQL cleanup (see CLAUDE.md)

**AI returns "column does not exist" error**
- **Cause**: GPT-4 using wrong column names
- **Fixed in**: v0.2.0 system prompt includes complete schema
- **Key columns**: Use `author_name` (NOT "author"), `published_at` (NOT "date_posted")

**Scraping fails**
- Check `APIFY_API_KEY` is valid
- Verify Apify credits available
- Check Apify console for actor errors
- Try alternative actor with `--actor` flag

**AI gives incorrect insights**
- Ensure 50+ posts for meaningful analysis
- Check OpenAI API key and credits
- View console logs to see which functions were called
- Try rephrasing question more specifically

**Profile not appearing in dashboard**
- Check profile was added successfully (`profile list`)
- Verify scraping completed without errors
- Check posts have correct `profile_id` in database

---

## 📚 Documentation Index

### This Repository (Dashboard)
- **MASTER-DOCUMENTATION.md** (this file) - Complete system reference
- **README.md** - User-facing documentation
- **CLAUDE.md** - Technical documentation for AI assistants
- **PLAN.md** - Implementation roadmap (archived)

### CLI Repository
- **MASTER-DOCUMENTATION.md** - System documentation (outdated, see this file instead)
- **README.md** - CLI user guide
- **CLAUDE.md** - CLI technical documentation
- **docs/TESTING-GUIDE.md** - Comprehensive testing guide
- **docs/multi-profile-implementation-plan.md** - Phase breakdown
- **docs/web-ui-dashboard-plan.md** - Dashboard specifications

### External Resources
- **Live Dashboard**: https://linkedin-dashboard-mutip17q6-saul-mateos-projects.vercel.app
- **GitHub (Dashboard)**: https://github.com/saulmateos-ux/linkedin-dashboard
- **GitHub (CLI)**: https://github.com/saulmateos-ux/linkedin-scraper
- **Neon Console**: https://console.neon.tech
- **Apify Console**: https://console.apify.com
- **OpenAI Platform**: https://platform.openai.com

---

## 🎊 Summary

### What We Built

A **complete, production-ready LinkedIn analytics ecosystem** with:

1. **Data Collection** (CLI)
   - Multi-profile scraping
   - Automated workflows
   - Cost controls
   - Advanced exports

2. **Visualization** (Dashboard)
   - Real-time analytics
   - Profile comparison
   - Interactive charts
   - Profile management

3. **Intelligence** (AI Assistant)
   - Natural language queries
   - 8 specialized functions
   - GPT-4 powered insights
   - Conversational interface

### System Capabilities

- Track **unlimited profiles** (yours + competitors)
- Scrape **thousands of posts** with cost controls
- Export data in **3 formats** (JSON, CSV, Excel)
- Visualize **engagement trends** with interactive charts
- Ask **AI questions** about your LinkedIn performance
- Get **competitive insights** and recommendations
- Manage profiles via **CLI or web UI**

### Architecture Highlights

- **Cloud Database**: Neon PostgreSQL (serverless, auto-scaling)
- **Dual Interface**: CLI for power users, Web for visualization
- **AI Integration**: GPT-4 function calling with direct database access
- **Production Ready**: Deployed, tested, documented
- **Cost Effective**: $3-23/month operational costs

### Key Achievements

- ✅ 100% feature complete
- ✅ Zero data loss migrations
- ✅ Backwards compatible
- ✅ Comprehensive documentation
- ✅ Production deployment
- ✅ AI-powered intelligence

---

**Version**: 2.0.0 (Multi-Profile) + 0.2.0 (AI Assistant)
**Last Updated**: October 16, 2025
**Status**: ✅ **PRODUCTION READY**

**Enjoy your LinkedIn analytics ecosystem!** 🚀
