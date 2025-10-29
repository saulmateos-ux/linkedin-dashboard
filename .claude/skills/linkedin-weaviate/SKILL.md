---
name: linkedin-weaviate
description: Query LinkedIn Analytics Weaviate vector database from any project. Perform semantic search on 746+ LinkedIn posts with workspace filtering, engagement metrics, and date ranges. Use this when users request LinkedIn content analysis, semantic search, trending topics, or competitive intelligence from the LinkedIn database.
---

# LinkedIn Weaviate Query Skill

Query the LinkedIn Analytics Weaviate vector database from any Claude Code project.

## Overview

This skill provides access to a Weaviate vector database containing 746+ LinkedIn posts with semantic search capabilities. Query by meaning (not just keywords), filter by workspaces, profiles, engagement, and dates.

**Database**: LinkedIn Analytics (personal + competitor + team posts)
**Vector Search**: OpenAI `text-embedding-3-small` embeddings
**Features**: Semantic search, workspace filtering, engagement analysis, trending hashtags

## When to Use This Skill

Use this skill when the user requests:

- **Semantic search**: "Find posts about CFO challenges"
- **Competitive intelligence**: "Show me what competitors are posting about AI"
- **Content analysis**: "What topics are trending in workspace 3?"
- **Engagement insights**: "Find high-performing posts about healthcare"
- **Topic research**: "Search for posts similar to my top performer"
- **Workspace filtering**: "Show me all posts from the Gain Company workspace"

This skill should be invoked from projects **outside** the main `linkedin-dashboard` project. For queries within the dashboard project itself, use the existing `lib/weaviate.ts` module directly.

## Prerequisites

### 1. Credentials Setup (One-Time)

Add Weaviate credentials to the shell environment:

```bash
# Option A: Add to ~/.zshrc (permanent)
echo 'export WEAVIATE_URL="YOUR_WEAVIATE_URL"' >> ~/.zshrc
echo 'export WEAVIATE_API_KEY="YOUR_WEAVIATE_API_KEY"' >> ~/.zshrc
echo 'export OPENAI_API_KEY="YOUR_OPENAI_API_KEY"' >> ~/.zshrc
source ~/.zshrc

# Option B: Create credentials file
mkdir -p ~/.config/weaviate
cat > ~/.config/weaviate/credentials << 'EOF'
export WEAVIATE_URL="YOUR_WEAVIATE_URL"
export WEAVIATE_API_KEY="YOUR_WEAVIATE_API_KEY"
export OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
EOF
# Then source before queries: source ~/.config/weaviate/credentials
```

Verify setup:
```bash
echo $WEAVIATE_URL  # Should print the URL
```

### 2. Understanding the Schema

Before querying, read `references/schema.md` to understand:
- **Post class**: 746+ posts with `content`, `authorName`, `workspaceIds`, `engagementTotal`, etc.
- **Workspace IDs**: Logical groupings (1 = Personal, 3 = Gain Company, etc.)
- **Profile IDs**: Links to profiles table (4 = Nicolas Boucher, 8 = MoveDocs, etc.)

## Usage Patterns

### Pattern 1: Quick Queries with Python Script (Recommended)

Use `scripts/query_weaviate.py` for common queries without writing GraphQL:

```bash
# Simple semantic search
python3 scripts/query_weaviate.py --query "AI automation" --limit 10

# Filter by workspace
python3 scripts/query_weaviate.py --query "CFO challenges" --workspace 3 --limit 10

# Filter by engagement
python3 scripts/query_weaviate.py --query "healthcare trends" --min-engagement 50 --limit 10

# Recent posts only (last 30 days)
python3 scripts/query_weaviate.py --query "revenue cycle" --days 30 --limit 10

# Combined filters
python3 scripts/query_weaviate.py --query "AI in finance" --workspace 1 --min-engagement 30 --days 60 --limit 15

# Get total post count
python3 scripts/query_weaviate.py --count

# Get trending hashtags (last 7 days)
python3 scripts/query_weaviate.py --hashtags --days 7

# Output raw JSON
python3 scripts/query_weaviate.py --query "marketing" --limit 5 --json
```

**When to use Python script**:
- Quick ad-hoc queries
- Testing queries before building features
- User requests simple searches

### Pattern 2: Direct API Calls via Bash (Advanced)

For complex queries or when the Python script doesn't support needed filters, use direct GraphQL via `curl`:

```bash
# Load credentials first
source ~/.config/weaviate/credentials  # Or already in ~/.zshrc

# Create query file
cat > /tmp/weaviate_query.json << 'EOF'
{
  "query": "{ Get { Post(nearText: {concepts: [\"healthcare innovation\"]}, limit: 5) { content authorName engagementTotal _additional { certainty } } } }"
}
EOF

# Execute query
curl -X POST "$WEAVIATE_URL/v1/graphql" \
  -H "Authorization: Bearer $WEAVIATE_API_KEY" \
  -H "X-OpenAI-Api-Key: $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d @/tmp/weaviate_query.json | jq '.'
```

**When to use direct API**:
- Complex filters not supported by Python script
- Need specific field combinations
- Building custom integrations

### Pattern 3: Reference Query Patterns (For Complex Filters)

When building custom GraphQL queries, refer to `references/query-patterns.md` for examples of:

- Workspace filtering (`ContainsAny` operator)
- Date range queries
- Combined AND/OR logic
- Hashtag filtering
- Aggregations and statistics
- Similar post discovery (`nearObject`)

