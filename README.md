# LinkedIn Analytics Dashboard

A powerful Next.js dashboard for analyzing your LinkedIn posts and competitors with **AI-powered insights**. Visualize engagement trends, compare performance, and get intelligent recommendations powered by GPT-4.

![Next.js](https://img.shields.io/badge/Next.js-15.5.5-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-green)

## Features

### Dashboard Analytics
- **Real-time Statistics**: Track total posts, likes, comments, shares across all profiles
- **Engagement Charts**: Visualize performance trends over time with beautiful charts
- **Top Posts**: Identify your best-performing content instantly
- **Profile Comparison**: Compare your performance vs competitors side-by-side
- **Search & Filter**: Find specific posts quickly with powerful search
- **Workspace Organization**: Group profiles into workspaces for better tracking

### AI-Powered Insights (NEW!)
- **ChatGPT Integration**: Ask questions about your LinkedIn data in natural language
- **Trending Hashtags**: Discover what topics drive the most engagement
- **Competitive Analysis**: Get AI-powered insights on how you compare to competitors
- **Content Strategy**: Receive personalized recommendations on when and what to post
- **Semantic Understanding**: AI understands context, not just keywords

### Data Management
- **Multi-Profile Support**: Track multiple LinkedIn profiles (personal, competitors, team members, companies)
- **Team Member Tracking**: Dedicated profile type for tracking team LinkedIn activity
- **Workspace Batch Scraping**: Scrape up to 6 profiles simultaneously with one click
- **Automated Scraping**: Trigger LinkedIn data scraping directly from the dashboard
- **CSV Export**: Download your data for further analysis
- **Real-time Updates**: Data refreshes automatically with configurable caching

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Apify account (for LinkedIn scraping)
- OpenAI API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/saulmateos-ux/linkedin-dashboard.git
cd linkedin-dashboard

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Configuration

Edit `.env.local` with your credentials:

```bash
# Database (Required)
DATABASE_URL=postgresql://username:password@host.neon.tech/dbname?sslmode=require

# Apify Scraping (Required)
APIFY_API_KEY=your_apify_api_key
LINKEDIN_PROFILE_URL=https://www.linkedin.com/in/yourprofile

# OpenAI AI Assistant (Required for AI features)
OPENAI_API_KEY=sk-...your-openai-api-key...
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Run Production Server

```bash
# Build for production
npm run build

# Start production server
npm start
```

**Production mode is recommended** for better performance with Next.js caching enabled.

## Usage Guide

### 1. Dashboard Overview
Navigate to the homepage to see:
- Overall statistics across all tracked profiles
- Engagement trend chart (last 30 days)
- Top 10 performing posts
- Profile selector to filter by specific profiles

### 2. AI Insights Assistant
Click "Try the NEW AI LinkedIn Assistant!" banner or navigate to `/insights`:

**Example Questions:**
- "What are my trending hashtags this month?"
- "How do I compare to Nicolas Boucher?"
- "When is the best time to post?"
- "Show me my top 5 posts"
- "What content strategy should I focus on?"

The AI will query your database directly and provide data-driven insights in seconds.

### 3. All Posts View
Navigate to `/posts` to:
- Browse all posts with pagination
- Search by content or author name
- Sort by date, likes, comments, shares, engagement
- Filter by profile
- Export filtered results to CSV

### 4. Profile Management
Navigate to `/profiles` to:
- View all tracked profiles (personal, competitors, team members, companies)
- Add new profiles to track with automatic workspace assignment
- Browse by profile type: Own, Competitors, Inspiration, Partners, Team, Other
- Set your primary profile
- Trigger scraping for individual profiles or entire workspaces
- View per-profile statistics

### 5. Workspace Management
Navigate to `/workspaces` to:
- Create workspaces to organize profiles (e.g., "Team", "Competitors", "Personal")
- Assign custom colors for easy visual identification
- Add/remove profiles from workspaces
- View workspace-specific statistics
- Batch scrape all profiles in a workspace simultaneously (up to 6 at once)

### 6. Scraping New Data
Three ways to scrape LinkedIn posts:

**Option 1: Single Profile (From Dashboard)**
1. Go to any page with a "Refresh" button
2. Click the button
3. Configure max posts to scrape
4. Click "Start Scraping"

**Option 2: Workspace Batch Scraping (NEW!)**
1. Navigate to `/profiles?workspace=2` (select a workspace)
2. Click "Scrape Workspace" button in header
3. Confirm the number of profiles to scrape
4. All profiles scraped in parallel (6 at a time)
5. Automatic profile assignment for posts

**Option 3: API Endpoint**
```bash
# Single profile
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"maxPosts": 100, "profileId": 1}'

