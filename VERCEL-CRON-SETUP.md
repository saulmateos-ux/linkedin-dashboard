# Vercel Cron Job Setup Guide

## Overview

Your LinkedIn Dashboard has an automated news aggregation system that fetches articles from 15 RSS feeds every 4 hours using Vercel Cron Jobs.

**Cron Schedule**: `0 */4 * * *` (every 4 hours at minute 0)
**Endpoint**: `/api/cron/aggregate`
**Max Duration**: 300 seconds (5 minutes)

---

## Quick Fix: Re-enable Cron Jobs

### Step 1: Add CRON_SECRET to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **linkedin-dashboard**
3. Click **Settings** → **Environment Variables**
4. Add new variable:
   - **Key**: `CRON_SECRET`
   - **Value**: `cron_d428181a83719cd3234268e25a35601909dbb07d5cc4cf96779ee43ef37f290a`
   - **Environments**: Select **Production**, **Preview**, and **Development**
5. Click **Save**

### Step 2: Verify Cron Job Configuration

1. In your Vercel project, go to **Settings** → **Cron Jobs**
2. You should see:
   - **Path**: `/api/cron/aggregate`
   - **Schedule**: `0 */4 * * *`
   - **Status**: Enabled ✅
3. If it's disabled, click **Enable**

### Step 3: Redeploy

After adding the environment variable, you MUST redeploy:

**Option A: Trigger redeploy from Vercel dashboard**
1. Go to **Deployments** tab
2. Click the three dots on the latest deployment
3. Select **Redeploy** → **Use existing build cache** (faster)

**Option B: Push a small commit to trigger deployment**
```bash
git commit --allow-empty -m "Trigger redeploy for cron configuration"
git push origin main
```

### Step 4: Verify It's Working

**Check Cron Execution Logs** (after ~4 hours):
1. Vercel Dashboard → **Deployments** → Latest deployment
2. Click **View Function Logs**
3. Filter by `/api/cron/aggregate`
4. Look for `[CRON] Starting content aggregation...` messages

**Check Database** (after ~4 hours):
```bash
export LINKEDIN_DB="postgresql://claude_analyst:analyst_readonly_2025%21secure@ep-wild-flower-adh2ui1j-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
psql "$LINKEDIN_DB" -c "SELECT name, last_fetched_at FROM content_sources ORDER BY last_fetched_at DESC LIMIT 5;"
```

The `last_fetched_at` timestamps should be recent (within 4 hours).

---

## How the Cron Job Works

### Authentication Flow

1. **Vercel Cron** sends GET request to `/api/cron/aggregate`
2. Request includes header: `Authorization: Bearer {CRON_SECRET}`
3. API route verifies: `authHeader === "Bearer {CRON_SECRET}"`
4. If valid → runs aggregation
5. If invalid → returns 401 Unauthorized

### What It Does

1. **Fetches RSS Feeds** from 15 sources:
   - TechCrunch, The Verge, Wired, VentureBeat
   - ABA Journal, Above the Law, JD Supra
   - Insurance Journal, NY Personal Injury, etc.

2. **AI Analysis** (GPT-4 for each article):
   - Relevance scoring (0.0-1.0)
   - Sentiment analysis (-1.0 to 1.0)
   - Entity extraction (companies, people, products)
   - Key points generation
   - Category classification

3. **Database Storage**:
   - Saves new articles to `news_articles` table
   - Updates `last_fetched_at` for each source
   - Deduplicates by URL

### Performance

- **Time**: 2-5 minutes for ~300 articles
- **Bottleneck**: GPT-4 API calls (slow but necessary for quality)
- **Cost**: OpenAI API usage (~$0.01-0.05 per run)

---

## Troubleshooting

### Cron Not Running

**Symptom**: Articles still show "X days ago" after 4+ hours

**Checks**:
1. ✅ `CRON_SECRET` exists in Vercel environment variables (Production)
2. ✅ Cron job is enabled in Vercel settings
3. ✅ Latest deployment succeeded (no build errors)
4. ✅ `/api/cron/aggregate` route exists in production build

