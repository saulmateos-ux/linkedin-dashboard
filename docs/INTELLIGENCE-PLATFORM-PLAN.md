# Intelligence Platform Implementation Plan

**Version**: 1.0.0
**Created**: October 25, 2025
**Estimated Timeline**: 3-4 weeks
**Budget**: $50-100/month operational costs

---

## Executive Summary

Build a comprehensive market intelligence platform integrated with the existing LinkedIn Analytics Dashboard. This will aggregate news, company data, and industry trends from multiple sources, providing AI-powered insights organized by workspaces.

**Key Goals**:
- Multi-source news aggregation (RSS, NewsAPI, Reddit, Twitter)
- Company & topic tracking tied to workspaces
- AI-powered relevance scoring and trend detection
- Unified intelligence feed alongside LinkedIn data
- Optional Clay API integration for company enrichment
- Cost-effective at scale ($50/mo vs $300/mo for Clay-only approach)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                 User Interface Layer                     │
├─────────────────────────────────────────────────────────┤
│  Dashboard  │  Intelligence  │  Profiles  │  Workspaces │
│  (existing) │    Feed (NEW)  │ (existing) │  (existing) │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    API Layer (Next.js)                   │
├─────────────────────────────────────────────────────────┤
│  /api/intelligence/*  │  /api/topics/*  │  /api/cron/*  │
│  Articles, Analysis   │  Topic CRUD     │  Scraping Jobs│
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Intelligence Engine (lib/)                  │
├─────────────────────────────────────────────────────────┤
│  Aggregator  │  AI Analyzer  │  Entity Matcher  │  Alerts│
│  RSS+NewsAPI │  GPT-4 Scoring│  Company/Topic   │  Events│
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Data Sources (External)                     │
├─────────────────────────────────────────────────────────┤
│  RSS Feeds   │  NewsData.io  │  Reddit API  │  Clay API │
│  (Free)      │  ($29/mo)     │  (Free)      │  (As-needed)│
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Database (Neon PostgreSQL)                  │
├─────────────────────────────────────────────────────────┤
│  articles    │  topics       │  sources     │  signals   │
│  entities    │  topic_mapping│  enrichments │  alerts    │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (Week 1)

### 1.1 Database Schema

**New Tables**:

```sql
-- Topics (industries, technologies, event types)
CREATE TABLE topics (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,              -- 'industry', 'technology', 'event_type', 'keyword'
  keywords JSONB NOT NULL,                -- ["AI", "artificial intelligence", "machine learning"]
  description TEXT,
  color VARCHAR(7) DEFAULT '#3b82f6',     -- UI color
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace to Topic mapping (many-to-many)
CREATE TABLE workspace_topics (
  workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, topic_id)
);

-- Content sources configuration
CREATE TABLE content_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,              -- 'rss', 'newsapi', 'reddit', 'twitter'
  url TEXT,
  config JSONB,                           -- API keys, filters, etc.
  enabled BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  fetch_frequency_minutes INTEGER DEFAULT 240,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggregated articles from all sources
CREATE TABLE news_articles (
  id SERIAL PRIMARY KEY,

  -- Article metadata
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,                           -- Full article text (optional)
  url TEXT UNIQUE NOT NULL,
  source_id INTEGER REFERENCES content_sources(id),
  published_at TIMESTAMPTZ NOT NULL,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  author VARCHAR(255),
  image_url TEXT,

  -- Tracking relationships
  profile_id INTEGER REFERENCES profiles(id),      -- Mentions specific company/person
  workspace_id INTEGER REFERENCES workspaces(id),  -- Belongs to workspace
  topic_ids INTEGER[],                             -- Related topics

  -- AI-generated metadata
  relevance_score DECIMAL(3,2),          -- 0.00 to 1.00
  sentiment_score DECIMAL(3,2),          -- -1.00 to 1.00
  category VARCHAR(100),                 -- 'funding', 'product_launch', 'partnership', etc.
  entities JSONB,                        -- {"companies": ["OpenAI"], "people": ["Sam Altman"]}
  key_points JSONB,                      -- AI-extracted bullet points

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intelligence signals (high-value events detected by AI)
CREATE TABLE intelligence_signals (
  id SERIAL PRIMARY KEY,
  signal_type VARCHAR(100) NOT NULL,     -- 'funding_round', 'product_launch', 'hiring_spike'
  title TEXT NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'

  -- Relationships
  article_id INTEGER REFERENCES news_articles(id),
  profile_id INTEGER REFERENCES profiles(id),
  workspace_id INTEGER REFERENCES workspaces(id),

  -- Metadata
  metadata JSONB,                        -- Signal-specific data
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ
);

-- Entity mentions tracking (companies/people in articles)
CREATE TABLE article_entities (
  article_id INTEGER REFERENCES news_articles(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,      -- 'company', 'person', 'product'
  entity_name VARCHAR(255) NOT NULL,
  profile_id INTEGER REFERENCES profiles(id),
  confidence_score DECIMAL(3,2),         -- 0.00 to 1.00
  PRIMARY KEY (article_id, entity_type, entity_name)
);

-- Indexes for performance
CREATE INDEX idx_articles_workspace ON news_articles(workspace_id);
CREATE INDEX idx_articles_profile ON news_articles(profile_id);
CREATE INDEX idx_articles_published ON news_articles(published_at DESC);
CREATE INDEX idx_articles_relevance ON news_articles(relevance_score DESC);
CREATE INDEX idx_articles_topics ON news_articles USING GIN(topic_ids);
CREATE INDEX idx_articles_entities ON news_articles USING GIN(entities);
CREATE INDEX idx_signals_workspace ON intelligence_signals(workspace_id);
CREATE INDEX idx_signals_priority ON intelligence_signals(priority, detected_at DESC);
```

**Database Migration File**: `migrations/001_intelligence_platform.sql`

---

### 1.2 Core Library Functions

**File**: `lib/intelligence.ts`

```typescript
// Types
interface Topic {
  id: number;
  name: string;
  type: 'industry' | 'technology' | 'event_type' | 'keyword';
  keywords: string[];
  description?: string;
  color: string;
}

interface NewsArticle {
  id: number;
  title: string;
  description?: string;
  content?: string;
  url: string;
  source_id: number;
  published_at: Date;
  author?: string;
  image_url?: string;
  profile_id?: number;
  workspace_id?: number;
  topic_ids: number[];
  relevance_score?: number;
  sentiment_score?: number;
  category?: string;
  entities?: {
    companies?: string[];
    people?: string[];
    products?: string[];
  };
  key_points?: string[];
}

interface ContentSource {
  id: number;
  name: string;
  type: 'rss' | 'newsapi' | 'reddit' | 'twitter';
  url?: string;
  config: Record<string, any>;
  enabled: boolean;
  fetch_frequency_minutes: number;
}

interface IntelligenceSignal {
  id: number;
  signal_type: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  article_id?: number;
  profile_id?: number;
  workspace_id?: number;
  metadata?: Record<string, any>;
  detected_at: Date;
  acknowledged: boolean;
}

// Topic Management
export async function getTopics(): Promise<Topic[]>;
export async function getTopic(id: number): Promise<Topic | null>;
export async function createTopic(data: Partial<Topic>): Promise<Topic>;
export async function updateTopic(id: number, data: Partial<Topic>): Promise<Topic>;
export async function deleteTopic(id: number): Promise<boolean>;

// Workspace Topic Management
export async function getWorkspaceTopics(workspaceId: number): Promise<Topic[]>;
export async function addTopicToWorkspace(workspaceId: number, topicId: number): Promise<void>;
export async function removeTopicFromWorkspace(workspaceId: number, topicId: number): Promise<boolean>;

// Content Source Management
export async function getContentSources(): Promise<ContentSource[]>;
export async function getActiveContentSources(): Promise<ContentSource[]>;
export async function createContentSource(data: Partial<ContentSource>): Promise<ContentSource>;
export async function updateContentSource(id: number, data: Partial<ContentSource>): Promise<ContentSource>;

// Article CRUD
export async function getArticles(options: {
  workspaceId?: number;
  profileId?: number;
  topicIds?: number[];
  limit?: number;
  offset?: number;
  minRelevanceScore?: number;
  category?: string;
  dateFrom?: Date;
}): Promise<{ articles: NewsArticle[]; total: number }>;

export async function getArticle(id: number): Promise<NewsArticle | null>;
export async function saveArticle(article: Partial<NewsArticle>): Promise<NewsArticle>;
export async function updateArticle(id: number, data: Partial<NewsArticle>): Promise<NewsArticle>;

// Intelligence Signals
export async function getSignals(workspaceId?: number, acknowledged?: boolean): Promise<IntelligenceSignal[]>;
export async function createSignal(signal: Partial<IntelligenceSignal>): Promise<IntelligenceSignal>;
export async function acknowledgeSignal(id: number): Promise<void>;
```

---

### 1.3 Content Aggregation Engine

**File**: `lib/aggregators/index.ts`

```typescript
// Master aggregation function
export async function aggregateContent(): Promise<void> {
  const sources = await getActiveContentSources();

  for (const source of sources) {
    try {
      let articles: NewsArticle[] = [];

      switch (source.type) {
        case 'rss':
          articles = await aggregateRSS(source);
          break;
        case 'newsapi':
          articles = await aggregateNewsAPI(source);
          break;
        case 'reddit':
          articles = await aggregateReddit(source);
          break;
        case 'twitter':
          articles = await aggregateTwitter(source);
          break;
      }

      // Process and save articles
      for (const article of articles) {
        await processArticle(article);
      }

      // Update last fetched timestamp
      await updateContentSource(source.id, {
        last_fetched_at: new Date()
      });

    } catch (error) {
      console.error(`Failed to aggregate from ${source.name}:`, error);
    }
  }
}

// Process article: match to workspaces/profiles, analyze with AI
async function processArticle(article: NewsArticle): Promise<void> {
  // 1. Match to profiles (companies/people mentioned)
  const profiles = await matchProfilesToArticle(article);

  // 2. Match to topics
  const topics = await matchTopicsToArticle(article);

  // 3. AI analysis (relevance, sentiment, entities)
  const analysis = await analyzeArticleWithAI(article, profiles, topics);

  // 4. Save article with enriched data
  await saveArticle({
    ...article,
    profile_id: profiles[0]?.id,
    topic_ids: topics.map(t => t.id),
    ...analysis
  });

  // 5. Detect intelligence signals
  await detectSignals(article, analysis);
}
```

**File**: `lib/aggregators/rss.ts`

```typescript
import Parser from 'rss-parser';

const RSS_SOURCES = {
  techcrunch: 'https://techcrunch.com/feed/',
  venturebeat: 'https://venturebeat.com/feed/',
  theverge: 'https://www.theverge.com/rss/index.xml',
  wired: 'https://www.wired.com/feed/rss',
  aiNews: 'https://www.artificialintelligence-news.com/feed/',
  // Add more sources
};

export async function aggregateRSS(source: ContentSource): Promise<NewsArticle[]> {
  const parser = new Parser();
  const feed = await parser.parseURL(source.url!);

  const articles: NewsArticle[] = [];

  for (const item of feed.items) {
    articles.push({
      title: item.title || '',
      description: item.contentSnippet || '',
      url: item.link || '',
      source_id: source.id,
      published_at: new Date(item.pubDate || Date.now()),
      author: item.creator || null,
      image_url: item.enclosure?.url || null,
    });
  }

  return articles;
}
```

**File**: `lib/aggregators/newsapi.ts`

```typescript
export async function aggregateNewsAPI(source: ContentSource): Promise<NewsArticle[]> {
  const apiKey = source.config.apiKey || process.env.NEWSDATA_API_KEY;
  const query = source.config.query || '';

  const url = `https://newsdata.io/api/1/news?` +
    `apikey=${apiKey}&` +
    `q=${encodeURIComponent(query)}&` +
    `language=en`;

  const response = await fetch(url);
  const data = await response.json();

  return data.results.map((item: any) => ({
    title: item.title,
    description: item.description,
    content: item.content,
    url: item.link,
    source_id: source.id,
    published_at: new Date(item.pubDate),
    author: item.creator?.[0],
    image_url: item.image_url,
  }));
}
```

---

### 1.4 AI Analysis Engine

**File**: `lib/ai/article-analyzer.ts`

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeArticleWithAI(
  article: NewsArticle,
  profiles: Profile[],
  topics: Topic[]
): Promise<{
  relevance_score: number;
  sentiment_score: number;
  category: string;
  entities: { companies: string[]; people: string[]; products: string[] };
  key_points: string[];
}> {
  const prompt = `Analyze this news article:

Title: ${article.title}
Description: ${article.description}

Context:
- Tracked companies: ${profiles.map(p => p.display_name).join(', ')}
- Tracked topics: ${topics.map(t => t.name).join(', ')}

Extract the following information and return as JSON:

{
  "relevance_score": 0.85,  // 0.00-1.00: How relevant to tracked companies/topics
  "sentiment_score": 0.3,   // -1.00 to 1.00: Negative to positive sentiment
  "category": "funding",    // funding, product_launch, partnership, hiring, regulation, acquisition, other
  "entities": {
    "companies": ["OpenAI", "Microsoft"],
    "people": ["Sam Altman"],
    "products": ["GPT-4"]
  },
  "key_points": [
    "OpenAI raised $6.6B in Series C",
    "Led by Thrive Capital",
    "Valuation reaches $157B"
  ]
}

Only include entities explicitly mentioned in the article.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  return JSON.parse(response.choices[0].message.content!);
}

// Batch analysis for efficiency (process multiple articles at once)
export async function batchAnalyzeArticles(
  articles: NewsArticle[],
  profiles: Profile[],
  topics: Topic[]
): Promise<Map<string, any>> {
  // Process in batches of 10 to optimize GPT-4 calls
  const batchSize = 10;
  const results = new Map();

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    const prompt = buildBatchPrompt(batch, profiles, topics);

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const batchResults = JSON.parse(response.choices[0].message.content!);

    batch.forEach((article, idx) => {
      results.set(article.url, batchResults[idx]);
    });
  }

  return results;
}
```

**File**: `lib/ai/signal-detector.ts`

```typescript
// Detect high-value intelligence signals
export async function detectSignals(
  article: NewsArticle,
  analysis: any
): Promise<void> {
  const signals: IntelligenceSignal[] = [];

  // Funding detection
  if (analysis.category === 'funding') {
    const fundingAmount = extractFundingAmount(article.title, article.description);
    if (fundingAmount && fundingAmount > 10_000_000) {
      signals.push({
        signal_type: 'major_funding',
        title: `${analysis.entities.companies[0]} raised $${fundingAmount / 1_000_000}M`,
        priority: fundingAmount > 100_000_000 ? 'critical' : 'high',
        article_id: article.id,
        metadata: { amount: fundingAmount },
      });
    }
  }

  // Product launch detection
  if (analysis.category === 'product_launch') {
    signals.push({
      signal_type: 'product_launch',
      title: `New product: ${analysis.entities.products[0]}`,
      priority: 'medium',
      article_id: article.id,
    });
  }

  // Leadership change
  if (article.title.match(/CEO|founder|appoints|joins/i)) {
    signals.push({
      signal_type: 'leadership_change',
      title: `Leadership change at ${analysis.entities.companies[0]}`,
      priority: 'medium',
      article_id: article.id,
    });
  }

  // Save all detected signals
  for (const signal of signals) {
    await createSignal(signal);
  }
}

function extractFundingAmount(title: string, description?: string): number | null {
  const text = `${title} ${description}`.toLowerCase();

  // Match patterns like "$10M", "$100 million", "raised 50m"
  const patterns = [
    /\$(\d+(?:\.\d+)?)\s*(?:million|m\b)/i,
    /\$(\d+(?:\.\d+)?)\s*(?:billion|b\b)/i,
    /raised\s+(\d+(?:\.\d+)?)\s*(?:million|m\b)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1]);
      if (text.includes('billion') || text.includes('b')) {
        return amount * 1_000_000_000;
      }
      return amount * 1_000_000;
    }
  }

  return null;
}
```

---

## Phase 2: API Layer (Week 2)

### 2.1 Topics API

**File**: `app/api/topics/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getTopics, createTopic } from '@/lib/intelligence';

// GET /api/topics - List all topics
export async function GET() {
  try {
    const topics = await getTopics();
    return NextResponse.json(topics);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}

// POST /api/topics - Create new topic
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, keywords, description, color } = body;

    // Validation
    if (!name || !type || !keywords) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const topic = await createTopic({
      name,
      type,
      keywords,
      description,
      color: color || '#3b82f6',
    });

    return NextResponse.json(topic);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create topic' },
      { status: 500 }
    );
  }
}
```

**File**: `app/api/topics/[id]/route.ts`

```typescript
// GET /api/topics/[id] - Get single topic
// PATCH /api/topics/[id] - Update topic
// DELETE /api/topics/[id] - Delete topic
```

**File**: `app/api/workspaces/[id]/topics/route.ts`

```typescript
// GET /api/workspaces/[id]/topics - List workspace topics
// POST /api/workspaces/[id]/topics - Add topic to workspace
// DELETE /api/workspaces/[id]/topics?topicId=X - Remove topic
```

---

### 2.2 Intelligence API

**File**: `app/api/intelligence/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getArticles } from '@/lib/intelligence';

// GET /api/intelligence - Get intelligence feed
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const workspaceId = searchParams.get('workspaceId');
    const profileId = searchParams.get('profileId');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const options: any = { limit, offset };

    if (workspaceId) options.workspaceId = parseInt(workspaceId);
    if (profileId) options.profileId = parseInt(profileId);
    if (category) options.category = category;

    // Only show high-relevance articles
    options.minRelevanceScore = 0.6;

    const result = await getArticles(options);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch intelligence' },
      { status: 500 }
    );
  }
}
```

**File**: `app/api/intelligence/signals/route.ts`

```typescript
// GET /api/intelligence/signals - Get intelligence signals
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');
  const acknowledged = searchParams.get('acknowledged') === 'true';

  const signals = await getSignals(
    workspaceId ? parseInt(workspaceId) : undefined,
    acknowledged
  );

  return NextResponse.json(signals);
}

// PATCH /api/intelligence/signals/[id] - Acknowledge signal
```

---

### 2.3 Cron Jobs for Aggregation

**File**: `app/api/cron/aggregate/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { aggregateContent } from '@/lib/aggregators';

// GET /api/cron/aggregate - Run content aggregation
export async function GET(request: Request) {
  // Verify cron secret (Vercel Cron)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await aggregateContent();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Aggregation failed:', error);
    return NextResponse.json(
      { error: 'Aggregation failed' },
      { status: 500 }
    );
  }
}
```

**Configure in `vercel.json`**:

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

---

## Phase 3: User Interface (Week 3)

### 3.1 Intelligence Feed Page

**File**: `app/intelligence/page.tsx`

```typescript
import { getArticles, getSignals } from '@/lib/intelligence';
import IntelligenceFeed from '@/components/IntelligenceFeed';
import SignalsPanel from '@/components/SignalsPanel';

export default async function IntelligencePage({
  searchParams,
}: {
  searchParams: { workspace?: string; category?: string };
}) {
  const params = await searchParams;
  const workspaceId = params.workspace ? parseInt(params.workspace) : null;
  const category = params.category;

  // Fetch articles and signals
  const { articles, total } = await getArticles({
    workspaceId: workspaceId || undefined,
    category: category || undefined,
    limit: 50,
    minRelevanceScore: 0.6,
  });

  const signals = await getSignals(workspaceId || undefined, false);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Market Intelligence</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Main feed (2/3 width) */}
        <div className="col-span-2">
          <IntelligenceFeed articles={articles} />
        </div>

        {/* Signals sidebar (1/3 width) */}
        <div>
          <SignalsPanel signals={signals} />
        </div>
      </div>
    </div>
  );
}
```

---

### 3.2 Intelligence Feed Component

**File**: `components/IntelligenceFeed.tsx`

```typescript
'use client';

