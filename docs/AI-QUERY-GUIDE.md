# LinkedIn Dashboard - AI Query Guide

**Version**: 1.0
**Last Updated**: October 2025
**Status**: Ready for AI tool integration

This guide enables AI tools (Claude, ChatGPT, custom assistants, etc.) to directly query your LinkedIn post data via the Neon Data API. No context window limits, no manual data copying - just HTTP requests to a PostgreSQL-backed REST API.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Base URL & Endpoints](#base-url--endpoints)
4. [Query Syntax](#query-syntax)
5. [Common Queries](#common-queries)
6. [Semantic Search](#semantic-search)
7. [Intelligence Views](#intelligence-views)
8. [Integration Examples](#integration-examples)
9. [Sample AI Conversations](#sample-ai-conversations)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

**What you need:**
1. Neon Data API URL (from Neon console)
2. JWT authentication token (generated in Neon console)
3. OpenAI API key (for semantic search)

**Basic query example:**

```bash
curl "https://your-project.data.neon.tech/posts?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
[
  {
    "id": "7253594866513752064",
    "post_url": "https://linkedin.com/feed/update/urn:li:activity:7253594866513752064",
    "content": "Just shipped a new feature...",
    "author_name": "Saul Mateos",
    "published_at": "2025-10-15T14:30:00Z",
    "likes": 42,
    "comments": 8,
    "shares": 3,
    "engagement_total": 53,
    "hashtags": ["#productlaunch", "#startup"]
  }
]
```

---

## Authentication

### Generating a JWT Token

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Navigate to **Settings** → **Data API**
4. Click **Generate JWT Token**
5. Copy the token (it will only be shown once!)

### Using the Token

Include the token in every request header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** JWT tokens expire after 7 days by default. Regenerate when expired.

---

## Base URL & Endpoints

### Base URL Format

```
https://<project-name>.data.neon.tech
```

### Available Endpoints

| Endpoint | Description | Type |
|----------|-------------|------|
| `/posts` | All LinkedIn posts | Table |
| `/profiles` | Profile information | Table |
| `/top_performers` | Best performing posts | View |
| `/trending_hashtags` | Popular hashtags (last 30 days) | Materialized View |
| `/competitive_intel` | Profile comparison metrics | View |
| `/topic_performance` | Engagement by hashtag | View |
| `/posting_patterns` | Best days/times to post | View |
| `/recent_activity` | Last 7 days summary | View |

---

## Query Syntax

Neon Data API uses **PostgREST** syntax. Here are the key operators:

### Filtering

```bash
# Equals
?likes=eq.100

# Greater than
?likes=gt.50

# Less than
?published_at=lt.2025-10-01

# Like (pattern matching)
?content=like.*AI*

# In (multiple values)
?profile_id=in.(1,2,3)

# Is null
?embedding=is.null

# Not null
?embedding=not.is.null

# Combined filters (AND)
?likes=gte.50&comments=gte.10
```

### Sorting

```bash
# Ascending
?order=published_at.asc

# Descending
?order=likes.desc

# Multiple columns
?order=engagement_total.desc,published_at.desc
```

### Limiting & Pagination

```bash
# Limit results
?limit=10

# Offset (for pagination)
?offset=20&limit=10

# Range (alternative pagination)
-H "Range: 0-9"  # First 10 rows
```

### Selecting Columns

```bash
# Specific columns
?select=id,content,likes,comments

# All columns (default)
?select=*

# Nested/joined data
?select=*,profiles(display_name,profile_type)
```

### Aggregation

```bash
# Count
?select=count()

# Sum
?select=sum(likes),sum(comments)

# Average
?select=avg(engagement_rate)

# Group by (requires select columns)
?select=author_name,count()&group=author_name
```

---

## Common Queries

### 1. Get Latest Posts

```bash
curl "https://your-project.data.neon.tech/posts?order=published_at.desc&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Top Posts by Engagement

```bash
curl "https://your-project.data.neon.tech/posts?order=engagement_total.desc&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Search by Content

```bash
curl "https://your-project.data.neon.tech/posts?content=ilike.*AI*&order=likes.desc" \
  -H "Authorization: Bearer $TOKEN"
```

Note: `ilike` is case-insensitive pattern matching.

### 4. Filter by Date Range

```bash
# Posts from last 30 days
curl "https://your-project.data.neon.tech/posts?published_at=gte.2025-09-15&order=published_at.desc" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Filter by Hashtag

```bash
# Posts containing #AI
curl "https://your-project.data.neon.tech/posts?hashtags=cs.{\"#AI\"}&order=engagement_total.desc" \
  -H "Authorization: Bearer $TOKEN"
```

Note: `cs` means "contains" for JSON array fields.

### 6. Get Posts by Specific Profile

```bash
curl "https://your-project.data.neon.tech/posts?profile_id=eq.1&order=published_at.desc&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

### 7. High-Performing Posts (> 100 likes)

```bash
curl "https://your-project.data.neon.tech/posts?likes=gt.100&order=likes.desc" \
  -H "Authorization: Bearer $TOKEN"
```

### 8. Posts with Media

```bash
curl "https://your-project.data.neon.tech/posts?media_type=neq.text&order=engagement_total.desc" \
  -H "Authorization: Bearer $TOKEN"
```

### 9. Count Posts by Author

```bash
curl "https://your-project.data.neon.tech/posts?select=author_name,count()&group=author_name" \
  -H "Authorization: Bearer $TOKEN"
```

### 10. Get Full Post Details

```bash
curl "https://your-project.data.neon.tech/posts?id=eq.7253594866513752064&select=*" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Semantic Search

Semantic search finds posts by **meaning**, not just keywords. For example, querying "productivity tips" will also find posts about "time management" or "efficiency hacks".

### How It Works

1. Generate an embedding for your search query using OpenAI
2. Query posts ordered by vector similarity
3. Get results ranked by semantic relevance

### Step 1: Generate Query Embedding

```bash
curl https://api.openai.com/v1/embeddings \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "AI automation and productivity",
    "model": "text-embedding-3-small",
    "dimensions": 1536
  }'
```

**Response:**
```json
{
  "data": [
    {
      "embedding": [0.123, -0.456, 0.789, ...]  // 1536 dimensions
    }
  ]
}
```

### Step 2: Query Similar Posts

```bash
curl "https://your-project.data.neon.tech/posts?select=*&order=embedding.dist([0.123,-0.456,0.789,...])&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Notes:**
- Replace `[0.123,...]` with the full 1536-dimension embedding array
- `embedding.dist()` calculates cosine distance (lower = more similar)
- Only returns posts with embeddings (non-null)

### Step 3: Using the Semantic Search Function

Alternatively, use the built-in function:

```bash
curl "https://your-project.data.neon.tech/rpc/semantic_search" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query_embedding": "[0.123,-0.456,0.789,...]",
    "max_results": 10,
    "min_similarity": 0.7
  }'
```

### Example: Find Similar Posts

**Query:** "What are my best posts about AI?"

**Steps:**
1. Generate embedding for "AI" → `[embedding_vector]`
2. Query: `GET /posts?order=embedding.dist([...])&likes=gte.50&limit=5`
3. Get 5 most similar posts with at least 50 likes

---

## Intelligence Views

Pre-built analytical views for instant insights. No complex queries needed!

### 1. Top Performers

**Endpoint:** `/top_performers`

**Description:** Best-performing posts across all profiles.

**Query:**
```bash
curl "https://your-project.data.neon.tech/top_performers?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Use cases:**
- "What are my best posts?"
- "Show me the top 10 posts this month"
- "Which posts got the most engagement?"

---

### 2. Trending Hashtags

**Endpoint:** `/trending_hashtags`

**Description:** Most popular hashtags in the last 30 days (materialized view, refreshed daily).

**Query:**
```bash
curl "https://your-project.data.neon.tech/trending_hashtags?limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

**Response includes:**
- `hashtag` - The hashtag text
- `post_count` - How many times used
- `total_engagement` - Sum of all engagement
- `avg_engagement_rate` - Average engagement rate
- `last_used` - Most recent use

**Use cases:**
- "What hashtags are trending?"
- "Which hashtags drive the most engagement?"
- "What topics should I post about?"

---

### 3. Competitive Intelligence

**Endpoint:** `/competitive_intel`

**Description:** Compare performance metrics across all tracked profiles.

**Query:**
```bash
curl "https://your-project.data.neon.tech/competitive_intel" \
  -H "Authorization: Bearer $TOKEN"
```

**Response includes:**
- Profile stats (avg likes, comments, shares)
- Top 3 hashtags per profile
- Posting frequency
- Date ranges

**Use cases:**
- "How do I compare to my competitors?"
- "What hashtags do my competitors use?"
- "Who has the best engagement rate?"

---

### 4. Topic Performance

**Endpoint:** `/topic_performance`

**Description:** Engagement metrics for each hashtag across all profiles.

**Query:**
```bash
curl "https://your-project.data.neon.tech/topic_performance?order=avg_engagement.desc&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

**Use cases:**
- "Which topics perform best?"
- "What should I write about to get more engagement?"
- "Are posts with images performing better?"

---

### 5. Posting Patterns

**Endpoint:** `/posting_patterns`

**Description:** Best days and times to post based on historical engagement.

**Query:**
```bash
curl "https://your-project.data.neon.tech/posting_patterns?order=avg_engagement.desc" \
  -H "Authorization: Bearer $TOKEN"
```

**Response includes:**
- `day_of_week` - 0 (Sunday) to 6 (Saturday)
- `day_name` - Human-readable day name
- `hour_of_day` - 0-23
- `avg_engagement` - Average engagement for that time slot

**Use cases:**
- "When is the best time to post?"
- "What day gets the most engagement?"
- "Should I post on weekends?"

**Example - Find best day:**
```bash
curl "https://your-project.data.neon.tech/posting_patterns?select=day_name,avg_engagement&order=avg_engagement.desc&limit=1" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 6. Recent Activity

**Endpoint:** `/recent_activity`

**Description:** Daily summary for the last 7 days.

**Query:**
```bash
curl "https://your-project.data.neon.tech/recent_activity" \
  -H "Authorization: Bearer $TOKEN"
```

**Response includes:**
- Daily post counts
- Total engagement per day
- Best post of each day (JSON object)

**Use cases:**
- "How's my content performing this week?"
- "Am I posting consistently?"
- "What was my best post yesterday?"

---

## Integration Examples

### Claude Desktop (MCP Server)

If you have an MCP server configured for HTTP requests:

```json
{
  "mcpServers": {
    "linkedin-data": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-fetch"],
      "env": {
        "NEON_DATA_API_URL": "https://your-project.data.neon.tech",
        "NEON_JWT_TOKEN": "eyJhbGci..."
      }
    }
  }
}
```

Then ask Claude:
> "Using the linkedin-data MCP server, fetch my top 10 posts from /top_performers"

---

### ChatGPT (Custom GPT)

Create a custom GPT with these instructions:

```markdown
You have access to a LinkedIn post database via the Neon Data API.

Base URL: https://your-project.data.neon.tech
Authentication: Bearer {your_jwt_token}

Available endpoints:
- /posts - All posts
- /top_performers - Best posts
- /trending_hashtags - Popular hashtags
- /competitive_intel - Profile comparisons

Use PostgREST syntax for filtering and sorting.
```

**Example action:**
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "LinkedIn Data API",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://your-project.data.neon.tech"
    }
  ],
  "paths": {
    "/posts": {
      "get": {
        "operationId": "getPosts",
        "summary": "Get LinkedIn posts",
        "security": [{"BearerAuth": []}]
      }
    }
  },
  "components": {
    "securitySchemes": {
      "BearerAuth": {
        "type": "http",
        "scheme": "bearer"
      }
    }
  }
}
```

---

### Cursor / AI Code Editors

Create a `.cursorrules` file in your project:

```markdown
# LinkedIn Data Access

The project has access to a LinkedIn post database via Neon Data API.

Base URL: https://your-project.data.neon.tech
Auth: Bearer token in NEON_JWT_TOKEN env variable

Example queries:
- Top posts: GET /top_performers?limit=10
- Search: GET /posts?content=ilike.*keyword*
- Trending: GET /trending_hashtags

Use PostgREST syntax for all queries.
```

---

### Node.js Script

```javascript
import fetch from 'node-fetch';

const NEON_API = 'https://your-project.data.neon.tech';
const TOKEN = process.env.NEON_JWT_TOKEN;

async function getTopPosts(limit = 10) {
  const response = await fetch(
    `${NEON_API}/top_performers?limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Usage
const posts = await getTopPosts(10);
console.log(`Found ${posts.length} top posts`);
```

---

### Python Script

```python
import os
import requests

NEON_API = "https://your-project.data.neon.tech"
TOKEN = os.getenv("NEON_JWT_TOKEN")

def get_top_posts(limit=10):
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

    response = requests.get(
        f"{NEON_API}/top_performers",
        headers=headers,
        params={"limit": limit}
    )

    response.raise_for_status()
    return response.json()

# Usage
posts = get_top_posts(10)
print(f"Found {len(posts)} top posts")
```

---

## Sample AI Conversations

### Example 1: Content Strategy

**User:** "What topics should I write about to get more engagement?"

**AI Process:**
1. Query `/topic_performance?order=avg_engagement.desc&limit=10`
2. Analyze top-performing hashtags
3. Cross-reference with `/competitive_intel` to see what competitors use
4. Provide recommendations

**AI Response:**
> Based on your data, here are your top 5 topics by engagement:
>
> 1. **#AI** - avg 120 engagement/post (15 posts)
> 2. **#productivity** - avg 95 engagement/post (22 posts)
> 3. **#startup** - avg 87 engagement/post (18 posts)
> 4. **#design** - avg 76 engagement/post (12 posts)
> 5. **#remotework** - avg 68 engagement/post (9 posts)
>
> Recommendation: Focus on AI and productivity content. Your competitor Nicolas averages 150 engagement on AI posts, so there's room to improve by studying his approach.

---

### Example 2: Best Time to Post

**User:** "When should I post for maximum engagement?"

**AI Process:**
1. Query `/posting_patterns?order=avg_engagement.desc&limit=10`
2. Analyze day/hour patterns
3. Provide specific recommendations

**AI Response:**
> Based on 200 historical posts, your best times to post are:
>
> **Top 3 Days:**
> 1. Tuesday - avg 85 engagement
> 2. Wednesday - avg 78 engagement
> 3. Thursday - avg 72 engagement
>
> **Top 3 Hours (UTC):**
> 1. 2pm (14:00) - avg 92 engagement
> 2. 10am (10:00) - avg 84 engagement
> 3. 4pm (16:00) - avg 79 engagement
>
> **Optimal posting window:** Tuesday-Thursday, 10am-4pm UTC

---

### Example 3: Competitive Analysis

**User:** "How do I compare to Nicolas Boucher?"

**AI Process:**
1. Query `/competitive_intel?display_name=in.("Saul Mateos","Nicolas Boucher")`
2. Compare metrics side-by-side
3. Identify strengths and weaknesses

**AI Response:**
> **Performance Comparison:**
>
> | Metric | You | Nicolas | Difference |
> |--------|-----|---------|------------|
> | Avg Likes | 45 | 68 | -34% |
> | Avg Comments | 12 | 18 | -33% |
> | Avg Engagement Rate | 4.2% | 6.1% | -31% |
> | Posts/Month | 8 | 12 | -33% |
>
> **Nicolas's Top Hashtags:** #AI, #MachineLearning, #DataScience
> **Your Top Hashtags:** #productivity, #startup, #design
>
> **Recommendations:**
> 1. Increase posting frequency (currently 8/month vs Nicolas's 12)
> 2. Experiment with AI/ML content (Nicolas's strength)
> 3. Add more visuals (Nicolas uses images in 80% of posts)

---

### Example 4: Semantic Search

**User:** "Find my posts about improving team collaboration"

**AI Process:**
1. Generate embedding for "improving team collaboration"
2. Query `/posts?order=embedding.dist([...])&limit=10`
3. Return semantically similar posts

**AI Response:**
> Found 8 posts related to team collaboration:
>
> 1. **"How we reduced meeting time by 50%"** (Oct 10) - 124 engagement
> 2. **"3 async communication tools every team needs"** (Sep 28) - 98 engagement
> 3. **"Building remote culture in a distributed team"** (Sep 15) - 87 engagement
> ...
>
> These posts all performed well (avg 95 engagement). Consider writing more about:
> - Async communication
> - Remote work tools
> - Team productivity

---

### Example 5: Content Gaps

**User:** "What am I not posting about that I should?"

**AI Process:**
1. Query `/topic_performance` (your topics)
2. Query `/competitive_intel` (competitor topics)
3. Identify gaps and opportunities

**AI Response:**
> **Content Gap Analysis:**
>
> Topics your competitors post about but you don't:
> - **#MachineLearning** - Nicolas averages 145 engagement
> - **#DevTools** - Nicolas averages 112 engagement
> - **#TechTrends** - Competitors average 95 engagement
>
> Topics you post about that competitors don't:
> - **#UserResearch** - You average 78 engagement
> - **#DesignSystems** - You average 65 engagement
>
> **Recommendation:** Consider adding ML/DevTools content while maintaining your unique voice in UX/Design.

---

## Troubleshooting

### Error: 401 Unauthorized

**Cause:** JWT token expired or invalid

**Solution:**
1. Go to Neon Console
2. Regenerate JWT token
3. Update your environment variable/script

---

### Error: 404 Not Found

**Cause:** Endpoint doesn't exist or typo in URL

**Solution:**
- Verify endpoint name (e.g., `/posts` not `/post`)
- Check base URL is correct
- Ensure Data API is enabled in Neon console

---

### Error: 416 Range Not Satisfiable

**Cause:** Requested range exceeds available data

**Solution:**
- Check total row count first
- Use `limit` instead of `Range` header
- Ensure offset isn't larger than total rows

---

### Empty Results

**Cause:** Query filters too restrictive or no data matches

**Solution:**
- Test without filters first: `GET /posts?limit=10`
- Check filter syntax (e.g., `eq.` not `=`)
- Verify data exists in Neon console

---

### Slow Queries

**Cause:** Missing indexes or complex operations

**Solution:**
- Use intelligence views instead of raw queries
- Add indexes in Neon console
- Limit result size with `?limit=`
- Use semantic search function instead of direct distance calc

---

### Semantic Search Not Working

**Possible causes:**
1. **No embeddings generated** - Run `node scripts/generate-embeddings.js`
2. **Wrong embedding dimensions** - Must be exactly 1536 for text-embedding-3-small
3. **Syntax error** - Check embedding array format: `[0.123,-0.456,...]`

**Solution:**
```bash
# 1. Check if embeddings exist
curl "https://your-project.data.neon.tech/posts?select=count()&embedding=not.is.null" \
  -H "Authorization: Bearer $TOKEN"

# 2. Generate embeddings if needed
node scripts/generate-embeddings.js

# 3. Test with semantic_search function
curl "https://your-project.data.neon.tech/rpc/semantic_search" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query_embedding": "[...]", "max_results": 5}'
```

---

## Advanced Topics

### Combining Filters with Semantic Search

```bash
# Find similar posts with > 50 likes from last 30 days
curl "https://your-project.data.neon.tech/posts?\
select=*&\
order=embedding.dist([...])&\
likes=gte.50&\
published_at=gte.2025-09-15&\
limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### Hybrid Search (Keyword + Semantic)

```bash
# 1. Keyword search
curl "https://your-project.data.neon.tech/posts?content=ilike.*AI*" \
  -H "Authorization: Bearer $TOKEN"

# 2. Semantic search
curl "https://your-project.data.neon.tech/posts?order=embedding.dist([...])" \
  -H "Authorization: Bearer $TOKEN"

# 3. Combine results in your application (union)
```

### Custom Analytics

```bash
# Engagement rate over time
curl "https://your-project.data.neon.tech/posts?\
select=published_at::date,avg(engagement_rate)\
&group=published_at::date\
&order=published_at.desc" \
  -H "Authorization: Bearer $TOKEN"
```

### Refreshing Materialized Views

```bash
# Via SQL function (requires PostgreSQL access)
curl "https://your-project.data.neon.tech/rpc/refresh_intelligence_views" \
  -H "Authorization: Bearer $TOKEN" \
  -X POST
```

---

## Rate Limits & Best Practices

### Neon Data API Limits

- **Free tier**: 100 requests/minute
- **Pro tier**: 1000 requests/minute

### Best Practices

1. **Cache results** - Don't query for the same data repeatedly
2. **Use intelligence views** - Pre-computed, faster than raw queries
3. **Limit result size** - Always use `?limit=` to avoid large payloads
4. **Batch operations** - Combine multiple filters instead of separate requests
5. **Refresh materialized views daily** - Keep trending_hashtags up to date
6. **Monitor costs** - Neon Data API is free but OpenAI embeddings cost money

### Example: Efficient Daily Report

```bash
# Single query for daily stats
curl "https://your-project.data.neon.tech/recent_activity" \
  -H "Authorization: Bearer $TOKEN"

# Returns pre-computed 7-day summary (fast!)
```

---

## Cost Analysis

### OpenAI Embeddings

- **One-time cost**: ~$0.20 for 300 existing posts
- **Ongoing cost**: ~$0.02/month for 10 new posts/month
- **Model**: text-embedding-3-small ($0.00002 per 1K tokens)

### Neon Database

- **Storage**: Free tier (0.5GB sufficient for 1000s of posts)
- **Compute**: Free tier (100 hours/month)
- **Data API**: Free (no additional charge)

### Total Monthly Cost

**~$0-2/month** depending on usage

---

## Summary

This guide enables AI tools to query your LinkedIn data directly via HTTP, without context limits or manual data copying. Key benefits:

✅ **No context limits** - Query only what you need
✅ **Real-time data** - Always up to date
✅ **Semantic search** - Find content by meaning
✅ **Pre-built analytics** - Intelligence views for instant insights
✅ **Cost-effective** - ~$0-2/month
✅ **No backend code** - Pure SQL + HTTP

**Next steps:**
1. Enable Neon Data API in console
2. Generate JWT token
3. Run `create-intelligence-views.sql`
4. Run `generate-embeddings.js`
5. Start querying from AI tools!

---

**Questions or issues?** See [PLAN.md](../PLAN.md) for implementation details or [CLAUDE.md](../CLAUDE.md) for project architecture.

**Last Updated:** October 16, 2025
**Version:** 1.0
**Status:** Production Ready