# Workspace batch scraping
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"maxPosts": 100, "workspaceId": 2}'
```

## AI Assistant Architecture

The AI Assistant uses **GPT-4 Function Calling** to query your database intelligently:

```
User Question → GPT-4 → Function Calls → Database Queries → Results → GPT-4 Analysis → Answer
```

### Available AI Functions

1. **get_trending_hashtags**: Discover popular hashtags (last 30 days)
2. **get_competitive_intel**: Compare all tracked profiles
3. **get_topic_performance**: See which topics drive engagement
4. **get_posting_patterns**: Find best days/times to post
5. **get_recent_activity**: Summary of last 7 days
6. **get_overall_stats**: Total posts, likes, comments, shares
7. **get_top_posts**: Highest performing posts
8. **query_database**: Custom SQL queries for complex analysis

The AI automatically selects the right function(s) based on your question, executes queries, and provides natural language insights.

## Database Schema

### Posts Table
```sql
CREATE TABLE posts (
  id TEXT PRIMARY KEY,              -- LinkedIn activity ID
  post_url TEXT UNIQUE NOT NULL,
  content TEXT,
  content_preview TEXT,
  author_name TEXT NOT NULL,        -- Full name (e.g. "Saul Mateos")
  author_username TEXT,
  published_at TIMESTAMPTZ,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  engagement_total INTEGER DEFAULT 0,
  engagement_rate FLOAT DEFAULT 0,
  hashtags JSONB,
  media_type TEXT,
  profile_id INTEGER REFERENCES profiles(id),
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Profiles Table
```sql
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  profile_url TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  profile_type TEXT DEFAULT 'own',  -- 'own', 'competitor', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Tech Stack

- **Frontend**: Next.js 15.5.5 (App Router), React 19, TailwindCSS 4
- **Backend**: Next.js API Routes, Node.js
- **Database**: Neon PostgreSQL (serverless)
- **AI**: OpenAI GPT-4 Turbo with Function Calling
- **Charts**: Recharts 3.2.1
- **Data Collection**: Apify (LinkedIn scraper)
- **Deployment**: Vercel (recommended)

## API Endpoints

### Internal API

**GET /api/export**
- Export posts as CSV
- Query params: `search`, `sortBy`, `order`

**POST /api/scrape**
- Trigger LinkedIn scraping
- Body: `{ profileId?: number, maxPosts?: number }`

**POST /api/ai-query**
- Query the AI Assistant
- Body: `{ question: string, conversationHistory?: Message[] }`

**POST /api/profiles**
- Add new profile to track
- Body: `{ profileUrl: string, displayName: string, profileType: string }`

## Performance

- **Production mode**: 1-hour data caching, ~1s page loads
- **Development mode**: No caching, instant hot reload
- **Database**: Connection pooling, optimized indexes
- **AI queries**: 3-10 seconds for complex analysis
- **Chart rendering**: Client-side React rendering

## Related Projects

This dashboard works with the [LinkedIn CLI Scraper](https://github.com/saulmateos-ux/linkedin-scraper):
- CLI handles data collection via Apify
- Dashboard provides visualization and AI analysis
- Both tools share the same Neon PostgreSQL database

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# DATABASE_URL, APIFY_API_KEY, OPENAI_API_KEY, LINKEDIN_PROFILE_URL
```

### Self-Hosted

```bash
# Build
npm run build

# Start
npm start

# Or with PM2
pm2 start npm --name "linkedin-dashboard" -- start
```

## Troubleshooting

### Dashboard loads slowly
**Solution**: Use production mode (`npm run build && npm start`). Development mode doesn't cache data.

### AI gives incorrect results
**Solution**: The AI learns from your data. Make sure you have at least 50+ posts for accurate insights.

### Author names showing as "[object Object]"
**Solution**: This was a bug in v0.1.0, fixed in v0.2.0. Re-scrape your data or run the cleanup script.

### Scraping fails
**Solution**: Check your `APIFY_API_KEY` and ensure you have Apify credits. Check Apify console for errors.

## Cost Breakdown

### Monthly Costs
- **Neon Database**: $0 (free tier: 0.5GB storage)
- **OpenAI API**: ~$0.50/month (AI queries + embeddings)
- **Apify Scraping**: ~$2/month (100 posts/day)
- **Vercel Hosting**: $0 (hobby) or $20 (pro)

**Total**: **~$3-23/month** depending on usage

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- **Issues**: [GitHub Issues](https://github.com/saulmateos-ux/linkedin-dashboard/issues)
- **Documentation**: See [CLAUDE.md](CLAUDE.md) for detailed technical docs
- **Related**: [LinkedIn CLI Scraper](https://github.com/saulmateos-ux/linkedin-scraper)

## Changelog

### v0.4.0 (October 2025)
- ✅ **Team Profile Type**: New profile type for tracking team members
- ✅ **Workspace Batch Scraping**: Scrape up to 6 profiles simultaneously
- ✅ **Workspace-Aware Profile Adding**: Auto-assign profiles to workspaces when creating
- ✅ **Navigation Persistence**: Workspace filter persists across page navigation
- ✅ **Bug Fix**: Workspace dropdown now syncs with URL params correctly
- ✅ **Bug Fix**: Navigation links preserve workspace selection

### v0.3.0 (October 2025)
- ✅ **Workspace System**: Organize profiles into workspaces
- ✅ **Company Page Support**: Track LinkedIn company pages
- ✅ **Workspace Management**: Create, edit, delete workspaces
- ✅ **Profile Assignment**: Add/remove profiles from workspaces
- ✅ **Workspace Filtering**: Filter dashboard by workspace

### v0.2.0 (October 2025)
- ✅ **AI Assistant**: ChatGPT-powered analytics with 8 intelligence functions
- ✅ **Function Calling**: Direct database queries via GPT-4
- ✅ **Fixed Author Names**: Resolved "[object Object]" bug in scraper
- ✅ **Insights Page**: New `/insights` page with chat interface
- ✅ **Suggested Questions**: 6 pre-built questions for quick insights

### v0.1.0 (October 2025)
- ✅ Dashboard with real-time stats
- ✅ Engagement charts
- ✅ Multi-profile support
- ✅ CSV export
- ✅ Neon PostgreSQL integration

---

**Built with ❤️ for better LinkedIn analytics**
