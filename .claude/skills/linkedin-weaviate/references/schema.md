# LinkedIn Weaviate Database Schema

This document describes the complete schema for the LinkedIn Analytics Weaviate vector database.

## Overview

**Database URL**: `https://n1rin6rerjmgj4snwaxz8g.c0.us-west3.gcp.weaviate.cloud`
**Vectorization**: OpenAI `text-embedding-3-small`
**Total Posts**: 746+ LinkedIn posts with embeddings
**Classes**: 3 (Post, Entity, Topic)

---

## Class 1: Post

**Description**: LinkedIn posts and content with semantic vectors

**Vectorizer**: `text2vec-openai`

### Properties

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `postId` | text | Unique post ID from PostgreSQL | "7378167032737067008" |
| `content` | text | Full post content (vectorized) | "ChatGPT 5 can help accounting..." |
| `authorName` | text | Author display name | "Nicolas Boucher" |
| `authorUsername` | text | LinkedIn username | "nicolasboucher" |
| `publishedAt` | date | Publication timestamp (ISO 8601) | "2025-09-30T15:00:00Z" |
| `likes` | int | Number of likes | 211 |
| `comments` | int | Number of comments | 45 |
| `shares` | int | Number of shares | 13 |
| `engagementTotal` | int | Total engagement (likes + comments + shares) | 269 |
| `hashtags` | text[] | Array of hashtags | ["AI", "Finance", "ChatGPT"] |
| `postUrl` | text | LinkedIn post URL | "https://linkedin.com/posts/..." |
| `profileId` | int | Profile ID from PostgreSQL profiles table | 4 |
| `workspaceIds` | int[] | Workspace IDs this post belongs to | [1, 3] |

### Key Features

- **Semantic Search**: Find posts by meaning, not just keywords
- **Workspace Filtering**: Filter by workspace membership
- **Profile Tracking**: Link back to PostgreSQL profiles
- **Engagement Metrics**: Filter by engagement thresholds
- **Date Filtering**: Query by publication date ranges

### Example Data

```json
{
  "postId": "7378167032737067008",
  "content": "ChatGPT 5 can help accounting teams save hours of work...",
  "authorName": "Nicolas Boucher",
  "authorUsername": "nicolasboucher",
  "publishedAt": "2025-09-30T15:00:00Z",
  "likes": 211,
  "comments": 45,
  "shares": 13,
  "engagementTotal": 269,
  "hashtags": ["AI", "Finance", "ChatGPT"],
  "postUrl": "https://linkedin.com/posts/...",
  "profileId": 4,
  "workspaceIds": [1]
}
```

---

## Class 2: Entity

**Description**: Extracted entities (companies, people, products, technologies) mentioned in posts

**Vectorizer**: `text2vec-openai`

**Status**: Schema defined, not yet populated

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | text | Entity name |
| `type` | text | Entity type: company, person, product, technology, concept |
| `description` | text | Entity description or context |
| `mentionCount` | int | Number of times mentioned across all posts |
| `firstSeen` | date | First time this entity appeared |
| `lastSeen` | date | Most recent mention |

### Use Cases

- Track companies mentioned in posts
- Identify key people referenced
- Monitor product/technology trends
- Build knowledge graph of entities

---

## Class 3: Topic

**Description**: Topics and themes extracted from content

**Vectorizer**: `text2vec-openai`

**Status**: Schema defined, not yet populated

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | text | Topic name |
| `description` | text | Topic description |
| `category` | text | Topic category (e.g., AI, Healthcare, Finance) |
| `trendScore` | number | Trending score (higher = more trending) |
| `postCount` | int | Number of posts about this topic |
| `avgEngagement` | number | Average engagement for posts on this topic |

### Use Cases

- Identify trending themes
- Track topic evolution over time
- Compare engagement by topic
- Discover emerging trends

---

## Additional Metadata (`_additional`)

All queries can include `_additional` fields:

| Field | Description |
|-------|-------------|
| `certainty` | Semantic match confidence (0-1) |
| `distance` | Vector distance from query |
| `id` | Weaviate object UUID |

---

## Linked PostgreSQL Data

The Weaviate database syncs from a PostgreSQL database with these relationships:

### Profiles Table (via `profileId`)

Profiles contain:
- `id`, `username`, `display_name`, `profile_url`
- `profile_type`: 'own', 'competitor', 'inspiration', 'partner', 'team', 'other'
- `is_company`: boolean (company pages vs personal profiles)
- `follower_count`, `last_scraped_at`

### Workspaces Table (via `workspaceIds`)

Workspaces are logical groupings of profiles:
- `id`, `name`, `description`, `color`
- Many-to-many relationship with profiles via `workspace_profiles` join table

---

## Data Sync

**Sync Script**: `scripts/sync-to-weaviate.ts` (in main project)

**Sync Process**:
1. Fetch posts from PostgreSQL with workspace relationships
2. Generate embeddings via OpenAI
3. Upsert to Weaviate

**Last Sync**: Check Weaviate console or query count

**Re-sync Command**:
```bash
cd /path/to/linkedin-dashboard
npx tsx scripts/sync-to-weaviate.ts
```
