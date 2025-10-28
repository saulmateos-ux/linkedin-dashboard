# Database Access for Analysts

## Connection String (Read-Only Access)

```
postgresql://claude_analyst:analyst_readonly_2025%21secure@ep-wild-flower-adh2ui1j-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Important:** The password contains a `!` character which is URL-encoded as `%21` in the connection string. This is required for proper authentication.

**Credentials:**
- **Username:** `claude_analyst`
- **Password:** `analyst_readonly_2025!secure` (shown as `%21` in URL)
- **Database:** `neondb`
- **Host:** `ep-wild-flower-adh2ui1j-pooler.c-2.us-east-1.aws.neon.tech`

## Access Level

- ✅ **Read access** to all tables (SELECT queries)
- ✅ **View sequences** (for understanding ID columns)
- ❌ **No write access** (INSERT, UPDATE, DELETE blocked)
- ❌ **No schema changes** (CREATE, ALTER, DROP blocked)

## Database Statistics

As of setup:
- **1,184 posts** across 12 profiles
- **12 profiles** (personal + team + competitors + companies)
- **4 workspaces** for organization

## Database Schema

### Core Tables

#### 1. `profiles` - Tracked LinkedIn profiles

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| username | VARCHAR(255) | LinkedIn username |
| profile_url | TEXT | Full LinkedIn URL |
| display_name | VARCHAR(255) | Display name |
| profile_type | VARCHAR(50) | own, team, competitor, inspiration, partner, other |
| is_company | BOOLEAN | True if company page |
| created_at | TIMESTAMP | When profile was added |

**Example query:**
```sql
SELECT id, display_name, profile_type, is_company
FROM profiles
ORDER BY display_name;
```

#### 2. `posts` - LinkedIn posts with engagement metrics

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (LinkedIn post ID) |
| profile_id | INTEGER | Foreign key to profiles |
| author_name | VARCHAR(255) | Post author name |
| content | TEXT | Post content |
| published_at | TIMESTAMP | When post was published |
| num_likes | INTEGER | Like count |
| num_comments | INTEGER | Comment count |
| num_reposts | INTEGER | Repost count |
| post_url | TEXT | LinkedIn post URL |
| created_at | TIMESTAMP | When scraped |

**Example query:**
```sql
SELECT author_name, content, num_likes, num_comments, published_at
FROM posts
ORDER BY num_likes DESC
LIMIT 10;
```

#### 3. `workspaces` - Profile groupings

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(255) | Workspace name (unique) |
| description | TEXT | Description |
| color | VARCHAR(7) | Hex color for UI |
| created_at | TIMESTAMP | Creation time |

**Example query:**
```sql
SELECT w.name, w.description, COUNT(wp.profile_id) as profile_count
FROM workspaces w
LEFT JOIN workspace_profiles wp ON w.id = wp.workspace_id
GROUP BY w.id, w.name, w.description
ORDER BY profile_count DESC;
```

#### 4. `workspace_profiles` - Many-to-many join table

| Column | Type | Description |
|--------|------|-------------|
| workspace_id | INTEGER | Foreign key to workspaces |
| profile_id | INTEGER | Foreign key to profiles |

**Example query:**
```sql
-- Get all profiles in a workspace
SELECT p.display_name, p.profile_type
FROM profiles p
JOIN workspace_profiles wp ON p.id = wp.profile_id
WHERE wp.workspace_id = 1;
```

#### 5. `scraping_runs` - Scraping history

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| profile_id | INTEGER | Foreign key to profiles |
| status | VARCHAR(50) | succeeded, failed, running |
| posts_count | INTEGER | Number of posts scraped |
| started_at | TIMESTAMP | Start time |
| completed_at | TIMESTAMP | Completion time |

## Common Analysis Queries

### 1. Top Performing Posts (All Time)

```sql
SELECT
  p.author_name,
  LEFT(p.content, 100) as content_preview,
  p.num_likes,
  p.num_comments,
  p.num_reposts,
  p.published_at
FROM posts p
ORDER BY p.num_likes DESC
LIMIT 20;
```

### 2. Engagement by Profile

```sql
SELECT
  pr.display_name,
  COUNT(*) as total_posts,
  SUM(p.num_likes) as total_likes,
  SUM(p.num_comments) as total_comments,
  AVG(p.num_likes) as avg_likes,
  AVG(p.num_comments) as avg_comments
FROM posts p
JOIN profiles pr ON p.profile_id = pr.id
GROUP BY pr.id, pr.display_name
ORDER BY total_likes DESC;
```

### 3. Trending Hashtags (Last 30 Days)

```sql
SELECT
  hashtag,
  COUNT(*) as usage_count,
  AVG(num_likes) as avg_likes
FROM (
  SELECT
    UNNEST(REGEXP_MATCHES(content, '#(\w+)', 'g')) as hashtag,
    num_likes
  FROM posts
  WHERE published_at >= NOW() - INTERVAL '30 days'
) hashtag_data
GROUP BY hashtag
ORDER BY usage_count DESC
LIMIT 20;
```

### 4. Posting Patterns by Day of Week

```sql
SELECT
  TO_CHAR(published_at, 'Day') as day_of_week,
  COUNT(*) as post_count,
  AVG(num_likes) as avg_likes,
  AVG(num_comments) as avg_comments