import { NewsArticle } from '@/lib/intelligence';
import { formatDistanceToNow } from 'date-fns';

export default function IntelligenceFeed({
  articles,
}: {
  articles: NewsArticle[];
}) {
  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}

function ArticleCard({ article }: { article: NewsArticle }) {
  const sentimentColor =
    article.sentiment_score > 0.3
      ? 'bg-green-100 text-green-800'
      : article.sentiment_score < -0.3
      ? 'bg-red-100 text-red-800'
      : 'bg-gray-100 text-gray-800';

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {article.image_url && (
          <img
            src={article.image_url}
            alt=""
            className="w-32 h-32 object-cover rounded"
          />
        )}

        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600"
            >
              {article.title}
            </a>
          </h3>

          <p className="text-gray-600 text-sm mb-3">{article.description}</p>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span>{article.source_id}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(article.published_at))} ago</span>
            {article.author && (
              <>
                <span>•</span>
                <span>by {article.author}</span>
              </>
            )}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {article.category && (
              <span className={`px-2 py-1 rounded text-xs ${sentimentColor}`}>
                {article.category}
              </span>
            )}

            {article.relevance_score && (
              <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                {Math.round(article.relevance_score * 100)}% relevant
              </span>
            )}

            {article.entities?.companies?.slice(0, 3).map((company) => (
              <span
                key={company}
                className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800"
              >
                {company}
              </span>
            ))}
          </div>

          {/* Key points */}
          {article.key_points && article.key_points.length > 0 && (
            <ul className="mt-3 text-sm space-y-1">
              {article.key_points.map((point, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-600">→</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### 3.3 Signals Panel Component

**File**: `components/SignalsPanel.tsx`

```typescript
'use client';

import { IntelligenceSignal } from '@/lib/intelligence';
import { formatDistanceToNow } from 'date-fns';

export default function SignalsPanel({
  signals,
}: {
  signals: IntelligenceSignal[];
}) {
  const priorityColors = {
    critical: 'bg-red-100 border-red-500 text-red-900',
    high: 'bg-orange-100 border-orange-500 text-orange-900',
    medium: 'bg-yellow-100 border-yellow-500 text-yellow-900',
    low: 'bg-blue-100 border-blue-500 text-blue-900',
  };

  return (
    <div className="sticky top-6">
      <h2 className="text-xl font-bold mb-4">🚨 Intelligence Signals</h2>

      <div className="space-y-3">
        {signals.map((signal) => (
          <div
            key={signal.id}
            className={`border-l-4 rounded p-3 ${
              priorityColors[signal.priority]
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <span className="font-semibold text-sm">{signal.title}</span>
              <span className="text-xs uppercase font-bold">
                {signal.priority}
              </span>
            </div>

            {signal.description && (
              <p className="text-xs mb-2">{signal.description}</p>
            )}

            <div className="text-xs opacity-75">
              {formatDistanceToNow(new Date(signal.detected_at))} ago
            </div>

            <button
              className="mt-2 text-xs underline"
              onClick={() => acknowledgeSignal(signal.id)}
            >
              Acknowledge
            </button>
          </div>
        ))}

        {signals.length === 0 && (
          <p className="text-gray-500 text-sm">No new signals</p>
        )}
      </div>
    </div>
  );
}

async function acknowledgeSignal(id: number) {
  await fetch(`/api/intelligence/signals/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ acknowledged: true }),
  });

  // Refresh page
  window.location.reload();
}
```

---

### 3.4 Topic Management Page

**File**: `app/topics/page.tsx`

```typescript
import { getTopics } from '@/lib/intelligence';
import TopicsList from '@/components/TopicsList';
import AddTopicModal from '@/components/AddTopicModal';

export default async function TopicsPage() {
  const topics = await getTopics();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Topics & Industries</h1>
        <AddTopicModal />
      </div>

      <TopicsList topics={topics} />
    </div>
  );
}
```

**File**: `components/TopicsList.tsx`

```typescript
'use client';

import { Topic } from '@/lib/intelligence';

export default function TopicsList({ topics }: { topics: Topic[] }) {
  const topicsByType = topics.reduce((acc, topic) => {
    if (!acc[topic.type]) acc[topic.type] = [];
    acc[topic.type].push(topic);
    return acc;
  }, {} as Record<string, Topic[]>);

  return (
    <div className="space-y-8">
      {Object.entries(topicsByType).map(([type, topics]) => (
        <div key={type}>
          <h2 className="text-xl font-semibold mb-4 capitalize">
            {type.replace('_', ' ')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TopicCard({ topic }: { topic: Topic }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold" style={{ color: topic.color }}>
          {topic.name}
        </h3>
        <div className="flex gap-2">
          <button className="text-sm text-blue-600 hover:underline">
            Edit
          </button>
          <button className="text-sm text-red-600 hover:underline">
            Delete
          </button>
        </div>
      </div>

      {topic.description && (
        <p className="text-sm text-gray-600 mb-2">{topic.description}</p>
      )}

      <div className="flex flex-wrap gap-1 mt-2">
        {topic.keywords.slice(0, 5).map((keyword) => (
          <span
            key={keyword}
            className="px-2 py-1 bg-gray-100 rounded text-xs"
          >
            {keyword}
          </span>
        ))}
        {topic.keywords.length > 5 && (
          <span className="px-2 py-1 text-xs text-gray-500">
            +{topic.keywords.length - 5} more
          </span>
        )}
      </div>
    </div>
  );
}
```

---

### 3.5 Workspace Integration

**Update**: `app/page.tsx` (Dashboard)

```typescript
// Add intelligence summary to dashboard

const { articles: recentArticles } = await getArticles({
  workspaceId: workspaceId || undefined,
  limit: 5,
  minRelevanceScore: 0.7,
});

const signals = await getSignals(workspaceId || undefined, false);

// Show in dashboard:
// - Recent high-value articles (top 5)
// - Unacknowledged signals count
// - Trending topics this week
```

**Update**: `components/WorkspaceAwareNav.tsx`

```typescript
// Add "Intelligence" link to navigation
<Link href={`/intelligence${workspaceParam}`}>Intelligence</Link>
```

---

## Phase 4: Advanced Features (Week 4)

### 4.1 Clay API Integration (Optional)

**File**: `lib/enrichment/clay.ts`

```typescript
// When new company appears in news, enrich via Clay API
export async function enrichCompanyWithClay(companyName: string) {
  // 1. Check if already enriched (within 90 days)
  const existing = await getProfileByName(companyName);
  if (existing && wasEnrichedRecently(existing)) {
    return existing;
  }

  // 2. Call Clay API for enrichment
  const clayData = await callClayAPI(companyName);

  // 3. Save enriched data
  const profile = await createProfile({
    display_name: companyName,
    profile_type: 'other',
    metadata: clayData,
  });

  return profile;
}

async function callClayAPI(companyName: string) {
  // Clay API integration
  // Returns: employee count, funding, tech stack, etc.
}
```

---

### 4.2 Trend Analysis

**File**: `lib/analytics/trends.ts`

```typescript
// Detect trending topics over time
export async function getTrendingTopics(days: number = 7): Promise<any[]> {
  const result = await sql`
    SELECT
      t.id,
      t.name,
      COUNT(a.id) as mention_count,
      AVG(a.relevance_score) as avg_relevance
    FROM topics t
    LEFT JOIN news_articles a ON t.id = ANY(a.topic_ids)
    WHERE a.published_at > NOW() - INTERVAL '${days} days'
    GROUP BY t.id, t.name
    ORDER BY mention_count DESC
    LIMIT 10
  `;

  return result.rows;
}

// Detect momentum (topic mentions increasing)
export async function getTopicMomentum(topicId: number): Promise<any> {
  const lastWeek = await getTopicMentions(topicId, 7);
  const previousWeek = await getTopicMentions(topicId, 14, 7);

  const percentChange = ((lastWeek - previousWeek) / previousWeek) * 100;

  return {
    topicId,
    lastWeek,
    previousWeek,
    percentChange,
    trending: percentChange > 20,
  };
}
```

---

### 4.3 Smart Alerts

**File**: `lib/alerts/notifier.ts`

```typescript
// Send email/Slack notifications for critical signals
export async function sendAlert(signal: IntelligenceSignal) {
  if (signal.priority === 'critical' || signal.priority === 'high') {
    // Send email via Resend
    await sendEmail({
      to: process.env.ALERT_EMAIL!,
      subject: `🚨 ${signal.title}`,
      body: signal.description,
    });

    // Optional: Send to Slack
    if (process.env.SLACK_WEBHOOK_URL) {
      await sendSlackMessage({
        text: `*${signal.title}*\n${signal.description}`,
        webhook: process.env.SLACK_WEBHOOK_URL,
      });
    }
  }
}
```

---

### 4.4 Export Intelligence Reports

**File**: `app/api/intelligence/export/route.ts`

```typescript
// GET /api/intelligence/export?workspaceId=X&format=csv
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');
  const format = searchParams.get('format') || 'csv';

  const { articles } = await getArticles({
    workspaceId: workspaceId ? parseInt(workspaceId) : undefined,
    limit: 1000,
  });

  if (format === 'csv') {
    const csv = generateCSV(articles);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="intelligence-report.csv"',
      },
    });
  }

  // PDF export, etc.
}
```

---

## Testing & Validation

### Unit Tests

**File**: `__tests__/intelligence.test.ts`

```typescript
describe('Intelligence Engine', () => {
  test('aggregates RSS feeds correctly', async () => {
    const articles = await aggregateRSS(mockSource);
    expect(articles.length).toBeGreaterThan(0);
    expect(articles[0].title).toBeDefined();
  });

  test('AI analysis extracts entities', async () => {
    const analysis = await analyzeArticleWithAI(mockArticle, [], []);
    expect(analysis.entities.companies).toContain('OpenAI');
  });

  test('detects funding signals', async () => {
    const article = { title: 'OpenAI raises $6.6B Series C' };
    await detectSignals(article, mockAnalysis);
    const signals = await getSignals();
    expect(signals[0].signal_type).toBe('major_funding');
  });
});
```

---

## Deployment Checklist

### Environment Variables

```bash
# .env.local
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
NEWSDATA_API_KEY=...
CRON_SECRET=...

# Optional
CLAY_API_KEY=...
SLACK_WEBHOOK_URL=...
ALERT_EMAIL=...
```

### Vercel Configuration

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

### Database Migration

```bash
# Run migration
psql $DATABASE_URL -f migrations/001_intelligence_platform.sql

# Seed initial content sources
psql $DATABASE_URL -c "
INSERT INTO content_sources (name, type, url, enabled) VALUES
  ('TechCrunch', 'rss', 'https://techcrunch.com/feed/', true),
  ('VentureBeat', 'rss', 'https://venturebeat.com/feed/', true),
  ('NewsData.io', 'newsapi', null, true);
"
```

---

## Cost Breakdown

### Monthly Operational Costs

| Service | Tier | Cost | Usage |
|---------|------|------|-------|
| **NewsData.io** | Developer | $29 | 10k articles/day |
| **OpenAI GPT-4** | Pay-as-you-go | $20-40 | AI analysis |
| **Neon PostgreSQL** | Free/Pro | $0-19 | Database |
| **Vercel** | Hobby/Pro | $0-20 | Hosting |
| **Clay API** (optional) | Pay-per-use | $5-15 | Company enrichment |
| **Total** | | **$54-123** | Full platform |

**vs Clay-only approach**: $300/mo

**Savings**: 60-82%

---

## Success Metrics

### Week 1 (Foundation)
- ✅ Database schema deployed
- ✅ RSS aggregation working
- ✅ NewsData.io integration active
- ✅ AI analysis functional
- **Target**: 500+ articles aggregated

### Week 2 (APIs)
- ✅ All API endpoints functional
- ✅ Topics CRUD working
- ✅ Workspace integration complete
- ✅ Cron jobs running
- **Target**: 2,000+ articles with analysis

### Week 3 (UI)
- ✅ Intelligence feed page live
- ✅ Signals panel showing alerts
- ✅ Topic management working
- ✅ Dashboard integration
- **Target**: User can view curated intelligence

### Week 4 (Advanced)
- ✅ Trend analysis functional
- ✅ Smart alerts sending
- ✅ Export reports working
- ✅ Clay integration (optional)
- **Target**: Platform generating actionable insights

---

## Future Enhancements

### Phase 5: Additional Sources
- Twitter/X API integration
- Reddit discussion tracking
- Hacker News monitoring
- GitHub activity (stars, releases)
- Product Hunt launches
- Patent filings

### Phase 6: Advanced AI
- Predictive intelligence (forecast trends)
- Competitive analysis reports
- Automated briefings (daily/weekly summaries)
- Custom AI agents per workspace

### Phase 7: Collaboration
- Team workspaces
- Shared intelligence boards
- Comments and annotations
- Alert routing by role

---

## Documentation Updates

After implementation, update:

1. **CLAUDE.md** - Add Intelligence Platform section
2. **TECHNICAL-REFERENCE.md** - Document new tables and APIs
3. **README.md** - Update feature list
4. **API docs** - Add intelligence endpoints

---

## Support & Troubleshooting

### Common Issues

**Low relevance scores**:
- Review AI analysis prompts
- Check keyword matching logic
- Validate topic configurations

**High GPT-4 costs**:
- Implement batch processing
- Cache analysis results
- Filter articles before AI analysis

**Missing articles**:
- Check content source status
- Verify cron jobs running
- Review fetch frequency settings

**Slow performance**:
- Add database indexes
- Implement pagination
- Cache frequently accessed data

---

**End of Implementation Plan**

This plan provides a complete roadmap for building the intelligence platform. Ready to execute when you give the go-ahead!