**Fix**: Redeploy after adding `CRON_SECRET`

### Cron Timing Out

**Symptom**: Logs show "Function execution timed out"

**Cause**:
- Too many articles to process in 5 minutes
- OpenAI API rate limits hit
- Network issues with RSS feeds

**Fixes**:
1. Reduce number of active RSS feeds temporarily
2. Increase `maxDuration` to 300s (if on Pro plan)
3. Implement batch processing (5 feeds at a time)
4. Add retry logic for failed feeds

### Authentication Errors

**Symptom**: Logs show "401 Unauthorized"

**Cause**: `CRON_SECRET` mismatch between Vercel and code

**Fix**:
1. Copy exact secret from `.env.local` line 15
2. Paste into Vercel environment variables (no extra spaces!)
3. Redeploy

### Manual Fallback

**Use the "Refresh News" button** on `/news` page:
- Triggers same aggregation endpoint
- No auth required in development
- Shows progress modal with stats
- Great for testing or emergency updates

---

## Monitoring & Alerts

### Set Up Monitoring (Recommended)

**Option 1: Vercel Log Drains**
1. Settings → Integrations → Log Drains
2. Send logs to Datadog/Sentry/Logtail
3. Set up alert: "No [CRON] messages in 5 hours"

**Option 2: Better Uptime**
1. Create free account at [betteruptime.com](https://betteruptime.com)
2. Add HTTP monitor: `https://your-domain.vercel.app/news`
3. Check keyword: Last 24 hours (detects stale data)
4. Alert via Slack/email if keyword missing

**Option 3: Simple Health Check**
```typescript
// Add to app/api/health/route.ts
export async function GET() {
  const sources = await getActiveContentSources();
  const oldestFetch = Math.min(...sources.map(s => s.last_fetched_at?.getTime() || 0));
  const hoursSinceLastFetch = (Date.now() - oldestFetch) / (1000 * 60 * 60);

  return NextResponse.json({
    status: hoursSinceLastFetch < 5 ? 'healthy' : 'stale',
    lastFetch: new Date(oldestFetch).toISOString(),
    hoursSinceLastFetch: hoursSinceLastFetch.toFixed(1)
  });
}
```

---

## Configuration Reference

### Current Settings

**File**: `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/aggregate",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

**Environment Variables** (in Vercel):
```bash
DATABASE_URL=postgresql://... (already set)
OPENAI_API_KEY=sk-proj-... (already set)
CRON_SECRET=cron_d428181a83719cd3234268e25a35601909dbb07d5cc4cf96779ee43ef37f290a (NEW!)
```

### Change Cron Schedule

Edit `vercel.json` schedule field:

```json
"schedule": "0 */2 * * *"  // Every 2 hours
"schedule": "0 8,12,16,20 * * *"  // 4 times per day (8am, 12pm, 4pm, 8pm)
"schedule": "0 */6 * * *"  // Every 6 hours
```

Then commit and push to trigger redeployment.

---

## Success Checklist

After following this guide, verify:

- [ ] `CRON_SECRET` added to Vercel environment variables (Production)
- [ ] Cron job shows as "Enabled" in Vercel settings
- [ ] Redeployment triggered and succeeded
- [ ] Function logs show no authentication errors
- [ ] Database shows recent `last_fetched_at` timestamps (within 4 hours)
- [ ] News page shows fresh articles (not "9 days ago")
- [ ] Manual "Refresh News" button works as fallback

---

## Need Help?

**Check Vercel Documentation**:
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

**Debug Locally**:
```bash
# Test the endpoint manually
curl http://localhost:3000/api/cron/aggregate

# Should return JSON with articlesProcessed count
```

**Contact Support**:
If issues persist after following this guide, check:
1. Vercel deployment logs for errors
2. OpenAI API usage/quota limits
3. RSS feed availability (some feeds may be down)

---

**Last Updated**: November 12, 2025
