# Database Connection Troubleshooting

## "Password authentication failed" Error

**Problem:** Connection fails with authentication error even though credentials are correct.

**Cause:** The password contains a `!` character which needs to be URL-encoded.

**Solution:** Use the URL-encoded connection string where `!` is replaced with `%21`:

```bash
# ❌ WRONG - Will fail with auth error
postgresql://claude_analyst:analyst_readonly_2025!secure@ep-wild-flower-adh2ui1j-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# ✅ CORRECT - Works properly
postgresql://claude_analyst:analyst_readonly_2025%21secure@ep-wild-flower-adh2ui1j-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Quick fix:** Replace `!` with `%21` in any connection string you're using.

## Common Special Characters in URLs

If you see other special characters in passwords, here's how to encode them:

| Character | URL Encoding |
|-----------|--------------|
| `!` | `%21` |
| `@` | `%40` |
| `#` | `%23` |
| `$` | `%24` |
| `%` | `%25` |
| `&` | `%26` |
| `:` | `%3A` |
| `/` | `%2F` |
| `?` | `%3F` |

## Testing the Connection

Use this command to verify your connection works:

```bash
psql "postgresql://claude_analyst:analyst_readonly_2025%21secure@ep-wild-flower-adh2ui1j-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT COUNT(*) FROM posts;"
```

Expected output:
```
count
-------
  1184
(1 row)
```

## Other Common Issues

### "command not found: psql"

**Solution:** Install PostgreSQL client

**Mac:**
```bash
brew install postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-client
```

### "connection timeout"

**Cause:** Network issue or firewall blocking port 5432

**Solutions:**
1. Check your internet connection
2. Verify outbound connections to port 5432 are allowed
3. Try from a different network

### "SSL connection required"

**Cause:** Missing `sslmode=require` parameter

**Solution:** Always include `?sslmode=require` at the end of the connection string

### "permission denied for table"

**This is expected!** You have read-only access. This error appears when trying:
- INSERT
- UPDATE
- DELETE
- CREATE
- ALTER
- DROP

You can only run SELECT queries.

## Still Having Issues?

1. **Verify you copied the entire connection string** (it's very long!)
2. **Check for extra spaces** before or after the connection string
3. **Ensure you're using the URL-encoded version** (`%21` not `!`)
4. **Test with the simple SELECT COUNT query** above

If still not working, contact the person who shared the database with you.

---

**Last Updated:** October 25, 2025
