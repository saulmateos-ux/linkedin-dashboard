# Weaviate Cloud Setup Guide

## 🚀 Quick Start (15 minutes)

### Step 1: Create Weaviate Cloud Account

1. Go to https://console.weaviate.cloud/
2. Sign up with your email (free tier = 5M vectors)
3. Click "Create Cluster"
   - Name: `linkedin-intelligence`
   - Region: Choose closest to you
   - Plan: **Sandbox** (free tier, perfect for testing)
4. Wait ~2 minutes for cluster to spin up

### Step 2: Get Your Credentials

Once cluster is ready:

1. Click on your cluster name
2. Copy the **Cluster URL** (looks like: `https://your-cluster-abc123.weaviate.network`)
3. Click "API Keys" → "Create API Key"
4. Copy the API key (starts with `WCS...`)

### Step 3: Configure Your App

Add to your `.env` file:

```bash
# Weaviate Cloud
WEAVIATE_URL=https://your-cluster-abc123.weaviate.network
WEAVIATE_API_KEY=WCS...your-key-here...

# OpenAI (required for vectorization)
OPENAI_API_KEY=sk-...your-key...
```

### Step 4: Initialize Schema & Sync Data

Run the migration script:

```bash
cd /Users/saulmateos/Documents/GitHub/linkedin-dashboard
npx tsx scripts/sync-to-weaviate.ts
```

This will:
- ✅ Create schema in Weaviate (Post, Entity, Topic classes)
- ✅ Sync all 345 posts from PostgreSQL
- ✅ Generate embeddings via OpenAI
- ⏱️ Takes ~2-3 minutes

Expected output:
```
🚀 Starting Weaviate sync...

📋 Step 1: Initializing Weaviate schema...
✅ Created Post class in Weaviate
✅ Created Entity class in Weaviate
✅ Created Topic class in Weaviate

📊 Step 2: Fetching posts from PostgreSQL...
   Found 345 posts to sync
   0 posts already in Weaviate

🔄 Step 3: Syncing posts to Weaviate...
   Synced 10/345 posts...
   Synced 20/345 posts...
   ...
   Synced 345/345 posts...

✅ Sync complete!
   📈 Synced: 345 posts
   ⏭️  Skipped: 0 posts
   ❌ Errors: 0 posts

🔍 Verifying sync...
   Total posts in Weaviate: 345

🎉 All done! You can now use semantic search on your posts.
```

### Step 5: Test Semantic Search

1. Open http://localhost:3000/search
2. Try searching: `"AI automation in healthcare"`
3. See results ranked by semantic similarity!

**Example queries to try:**
- `"CFO challenges with revenue cycle management"`
- `"digital transformation trends"`
- `"legal technology innovations"`
- `"thought leadership in finance"`

---

## 🎯 What You Get

### Semantic Search
```bash
curl "http://localhost:3000/api/search/semantic?q=AI%20automation&limit=10"
```

**Response:**
```json
{
  "success": true,
  "query": "AI automation",
  "results": [
    {
      "postId": "7263...",
      "content": "The future of healthcare automation...",
      "authorName": "John Doe",
      "likes": 52,
      "_additional": {
        "certainty": 0.89  // 89% match
      }
    }
  ]
}
```

### Find Similar Posts
```javascript
const similar = await findSimilarPosts('post-id-123', 5);
// Returns 5 posts most similar to post-id-123
```

### Hybrid Queries (Semantic + Filters)
```javascript
const results = await searchPosts('AI in healthcare', 10, {
  workspaceIds: [1, 2],
  minEngagement: 20,
  startDate: '2025-10-01',
});
```

---

## 💰 Costs

### Weaviate Cloud
- **Free tier**: 5M vectors (you have 345 posts = **FREE**)
- **Paid tier**: $25/month for 25M vectors (if you scale up)

### OpenAI Embeddings
- **Model**: text-embedding-3-small
- **Cost**: $0.02 per 1M tokens
- **Your data**: 345 posts × ~500 tokens = **~$0.01 total**
- **Ongoing**: ~$0.02/month for new posts