FROM posts
GROUP BY TO_CHAR(published_at, 'Day'), EXTRACT(DOW FROM published_at)
ORDER BY EXTRACT(DOW FROM published_at);
```

### 5. Workspace Performance Comparison

```sql
SELECT
  w.name as workspace,
  COUNT(DISTINCT p.profile_id) as profiles,
  COUNT(p.id) as total_posts,
  AVG(p.num_likes) as avg_likes,
  MAX(p.num_likes) as max_likes
FROM workspaces w
JOIN workspace_profiles wp ON w.id = wp.workspace_id
JOIN posts p ON p.profile_id = wp.profile_id
GROUP BY w.id, w.name
ORDER BY avg_likes DESC;
```

### 6. Team vs Competitor Engagement

```sql
SELECT
  pr.profile_type,
  COUNT(*) as post_count,
  AVG(p.num_likes) as avg_likes,
  AVG(p.num_comments) as avg_comments,
  AVG(p.num_reposts) as avg_reposts
FROM posts p
JOIN profiles pr ON p.profile_id = pr.id
WHERE pr.profile_type IN ('team', 'competitor')
GROUP BY pr.profile_type;
```

### 7. Content Length vs Engagement

```sql
SELECT
  CASE
    WHEN LENGTH(content) < 500 THEN 'Short (< 500)'
    WHEN LENGTH(content) < 1000 THEN 'Medium (500-1000)'
    ELSE 'Long (> 1000)'
  END as content_length,
  COUNT(*) as post_count,
  AVG(num_likes) as avg_likes,
  AVG(num_comments) as avg_comments
FROM posts
GROUP BY
  CASE
    WHEN LENGTH(content) < 500 THEN 'Short (< 500)'
    WHEN LENGTH(content) < 1000 THEN 'Medium (500-1000)'
    ELSE 'Long (> 1000)'
  END
ORDER BY avg_likes DESC;
```

### 8. Recent Activity (Last 7 Days)

```sql
SELECT
  pr.display_name,
  COUNT(*) as posts_this_week,
  SUM(p.num_likes) as likes_this_week,
  AVG(p.num_likes) as avg_likes_this_week
FROM posts p
JOIN profiles pr ON p.profile_id = pr.id
WHERE p.published_at >= NOW() - INTERVAL '7 days'
GROUP BY pr.id, pr.display_name
ORDER BY posts_this_week DESC;
```

## Using with Claude Code

### Method 1: Direct psql Commands

In Claude Code, you can run queries using Bash tool:

```bash
psql "postgresql://claude_analyst:analyst_readonly_2025%21secure@ep-wild-flower-adh2ui1j-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT COUNT(*) FROM posts;"
```

### Method 2: Save Connection String

Create an environment variable:

```bash
export LINKEDIN_DB="postgresql://claude_analyst:analyst_readonly_2025%21secure@ep-wild-flower-adh2ui1j-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Then use:
psql $LINKEDIN_DB -c "YOUR QUERY HERE"
```

### Method 3: Interactive Session

Start an interactive psql session:

```bash
psql "postgresql://claude_analyst:analyst_readonly_2025%21secure@ep-wild-flower-adh2ui1j-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

Then run queries interactively:
```sql
\dt              -- List all tables
\d posts         -- Describe posts table structure
SELECT COUNT(*) FROM posts;
```

## Security Notes

1. **Read-Only Access**: This user can only SELECT data. All write operations are blocked.
2. **Connection Security**: Connection uses SSL/TLS encryption (sslmode=require).
3. **No Schema Modifications**: Cannot create, alter, or drop tables.
4. **Production Data**: This connects to the live production database. Handle with care.
5. **Password Sharing**: Share this connection string only with trusted analysts.

## Support

For questions or access issues:
- Check connection string for typos
- Verify network allows outbound PostgreSQL connections (port 5432)
- Ensure SSL/TLS is supported by your client

## Example Analysis Session

```bash
# Connect to database
psql "postgresql://claude_analyst:analyst_readonly_2025%21secure@ep-wild-flower-adh2ui1j-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Explore schema
\dt

# Check data size
SELECT COUNT(*) FROM posts;
SELECT COUNT(*) FROM profiles;

# Analyze top posts
SELECT author_name, LEFT(content, 50) as snippet, num_likes
FROM posts
ORDER BY num_likes DESC
LIMIT 10;

# Analyze hashtag performance
SELECT
  UNNEST(REGEXP_MATCHES(content, '#(\w+)', 'g')) as hashtag,
  AVG(num_likes) as avg_likes,
  COUNT(*) as usage
FROM posts
GROUP BY hashtag
HAVING COUNT(*) > 5
ORDER BY avg_likes DESC
LIMIT 10;

# Exit
\q
```

## Version

- **Created:** October 25, 2025
- **Database:** Neon PostgreSQL (production)
- **Access Level:** Read-Only (SELECT only)
- **Initial Data:** 1,184 posts, 12 profiles, 4 workspaces
