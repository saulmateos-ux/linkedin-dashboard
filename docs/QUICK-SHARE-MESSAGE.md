# Quick Share Message

Copy and paste this message to share database access:

---

## Hey! I'm giving you read-only access to my LinkedIn analytics database 📊

**What you get:**
- 1,184+ LinkedIn posts with engagement data
- 12 profiles (personal, team, competitors, companies)
- Full analytics capabilities via SQL queries

**Setup (takes 2 minutes):**

### Step 1: Open Claude Code and paste this command:

```bash
echo 'export LINKEDIN_DB="postgresql://claude_analyst:analyst_readonly_2025%21secure@ep-wild-flower-adh2ui1j-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"' >> ~/.zshrc && source ~/.zshrc
```

**Note:** The `%21` in the password is URL encoding for `!` - this is required for special characters.

### Step 2: Test it works:

```bash
psql $LINKEDIN_DB -c "SELECT COUNT(*) FROM posts;"
```

You should see: `total_posts: 1184` (or more)

### Step 3: Start asking Claude questions!

Examples:
- "What are the top 10 most liked posts in the database?"
- "Show me trending hashtags from the last 30 days"
- "Compare engagement metrics across different profiles"
- "What are the best posting times?"

**Don't have psql installed?**

Mac: `brew install postgresql`
Linux: `sudo apt-get install postgresql-client`

**Full docs:** I can send you detailed documentation if you need it, but Claude can help you with everything once the connection is set up!

**Security:** You have read-only access - you can query data but can't modify anything. 100% safe to explore.

Let me know if you hit any issues!

---