### Total Cost
- **Initial setup**: $0.01
- **Monthly**: ~$0.02 (basically free!)

---

## 🔧 Architecture

```
┌─────────────────────────────────────────────────────┐
│              Your Application                        │
│  localhost:3000/search → Semantic Search UI          │
└────────────┬────────────────────────────────────────┘
             │
    ┌────────▼─────────┐
    │  API Routes      │
    │  /api/search/    │
    │  semantic        │
    └────────┬─────────┘
             │
    ┌────────▼──────────────────────────────────────┐
    │  lib/weaviate.ts (Weaviate Client)            │
    └───┬───────────────────────────────────────────┘
        │
        │  HTTPS (API calls)
        │
    ┌───▼──────────────────────────────────────────┐
    │  Weaviate Cloud                               │
    │  https://your-cluster.weaviate.network        │
    │                                               │
    │  • Post vectors (345 posts)                  │
    │  • Entity extraction                         │
    │  • Topic clustering                          │
    │  • Semantic search                           │
    └───────────────────────────────────────────────┘
```

---

## 🧪 Testing the Setup

### 1. Test Connection
```typescript
// Test if Weaviate is accessible
const client = getWeaviateClient();
const schema = await client.schema.getter().do();
console.log('Classes:', schema.classes?.map(c => c.class));
// Should show: ['Post', 'Entity', 'Topic']
```

### 2. Test Search
```bash
# Simple GET request
curl "http://localhost:3000/api/search/semantic?q=healthcare&limit=5"
```

### 3. Test via UI
Navigate to http://localhost:3000/search and search for anything!

---

## 🔍 Advanced Queries

### Example 1: Industry Intelligence
```javascript
// Find all posts about "AI automation" from last 30 days
const results = await searchPosts('AI automation healthcare', 20, {
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  minEngagement: 10,
});
```

### Example 2: Competitive Analysis
```javascript
// Find posts similar to your top performer
const topPost = '7263...'; // Your best post ID
const similar = await findSimilarPosts(topPost, 10);
// See what similar high-performing content looks like
```

### Example 3: Trend Detection
```javascript
// Get trending topics from last 7 days
const trends = await getTrendingTopics(7, 10);
```

---

## 🐛 Troubleshooting

### Error: "Weaviate credentials not configured"
**Solution**: Add `WEAVIATE_URL` and `WEAVIATE_API_KEY` to `.env`

### Error: "OpenAI API key missing"
**Solution**: Add `OPENAI_API_KEY` to `.env` (required for vectorization)

### Error: "Class 'Post' does not exist"
**Solution**: Run the sync script: `npx tsx scripts/sync-to-weaviate.ts`

### Sync script hangs
**Solution**: Check Weaviate cluster is running in cloud console

### Search returns 0 results
**Possible causes:**
1. Sync didn't complete → Check Weaviate console for data
2. Query too specific → Try broader terms
3. Filters too restrictive → Remove filters and retry

---

## 📊 Monitoring

### Weaviate Console
https://console.weaviate.cloud/

Shows:
- Cluster status
- Object count (should be 345 posts)
- Query metrics
- Storage usage

### Check Data Count
```bash
curl -X POST \
  "https://your-cluster.weaviate.network/v1/graphql" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{
      Aggregate {
        Post {
          meta {
            count
          }
        }
      }
    }"
  }'
```

---

## 🚀 Next Steps

Once this is working:

1. **Add automatic sync** - Every time you scrape LinkedIn, auto-sync to Weaviate
2. **Entity extraction** - Extract companies, people, topics from posts
3. **Trend detection** - Automatically detect emerging trends
4. **Recommendations** - "You might also like..." based on similarity
5. **Multi-source ingestion** - Add news, events, etc. to Weaviate

---

## 📚 Resources

- Weaviate Docs: https://weaviate.io/developers/weaviate
- GraphQL API: https://weaviate.io/developers/weaviate/api/graphql
- Pricing: https://weaviate.io/pricing
- Console: https://console.weaviate.cloud/

---

**Questions?**
Check the Weaviate docs or ask in their Slack community: https://weaviate.io/slack