Load the reference file when needed:
```bash
# Read query patterns for workspace filtering
Read references/query-patterns.md (section: "2. Workspace Filtering")
```

## Common Workflows

### Workflow 1: Content Research

User asks: *"Find posts about AI automation that got high engagement"*

**Steps**:
1. Use Python script with engagement filter:
   ```bash
   python3 scripts/query_weaviate.py --query "AI automation" --min-engagement 100 --limit 10
   ```
2. Review results and extract insights
3. Present top posts with engagement metrics

### Workflow 2: Workspace-Specific Analysis

User asks: *"What are competitors posting about in workspace 3?"*

**Steps**:
1. Query workspace 3 posts:
   ```bash
   python3 scripts/query_weaviate.py --query "recent trends" --workspace 3 --days 30 --limit 20
   ```
2. Analyze content themes
3. Summarize key topics and engagement patterns

### Workflow 3: Trending Topic Discovery

User asks: *"What topics are trending in the last 7 days?"*

**Steps**:
1. Get trending hashtags:
   ```bash
   python3 scripts/query_weaviate.py --hashtags --days 7
   ```
2. For each top hashtag, search posts:
   ```bash
   python3 scripts/query_weaviate.py --query "AI" --days 7 --limit 5
   ```
3. Synthesize trends and insights

### Workflow 4: Competitive Intelligence

User asks: *"Compare our posts vs competitors on healthcare topics"*

**Steps**:
1. Search workspace 1 (personal):
   ```bash
   python3 scripts/query_weaviate.py --query "healthcare" --workspace 1 --limit 10
   ```
2. Search workspace 3 (competitors):
   ```bash
   python3 scripts/query_weaviate.py --query "healthcare" --workspace 3 --limit 10
   ```
3. Compare engagement, themes, messaging

### Workflow 5: Custom GraphQL Query

User asks: *"Find posts from profile 4 with hashtag #AI in last 60 days"*

**Steps**:
1. Read query patterns reference:
   ```bash
   Read references/query-patterns.md (sections: "5. Combined Filters", "8. Hashtag Analysis")
   ```
2. Build custom GraphQL query combining filters
3. Execute via curl with proper headers

## Best Practices

### Context Efficiency

- **Zero upfront cost**: Skill metadata (~100 words) always loaded
- **Just-in-time loading**: Load `references/` files only when needed
- **Prefer Python script**: Avoids loading query patterns for simple queries
- **Direct API for complex**: Only when Python script insufficient

### Query Optimization

1. **Start broad, then filter**: Semantic search first, then apply filters
2. **Use `_additional { certainty }`**: Understand match quality (0-1 scale)
3. **Limit results**: Default 10, max 10,000 (but pagination not needed for most queries)
4. **Cache common workspace IDs**: 1 = Personal, 3 = Gain Company, etc.

### Error Handling

**"no api key found"**:
- Check environment variables are set
- Verify `X-OpenAI-Api-Key` header in curl commands

**"class 'Post' does not exist"**:
- Database schema not initialized
- Contact database owner to run sync script

**Empty results**:
- Try broader query terms
- Remove filters to test semantic search alone
- Check workspace ID is correct

## Workspace Reference

Common workspace IDs:

| ID | Name | Description |
|----|------|-------------|
| 1 | Personal | Own LinkedIn posts |
| 3 | Gain Company | Company workspace posts |
| (others) | Various | Team, competitor, inspiration workspaces |

Query workspaces table in PostgreSQL for complete list:
```bash
psql "$LINKEDIN_DB" -c "SELECT id, name, description FROM workspaces ORDER BY id;"
```

## Database Connection Info

**Weaviate Cluster**: US West (GCP)
**Total Posts**: 746+
**Update Frequency**: Ad-hoc (when scraping runs)
**Classes**: Post (populated), Entity (schema only), Topic (schema only)

**Related PostgreSQL Database**:
- Connection: `$LINKEDIN_DB` (in environment)
- Tables: `posts`, `profiles`, `workspaces`, `workspace_profiles`
- Use for: Profile metadata, workspace definitions, post metadata

## Troubleshooting

### Credentials Not Working

```bash
# Test connection
curl -X GET "$WEAVIATE_URL/v1/.well-known/ready" \
  -H "Authorization: Bearer $WEAVIATE_API_KEY"
# Should return: {"ready": true}
```

### Script Not Found

```bash
# Get skill path
SKILL_PATH=$(python3 -c "import os; print(os.path.expanduser('~/.claude/skills/linkedin-weaviate'))")
cd $SKILL_PATH
python3 scripts/query_weaviate.py --count
```

### Query Errors

Enable verbose error output:
```bash
# See full error response
curl -v -X POST "$WEAVIATE_URL/v1/graphql" \
  -H "Authorization: Bearer $WEAVIATE_API_KEY" \
  -H "X-OpenAI-Api-Key: $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ Get { Post(limit: 1) { content } } }"}'
```

## Advanced: Entity and Topic Classes

The database has `Entity` and `Topic` classes with schemas defined but not yet populated:

- **Entity**: Companies, people, products mentioned in posts
- **Topic**: Themes and trends extracted from content

These classes will be populated in a future update. For now, focus on the `Post` class.

## Support

For issues or questions about this skill:
1. Check `references/schema.md` for data structure
2. Review `references/query-patterns.md` for query examples
3. Test connection with `python3 scripts/query_weaviate.py --count`
4. Verify credentials are set: `echo $WEAVIATE_URL`

---

**Last Updated**: 2025-10-29
**Skill Version**: 1.0.0
