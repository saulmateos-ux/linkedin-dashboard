# Database Access Setup - For Dummies 🎯

## What You're Getting

Read-only access to a LinkedIn Analytics database with:
- **1,184+ LinkedIn posts** with engagement metrics
- **12 profiles** (personal, team, competitors, companies)
- **4 workspaces** for organization

## Step-by-Step Setup (5 minutes)

### Step 1: Copy the Connection String

Copy this entire line (it's one long string):

```
postgresql://claude_analyst:analyst_readonly_2025%21secure@ep-wild-flower-adh2ui1j-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Important:** The `%21` is URL encoding for the `!` character - this is required for PostgreSQL connection strings with special characters in passwords.

### Step 2: Set Up Environment Variable

Open your Claude Code session and ask Claude to run this command:

```bash
echo 'export LINKEDIN_DB="postgresql://claude_analyst:analyst_readonly_2025%21secure@ep-wild-flower-adh2ui1j-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"' >> ~/.zshrc && source ~/.zshrc
```

**Or if you use bash instead of zsh:**

```bash
echo 'export LINKEDIN_DB="postgresql://claude_analyst:analyst_readonly_2025%21secure@ep-wild-flower-adh2ui1j-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"' >> ~/.bashrc && source ~/.bashrc
```

### Step 3: Test the Connection

Ask Claude to run:

```bash
psql $LINKEDIN_DB -c "SELECT COUNT(*) as total_posts FROM posts;"
```

You should see something like:
```
 total_posts
-------------
        1184
(1 row)
```

**If you get "command not found: psql"**, ask Claude to install PostgreSQL client:

**On Mac:**
```bash
brew install postgresql
```

**On Ubuntu/Debian:**
```bash
sudo apt-get update && sudo apt-get install postgresql-client
```

### Step 4: Start Analyzing!

Now you can ask Claude things like:

- "What are the top 10 most liked posts in the database?"
- "Show me engagement trends by profile"
- "Which hashtags perform best?"
- "Compare team vs competitor performance"

## Quick Reference Commands

### View all tables
```bash
psql $LINKEDIN_DB -c "\dt"
```

### Count posts
```bash
psql $LINKEDIN_DB -c "SELECT COUNT(*) FROM posts;"
```

### View profiles
```bash
psql $LINKEDIN_DB -c "SELECT id, display_name, profile_type FROM profiles;"
```

### Top 10 posts by likes
```bash
psql $LINKEDIN_DB -c "SELECT author_name, LEFT(content, 80) as snippet, num_likes FROM posts ORDER BY num_likes DESC LIMIT 10;"
```

### Interactive mode (explore freely)
```bash
psql $LINKEDIN_DB
```
Then type queries and use `\q` to exit.

## Database Schema Quick Reference

### Main Tables

**posts** - LinkedIn posts with engagement
- `id` - Post ID
- `profile_id` - Who posted it
- `author_name` - Author name
- `content` - Post text
- `published_at` - When posted
- `num_likes`, `num_comments`, `num_reposts` - Engagement metrics

**profiles** - Tracked LinkedIn profiles
- `id` - Profile ID
- `display_name` - Name
- `profile_type` - own, team, competitor, etc.
- `is_company` - True if company page

**workspaces** - Profile groupings
- `id` - Workspace ID
- `name` - Workspace name
- `color` - UI color

## Example Analysis Queries

### Top performing posts
```sql
SELECT author_name, LEFT(content, 100) as preview, num_likes, num_comments
FROM posts
ORDER BY num_likes DESC
LIMIT 10;
```

### Hashtag performance
```sql
SELECT
  UNNEST(REGEXP_MATCHES(content, '#(\w+)', 'g')) as hashtag,
  COUNT(*) as usage_count,
  AVG(num_likes) as avg_likes
FROM posts
GROUP BY hashtag
HAVING COUNT(*) > 5
ORDER BY avg_likes DESC
LIMIT 20;
```

### Engagement by profile
```sql
SELECT
  p.display_name,
  COUNT(*) as total_posts,
  AVG(po.num_likes) as avg_likes
FROM profiles p
JOIN posts po ON p.id = po.profile_id
GROUP BY p.id, p.display_name
ORDER BY avg_likes DESC;
```

## What You Can Do

✅ **Read** any data (SELECT queries)
✅ **Analyze** engagement patterns
✅ **Export** query results
✅ **Explore** all 1,184+ posts

## What You Cannot Do

❌ **Modify** data (INSERT/UPDATE/DELETE)
❌ **Delete** anything
❌ **Change** database structure
❌ **Create** new tables

## Troubleshooting

### "command not found: psql"
Install PostgreSQL client (see Step 3 above)

### "connection refused" or "timeout"
Check your internet connection - database is hosted on Neon cloud

### "password authentication failed"
Double-check you copied the entire connection string correctly (it's very long!)

### "permission denied"
This is expected for write operations (INSERT/UPDATE/DELETE). You have read-only access.

## Getting Help

Just ask Claude in your session:

- "How do I query the LinkedIn database?"
- "Show me the database schema"
- "What hashtags are trending?"
- "Compare engagement across profiles"

Claude has access to the full documentation and can help you write queries!

## What to Share With Claude

Once setup is complete, just tell Claude:

> "I have access to a LinkedIn analytics database via $LINKEDIN_DB environment variable. Please help me analyze the data."

Then ask your analysis questions!

---

**Questions?** Contact the person who shared this with you.

**Setup Date:** October 25, 2025
