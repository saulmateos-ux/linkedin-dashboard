# ✅ Copy-Paste This (Guaranteed to Work!)

Send this message to anyone you want to give database access to:

---

## 🎯 LinkedIn Analytics Database Access

I'm sharing read-only access to my LinkedIn analytics database with you!

**What's inside:**
- 1,184+ LinkedIn posts with full engagement metrics
- 12 tracked profiles (personal, team, competitors, companies)
- 4 organized workspaces

### 🚀 Quick Setup (2 minutes)

**Step 1:** Open Claude Code and run this:

```bash
echo 'export LINKEDIN_DB="postgresql://claude_analyst:analyst_readonly_2025%21secure@ep-wild-flower-adh2ui1j-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"' >> ~/.zshrc && source ~/.zshrc
```

**Step 2:** Test the connection:

```bash
psql $LINKEDIN_DB -c "SELECT COUNT(*) FROM posts;"
```

You should see: `count: 1184` (or more)

**Step 3:** Start analyzing! Ask Claude things like:

- "Show me the top 10 most engaging posts"
- "What are the trending hashtags?"
- "Compare engagement across different profiles"
- "What are the best posting times?"

### 📦 Need PostgreSQL client?

If you get "command not found: psql", install it:

**Mac:** `brew install postgresql`
**Linux:** `sudo apt-get install postgresql-client`

### ⚠️ Important Note

The `%21` in the connection string is URL encoding for `!` - **don't remove it!** It's required for the password to work correctly.

### 🔐 Security

- You have **read-only** access (SELECT queries only)
- You **cannot** modify any data (INSERT/UPDATE/DELETE blocked)
- Connection is encrypted via SSL/TLS
- 100% safe to explore!

### 📚 Example Queries

```bash
# Top posts by engagement
psql $LINKEDIN_DB -c "SELECT author_name, LEFT(content, 80), num_likes FROM posts ORDER BY num_likes DESC LIMIT 10;"

# View all profiles
psql $LINKEDIN_DB -c "SELECT display_name, profile_type FROM profiles;"

# Trending hashtags
psql $LINKEDIN_DB -c "SELECT UNNEST(REGEXP_MATCHES(content, '#(\w+)', 'g')) as hashtag, COUNT(*) FROM posts GROUP BY hashtag ORDER BY count DESC LIMIT 20;"
```

### 🆘 Troubleshooting

**"Password authentication failed"**
Make sure you used the connection string with `%21` (not `!`)

**"Command not found: psql"**
Install PostgreSQL client (see above)

**Other issues?**
Message me!

### 💡 Pro Tip

Once set up, just tell Claude:

> "I have access to a LinkedIn analytics database via $LINKEDIN_DB. Help me analyze engagement patterns."

Claude will guide you through everything!

---

**Questions?** Just message me!

---
