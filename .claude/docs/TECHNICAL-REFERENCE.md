# LinkedIn Analytics Dashboard - Technical Reference

Complete technical specifications for developers implementing features, debugging, and maintaining the system.

**Version**: 0.4.0 (Workspace Batch Scraping + Team Profiles)
**Last Updated**: October 17, 2025

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [API Endpoints](#api-endpoints)
3. [TypeScript Interfaces](#typescript-interfaces)
4. [Database Functions](#database-functions)
5. [AI Functions](#ai-functions)
6. [Component Props](#component-props)
7. [Environment Variables](#environment-variables)
8. [File Locations](#file-locations)
9. [SQL Queries](#sql-queries)
10. [Error Handling](#error-handling)

---

## Database Schema

### posts table

```sql
CREATE TABLE posts (
  -- Primary key
  id TEXT PRIMARY KEY,                    -- LinkedIn activity ID extracted from URL

  -- Foreign keys
  profile_id INTEGER REFERENCES profiles(id),

  -- URLs
  post_url TEXT UNIQUE NOT NULL,

  -- Content
  content TEXT,                           -- Full post text
  content_preview TEXT,                   -- First 100 characters

  -- Author information
  author_name TEXT NOT NULL,              -- Full name (e.g., "Saul Mateos")
  author_username TEXT,                   -- LinkedIn username

  -- Dates
  published_at TIMESTAMPTZ,               -- When post was published on LinkedIn
  scraped_at TIMESTAMPTZ,                 -- When we scraped this post
  created_at TIMESTAMPTZ DEFAULT NOW(),   -- When record was created
  updated_at TIMESTAMPTZ DEFAULT NOW(),   -- When record was last updated

  -- Media
  media_type TEXT,                        -- 'text', 'image', 'video', 'carousel'

  -- Engagement metrics
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  engagement_total INTEGER DEFAULT 0,     -- likes + comments + shares
  engagement_rate REAL DEFAULT 0,         -- (engagement_total / views) * 100

  -- Metadata (JSONB)
  hashtags JSONB,                         -- Array of hashtag strings
  mentions JSONB,                         -- Array of mentioned usernames
  reactions JSONB                         -- Object with reaction types and counts
);

-- Indexes
CREATE INDEX idx_posts_profile_id ON posts(profile_id);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_engagement_total ON posts(engagement_total DESC);
CREATE INDEX idx_posts_author_username ON posts(author_username);
CREATE INDEX idx_posts_author_name ON posts(author_name);
CREATE INDEX idx_posts_scraped_at ON posts(scraped_at DESC);
```

### profiles table

```sql
CREATE TABLE profiles (
  -- Primary key
  id SERIAL PRIMARY KEY,

  -- Identity
  username VARCHAR(255) UNIQUE NOT NULL,  -- LinkedIn username (from URL)
  profile_url TEXT UNIQUE NOT NULL,       -- Full LinkedIn profile URL
  display_name VARCHAR(255) NOT NULL,     -- Display name

  -- Profile data
  headline TEXT,                          -- LinkedIn headline
  follower_count INTEGER,                 -- Number of followers
  industry VARCHAR(100),                  -- Industry

  -- Classification
  is_primary BOOLEAN DEFAULT FALSE,       -- Is this the primary profile?
  is_company BOOLEAN DEFAULT FALSE,       -- Is this a company page? (NEW v0.3.0)
  profile_type VARCHAR(50) DEFAULT 'team', -- 'own', 'competitor', 'inspiration', 'partner', 'team', 'other' (NEW: 'team' v0.4.0)

  -- Notes
  notes TEXT,                             -- Free-form notes

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one primary profile
CREATE UNIQUE INDEX idx_one_primary_profile
  ON profiles(is_primary) WHERE is_primary = true;

-- Indexes
CREATE INDEX idx_profiles_type ON profiles(profile_type);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_is_primary ON profiles(is_primary);
```

### scraping_runs table

```sql
CREATE TABLE scraping_runs (
  -- Primary key
  id SERIAL PRIMARY KEY,

  -- Foreign key
  profile_id INTEGER REFERENCES profiles(id),

  -- Apify details
  run_id TEXT,                            -- Apify run ID
  actor_id TEXT,                          -- Apify actor ID

  -- Status
  status VARCHAR(50),                     -- 'running', 'succeeded', 'failed'

  -- Timing
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,

  -- Results
  posts_scraped INTEGER,                  -- Total posts fetched
  new_posts INTEGER,                      -- New posts inserted
  updated_posts INTEGER,                  -- Existing posts updated

  -- Cost
  cost_usd DECIMAL(10, 4),                -- Cost in USD

  -- Errors
  error_message TEXT
);

-- Indexes
CREATE INDEX idx_scraping_runs_profile_id ON scraping_runs(profile_id);
CREATE INDEX idx_scraping_runs_started_at ON scraping_runs(started_at DESC);
CREATE INDEX idx_scraping_runs_status ON scraping_runs(status);
```

---

## API Endpoints

### POST /api/ai-query

Query the AI Assistant with natural language questions.

**Route**: `app/api/ai-query/route.ts`

**Request**:
```typescript
{
  question: string;              // User's question
  conversationHistory?: Array<{  // Previous messages (optional)
    role: 'user' | 'assistant';
    content: string;
  }>;
}
```

**Response** (Success - 200):
```typescript
{
  answer: string;                // AI's response
  data: unknown | unknown[];     // Function call results
  functionsCalled: string[];     // Names of functions called
}
```

**Response** (Error - 400):
```typescript
{
  error: string;                 // "Question is required"
}
```

**Response** (Error - 500):
```typescript
{
  error: string;                 // Error message
  details?: string;              // Detailed error info
}
```

**Implementation Details**:
- Uses OpenAI GPT-4 Turbo (`gpt-4-turbo-preview`)
- Two API calls: first for function selection, second for final answer
- Supports 8 specialized functions
- Max duration: 60 seconds
- Dynamic route (no caching)

---

### POST /api/profiles

Add a new LinkedIn profile to track.

**Route**: `app/api/profiles/route.ts`

**Request**:
```typescript
{
  profileUrl: string;            // Full LinkedIn URL (personal or company)
  displayName: string;           // Display name
  profileType: string;           // 'own' | 'competitor' | 'inspiration' | 'partner' | 'team' | 'other'
  notes?: string;                // Optional notes
  workspaceId?: number;          // Optional workspace to add profile to (NEW v0.4.0)
}
```

**Response** (Success - 200):
```typescript
{
  success: true;
  profile: {
    id: number;
    username: string;
    profileUrl: string;
    displayName: string;
    profileType: string;
    notes?: string;
    isPrimary: boolean;
    createdAt: string;
  }
}
```

**Response** (Error - 400):
```typescript
{
  error: string;                 // Validation error message
}
```

**Response** (Error - 409):
```typescript
{
  error: string;                 // "Profile already exists"
}
```

**Response** (Error - 500):
```typescript
{
  error: string;                 // Database error
}
```

**Validation Rules**:
- `profileUrl` must contain `linkedin.com/in/` (personal) or `linkedin.com/company/` (company)
- `displayName` is required (non-empty string)
- `profileType` must be one of: own, competitor, inspiration, partner, team, other (default: team)
- Username is extracted from URL automatically
- Duplicate usernames are rejected (409)
- If `workspaceId` provided, profile is automatically added to that workspace after creation

---

### POST /api/scrape

Trigger LinkedIn post scraping from browser. Supports both single profile and workspace batch scraping.

**Route**: `app/api/scrape/route.ts`

**Request** (Single Profile):
```typescript
{
  profileId?: number;            // Profile to scrape (default: primary)
  maxPosts?: number;             // Max posts to fetch (default: 100)
}
```

**Request** (Workspace Batch - NEW v0.4.0):
```typescript
{
  workspaceId: number;           // Workspace ID to scrape all profiles from
  maxPosts?: number;             // Max posts to fetch per profile (default: 100)
}
```

**Response** (Success - 200):
```typescript
{
  success: true;
  message: string;               // "Scrape complete! X new posts, Y updated"
  postsFound: number;            // Total posts found by scraper
  newPosts: number;              // New posts inserted
  updatedPosts: number;          // Existing posts updated
  runId: string;                 // Apify run ID
}
```

**Response** (Error - 404):
```typescript
{
  error: string;                 // "Profile not found"
}
```

**Response** (Error - 500):
```typescript
{
  error: string;                 // "Scrape failed"
  message: string;               // Detailed error message
}
```

**Implementation Details**:
- Uses Apify actor: `harvestapi/linkedin-profile-posts`
- Max duration: 300 seconds (5 minutes)
- Automatically links posts to profile via `profile_id`
- Upserts posts (INSERT ... ON CONFLICT UPDATE)
- Handles author name extraction from nested objects
- Dynamic route (no caching)

**Workspace Batch Scraping** (NEW v0.4.0):
- When `workspaceId` provided, fetches all profiles in workspace
- Builds `targetUrls` array with all profile URLs
- Makes single Apify call with array parameter
- Apify scrapes up to 6 profiles in parallel
- Maps posts to correct `profile_id` using `authorProfileUrl` field
- Benefits: 6x faster, single API call, same cost as sequential

---

### GET /api/export

Export posts to CSV.

**Route**: `app/api/export/route.ts`

**Query Parameters**:
```typescript
{
  search?: string;               // Search in content
  sortBy?: string;               // 'published_at' | 'likes' | 'comments' | 'shares' | 'engagement_total'
  order?: 'asc' | 'desc';        // Sort order (default: desc)
  profileId?: number;            // Filter by profile
}
```

**Response**: CSV file download

**CSV Headers**:
```
ID,Post URL,Content,Content Preview,Author Name,Author Username,Published At,
Likes,Comments,Shares,Views,Engagement Total,Engagement Rate,Hashtags,Media Type
```

**Implementation Details**:
- Uses `csv-writer` library
- Streams response directly to client
- Filename: `linkedin-posts-{timestamp}.csv`
- Content-Type: `text/csv`
- Content-Disposition: `attachment`

---

## TypeScript Interfaces

### Post Interface

```typescript
interface Post {
  id: string;
  profile_id: number | null;
  post_url: string;
  content: string | null;
  content_preview: string | null;
  author_name: string;
  author_username: string | null;
  published_at: Date | null;
  scraped_at: Date | null;
  created_at: Date;
  updated_at: Date;
  media_type: string | null;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  engagement_total: number;
  engagement_rate: number;
  hashtags: string[] | null;
  mentions: string[] | null;
  reactions: Record<string, number> | null;
}
```

### Profile Interface

```typescript
interface Profile {
  id: number;
  username: string;
  profile_url: string;
  display_name: string;
  headline: string | null;
  follower_count: number | null;
  is_primary: boolean;
  is_company: boolean;                                                     // NEW v0.3.0
  profile_type: 'own' | 'competitor' | 'inspiration' | 'partner' | 'team' | 'other';  // 'team' NEW v0.4.0
  industry: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}
```

### Stats Interface

```typescript
interface Stats {
  total_posts: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_views: number;
  avg_likes: number;
  avg_comments: number;
  avg_shares: number;
  avg_engagement_rate: number;
}
```

### AI Function Interfaces

```typescript
interface TrendingHashtag {
  hashtag: string;
  post_count: number;
  total_engagement: number;
  avg_engagement: number;
}

interface CompetitiveIntel {
  profile_id: number;
  display_name: string;
  username: string;
  profile_type: string;
  post_count: number;
  avg_likes: number;
  avg_comments: number;
  avg_shares: number;
  avg_engagement_rate: number;
  top_hashtags: string[];
}

interface TopicPerformance {
  hashtag: string;
  post_count: number;
  avg_likes: number;
  avg_comments: number;
  avg_shares: number;
  total_engagement: number;
}

interface PostingPattern {
  day_of_week: number;        // 0 = Sunday, 6 = Saturday
  hour: number;                // 0-23
  post_count: number;
  avg_engagement: number;
}

interface RecentActivity {
  date: string;                // YYYY-MM-DD
  post_count: number;
  total_engagement: number;
}
```

---

## Database Functions

All functions located in: `lib/db.ts`

### Profile Functions

#### getProfiles()
```typescript
async function getProfiles(): Promise<Profile[]>
```
Returns all profiles ordered by: primary first, then by creation date.

#### getProfile(id: number)
```typescript
async function getProfile(id: number): Promise<Profile | null>
```
Returns a specific profile by ID.

#### getPrimaryProfile()
```typescript
async function getPrimaryProfile(): Promise<Profile | null>
```
Returns the primary profile (where `is_primary = true`).

#### getProfilesByType(type: string)
```typescript
async function getProfilesByType(type: string): Promise<Profile[]>
```
Returns all profiles of a specific type (e.g., "competitor").

#### addProfile(data: object)
```typescript
async function addProfile(data: {
  username: string;
  profile_url: string;
  display_name: string;
  profile_type: string;
  notes?: string;
}): Promise<Profile>
```
Inserts a new profile. Returns the created profile.

**Throws**: Error if username already exists or validation fails.

#### updateProfile(id: number, updates: Partial<Profile>)
```typescript
async function updateProfile(
  id: number,
  updates: Partial<Profile>
): Promise<Profile>
```
Updates profile fields. Returns updated profile.

#### setPrimaryProfile(id: number)
```typescript
async function setPrimaryProfile(id: number): Promise<void>
```
Sets a profile as primary. Automatically un-sets previous primary.

#### deleteProfile(id: number)
```typescript
async function deleteProfile(id: number): Promise<void>
```
Deletes a profile. Posts with this profile_id will have `profile_id` set to NULL.

---

### Post Query Functions

#### getStats(profileId?: number | null)
```typescript
async function getStats(profileId?: number | null): Promise<Stats>
```
Returns aggregate statistics. If `profileId` is provided, filters by that profile.

**SQL Query**:
```sql
SELECT
  COUNT(*) as total_posts,
  COALESCE(SUM(likes), 0) as total_likes,
  COALESCE(SUM(comments), 0) as total_comments,
  COALESCE(SUM(shares), 0) as total_shares,
  COALESCE(SUM(views), 0) as total_views,
  COALESCE(AVG(likes), 0) as avg_likes,
  COALESCE(AVG(comments), 0) as avg_comments,
  COALESCE(AVG(shares), 0) as avg_shares,
  COALESCE(AVG(engagement_rate), 0) as avg_engagement_rate
FROM posts
WHERE ($1::INTEGER IS NULL OR profile_id = $1)
```

#### getTopPosts(limit: number, profileId?: number | null)
```typescript
async function getTopPosts(
  limit: number,
  profileId?: number | null
): Promise<Post[]>
```
Returns top posts ordered by engagement_total DESC.

#### getEngagementOverTime(days: number, profileId?: number | null)
```typescript
async function getEngagementOverTime(
  days: number,
  profileId?: number | null
): Promise<Array<{ date: string; engagement: number }>>
```
Returns daily engagement totals for last N days.

**SQL Query**:
```sql
SELECT
  DATE(published_at) as date,
  SUM(engagement_total) as engagement
FROM posts
WHERE published_at >= NOW() - INTERVAL '$1 days'
  AND ($2::INTEGER IS NULL OR profile_id = $2)
GROUP BY DATE(published_at)
ORDER BY date DESC
```

#### getPosts(options)
```typescript
async function getPosts(options: {
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  profileId?: number;
}): Promise<Post[]>
```
Flexible post query with filtering, sorting, and pagination.

---

## AI Functions

All AI functions located in: `lib/db.ts`

### getTrendingHashtags(limit: number = 20)

```typescript
async function getTrendingHashtags(limit: number = 20): Promise<TrendingHashtag[]>
```

**SQL**:
```sql
SELECT
  hashtag,
  COUNT(*) as post_count,
  SUM(p.engagement_total) as total_engagement,
  ROUND(AVG(p.engagement_total), 2) as avg_engagement
FROM posts p,
     jsonb_array_elements_text(p.hashtags) as hashtag
WHERE p.published_at >= NOW() - INTERVAL '30 days'
GROUP BY hashtag
ORDER BY total_engagement DESC
LIMIT $1
```

**Returns**: Array of trending hashtags with engagement metrics.

---

### getCompetitiveIntel()

```typescript
async function getCompetitiveIntel(): Promise<CompetitiveIntel[]>
```

**SQL**:
```sql
SELECT
  prof.id as profile_id,
  prof.display_name,
  prof.username,
  prof.profile_type,
  COUNT(p.id) as post_count,
  ROUND(AVG(p.likes), 2) as avg_likes,
  ROUND(AVG(p.comments), 2) as avg_comments,
  ROUND(AVG(p.shares), 2) as avg_shares,
  ROUND(AVG(p.engagement_rate), 2) as avg_engagement_rate,
  -- Top 5 hashtags subquery
FROM profiles prof
LEFT JOIN posts p ON p.profile_id = prof.id
GROUP BY prof.id
ORDER BY post_count DESC
```

**Returns**: Comparison metrics for all profiles.

---

### getTopicPerformance(limit: number = 50)

```typescript
async function getTopicPerformance(limit: number = 50): Promise<TopicPerformance[]>
```

**SQL**:
```sql
SELECT
  hashtag,
  COUNT(*) as post_count,
  ROUND(AVG(p.likes), 2) as avg_likes,
  ROUND(AVG(p.comments), 2) as avg_comments,
  ROUND(AVG(p.shares), 2) as avg_shares,
  SUM(p.engagement_total) as total_engagement
FROM posts p,
     jsonb_array_elements_text(p.hashtags) as hashtag
GROUP BY hashtag
HAVING COUNT(*) >= 2
ORDER BY total_engagement DESC
LIMIT $1
```

**Returns**: Performance metrics per hashtag/topic.

---

### getPostingPatterns()

```typescript
async function getPostingPatterns(): Promise<PostingPattern[]>
```

**SQL**:
```sql
SELECT
  EXTRACT(DOW FROM published_at)::INTEGER as day_of_week,
  EXTRACT(HOUR FROM published_at)::INTEGER as hour,
  COUNT(*) as post_count,
  ROUND(AVG(engagement_total), 2) as avg_engagement
FROM posts
WHERE published_at IS NOT NULL
GROUP BY day_of_week, hour
ORDER BY avg_engagement DESC
```

**Returns**: Best days/times to post based on historical engagement.

---

### getRecentActivity()

```typescript
async function getRecentActivity(): Promise<RecentActivity[]>
```

**SQL**:
```sql
SELECT
  DATE(published_at) as date,
  COUNT(*) as post_count,
  SUM(engagement_total) as total_engagement
FROM posts
WHERE published_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(published_at)
ORDER BY date DESC
```

**Returns**: Daily summary of last 7 days.

---

### query_database(sql: string)

```typescript
async function queryDatabase(sql: string): Promise<unknown[]>
```

**Security**: Only SELECT queries allowed. Validated with:
```typescript
const query = sql.trim().toUpperCase();
if (!query.startsWith('SELECT')) {
  throw new Error('Only SELECT queries are allowed');
}
```

**Returns**: Raw query results as array of objects.

---

## Component Props

### ProfileSelector

```typescript
interface ProfileSelectorProps {
  profiles: Profile[];
  currentProfileId: number | null;
}
```

**Location**: `components/ProfileSelector.tsx`
**Type**: Client Component

---

### AIChat

```typescript
// No props - self-contained
```

**Location**: `components/AIChat.tsx`
**Type**: Client Component
**Internal State**:
```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

---

### ProfileCard

```typescript
interface ProfileCardProps {
  profile: Profile;
  postCount: number;
}
```

**Location**: `components/ProfileCard.tsx`
**Type**: Server Component

---

### StatsCard

```typescript
interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: string;
}
```

**Location**: `components/StatsCard.tsx`
**Type**: Server Component

---

### EngagementChart

```typescript
interface EngagementChartProps {
  data: Array<{
    date: string;
    engagement: number;
  }>;
}
```

**Location**: `components/EngagementChart.tsx`
**Type**: Client Component

---

### PostsTable

```typescript
interface PostsTableProps {
  posts: Post[];
  title?: string;
}
```

**Location**: `components/PostsTable.tsx`
**Type**: Server Component

---

## Environment Variables

### Required Variables

```bash
# Database (Required)
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require
# Format: postgresql://[user]:[password]@[host]/[database]?sslmode=require
# Example: postgresql://myuser:mypass@ep-cool-name-123456.us-east-2.aws.neon.tech/mydb?sslmode=require

# Apify Scraping (Required)
APIFY_API_KEY=apify_api_...
# Get from: https://console.apify.com/account/integrations
# Format: apify_api_[40 character string]

# Primary Profile (Required)
LINKEDIN_PROFILE_URL=https://www.linkedin.com/in/yourname
# Your main LinkedIn profile URL

# OpenAI AI Assistant (Required for AI features)
OPENAI_API_KEY=sk-...
# Get from: https://platform.openai.com/api-keys
# Format: sk-[48 character string]
```

### Optional Variables

```bash
# Scraping Configuration
DEFAULT_MAX_POSTS=500
# Default number of posts to scrape if not specified

MAX_COST_PER_SCRAPE=5.00
# Maximum allowed cost per scrape operation (USD)

COST_WARNING_THRESHOLD=1.00
# Warn user if scrape will cost more than this (USD)

DEFAULT_ACTOR=harvestapi/linkedin-profile-posts
# Apify actor ID to use for scraping

# Logging
LOG_LEVEL=info
# Options: debug, info, warn, error
# Controls verbosity of console logs

LOG_TO_FILE=true
# Whether to write logs to file

# Export
EXPORT_DIR=./data/exports
# Directory for export files (CLI only)

EXPORT_DATE_FORMAT=ISO
# Date format in exports: ISO, US, EU
```

---

## File Locations

### Core Application Files

```
app/
├── page.tsx                           # Dashboard homepage (Server Component)
├── layout.tsx                         # Root layout with metadata
├── insights/page.tsx                  # AI Assistant page (Server Component)
├── profiles/page.tsx                  # Profile list page (Server Component)
├── profiles/[id]/page.tsx             # Profile detail (Dynamic Route)
├── posts/page.tsx                     # All posts page (Server Component)
└── api/
    ├── ai-query/route.ts              # AI query endpoint (POST)
    ├── profiles/route.ts              # Add profile endpoint (POST)
    ├── scrape/route.ts                # Scrape trigger (POST, GET)
    └── export/route.ts                # CSV export (GET)
```

### Components

```
components/
├── AIChat.tsx                         # AI chat interface (Client)
├── ProfileSelector.tsx                # Profile dropdown (Client)
├── ProfilesHeader.tsx                 # Header with add button (Client)
├── AddProfileModal.tsx                # Add profile modal with workspace selector (Client) - UPDATED v0.4.0
├── ProfileCard.tsx                    # Profile card with team badge (Server) - UPDATED v0.4.0
├── StatsCard.tsx                      # Stat display (Server)
├── EngagementChart.tsx                # Recharts chart (Client)
├── PostsTable.tsx                     # Posts table (Server)
├── RefreshButton.tsx                  # Scrape trigger (Client)
├── SearchBar.tsx                      # Search/filter (Client)
├── WorkspaceSwitcher.tsx              # Workspace dropdown (Client) - v0.3.0
├── WorkspaceAwareNav.tsx              # Navigation with workspace persistence (Client) - NEW v0.4.0
└── ScrapeWorkspaceButton.tsx          # Batch scrape workspace (Client) - NEW v0.4.0
```

### Database & Utilities

```
lib/
└── db.ts                              # Database connection + all functions
    ├── Connection pool setup
    ├── Profile CRUD functions (8 functions)
    ├── Post query functions (5 functions)
    └── AI intelligence functions (8 functions)
```

---

## SQL Queries

### Common Query Patterns

**Get posts with profile info**:
```sql
SELECT
  p.*,
  prof.display_name as profile_name,
  prof.username as profile_username
FROM posts p
LEFT JOIN profiles prof ON p.profile_id = prof.id
WHERE p.profile_id = $1
ORDER BY p.published_at DESC
LIMIT $2
```

**Count posts per profile**:
```sql
SELECT
  prof.id,
  prof.display_name,
  COUNT(p.id) as post_count
FROM profiles prof
LEFT JOIN posts p ON p.profile_id = prof.id
GROUP BY prof.id
ORDER BY post_count DESC
```

**Get top hashtags**:
```sql
SELECT
  hashtag,
  COUNT(*) as frequency,
  SUM(p.engagement_total) as total_engagement
FROM posts p,
     jsonb_array_elements_text(p.hashtags) as hashtag
GROUP BY hashtag
ORDER BY total_engagement DESC
LIMIT 20
```

**Engagement over time**:
```sql
SELECT
  DATE(published_at) as date,
  COUNT(*) as post_count,
  SUM(likes) as total_likes,
  SUM(comments) as total_comments,
  SUM(shares) as total_shares,
  SUM(engagement_total) as total_engagement,
  AVG(engagement_rate) as avg_rate
FROM posts
WHERE published_at >= $1
GROUP BY DATE(published_at)
ORDER BY date DESC
```

---

## Error Handling

### API Error Responses

All API endpoints return consistent error format:

```typescript
{
  error: string;        // Human-readable error message
  details?: string;     // Optional detailed error info
}
```

**HTTP Status Codes**:
- `400`: Bad Request (validation error)
- `404`: Not Found (resource doesn't exist)
- `409`: Conflict (duplicate resource)
- `500`: Internal Server Error (database/server error)

### Database Error Handling

**Connection Errors**:
```typescript
try {
  const result = await pool.query(sql, params);
  return result.rows;
} catch (error) {
  console.error('Database query failed:', error);
  throw new Error('Database operation failed');
}
```

**Unique Constraint Violations**:
```typescript
// PostgreSQL error code for unique violation: '23505'
if (error.code === '23505') {
  throw new Error('Record already exists');
}
```

**Foreign Key Violations**:
```typescript
// PostgreSQL error code: '23503'
if (error.code === '23503') {
  throw new Error('Referenced record not found');
}
```

### AI Query Error Handling

**Invalid Questions**:
```typescript
if (!question || typeof question !== 'string') {
  return NextResponse.json(
    { error: 'Question is required' },
    { status: 400 }
  );
}
```

**OpenAI API Errors**:
```typescript
try {
  const response = await openai.chat.completions.create({...});
} catch (error) {
  if (error.message.includes('API key')) {
    return NextResponse.json(
      { error: 'OpenAI API key is invalid or missing' },
      { status: 500 }
    );
  }
  // Handle other errors
}
```

**Function Execution Errors**:
```typescript
// Each function call is wrapped in try-catch
try {
  functionResult = await getTrendingHashtags(limit);
} catch (error) {
  functionResult = {
    error: error instanceof Error ? error.message : 'Unknown error'
  };
}
```

---

## Performance Considerations

### Database Performance

**Connection Pooling**:
```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                    // Max 10 connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
});
```

**Query Optimization**:
- All foreign keys have indexes
- Frequently queried columns have indexes
- Use `EXPLAIN ANALYZE` to verify query performance
- Use `LIMIT` on all large queries

**JSONB Performance**:
```sql
-- Extract hashtags efficiently
jsonb_array_elements_text(hashtags)

-- GIN index for JSONB (if needed)
CREATE INDEX idx_posts_hashtags_gin ON posts USING gin (hashtags);
```

### Next.js Performance

**Caching Strategy**:
```typescript
// Page-level caching (1 hour)
export const revalidate = 3600;

// API route caching
export const dynamic = 'force-dynamic';  // No caching for real-time data
```

**Server Components**:
- Dashboard pages are Server Components (faster initial load)
- Interactive components are Client Components (marked with 'use client')

---

## Security

### SQL Injection Prevention

**Always use parameterized queries**:
```typescript
// ✅ SAFE
const result = await pool.query(
  'SELECT * FROM posts WHERE id = $1',
  [postId]
);

// ❌ UNSAFE
const result = await pool.query(
  `SELECT * FROM posts WHERE id = '${postId}'`
);
```

### API Security

**Rate Limiting**: Not implemented (add if deploying publicly)

**Authentication**: Not implemented (add if deploying publicly)

**Input Validation**:
- All user inputs are validated
- Profile URLs must contain `linkedin.com/in/`
- SQL queries limited to SELECT only
- TypeScript provides type safety

---

**Last Updated**: October 16, 2025
**Version**: 0.2.0
