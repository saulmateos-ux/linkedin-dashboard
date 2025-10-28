-- Intelligence Platform Database Schema
-- Version: 1.0.0
-- Created: October 25, 2025

-- ============================================
-- TOPICS TABLE
-- ============================================
-- Topics (industries, technologies, event types)
CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,              -- 'industry', 'technology', 'event_type', 'keyword'
  keywords JSONB NOT NULL,                -- ["AI", "artificial intelligence", "machine learning"]
  description TEXT,
  color VARCHAR(7) DEFAULT '#3b82f6',     -- UI color
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_topics_type ON topics(type);

-- ============================================
-- WORKSPACE TOPICS MAPPING
-- ============================================
-- Workspace to Topic mapping (many-to-many)
CREATE TABLE IF NOT EXISTS workspace_topics (
  workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, topic_id)
);

-- ============================================
-- CONTENT SOURCES
-- ============================================
-- Content sources configuration (RSS feeds, NewsAPI, etc.)
CREATE TABLE IF NOT EXISTS content_sources (
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

CREATE INDEX idx_sources_enabled ON content_sources(enabled);
CREATE INDEX idx_sources_type ON content_sources(type);

-- ============================================
-- NEWS ARTICLES
-- ============================================
-- Aggregated articles from all sources
CREATE TABLE IF NOT EXISTS news_articles (
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
  profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,      -- Mentions specific company/person
  workspace_id INTEGER REFERENCES workspaces(id) ON DELETE SET NULL,  -- Belongs to workspace
  topic_ids INTEGER[],                                                -- Related topics

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

-- Indexes for performance
CREATE INDEX idx_articles_workspace ON news_articles(workspace_id);
CREATE INDEX idx_articles_profile ON news_articles(profile_id);
CREATE INDEX idx_articles_published ON news_articles(published_at DESC);
CREATE INDEX idx_articles_relevance ON news_articles(relevance_score DESC);
CREATE INDEX idx_articles_topics ON news_articles USING GIN(topic_ids);
CREATE INDEX idx_articles_entities ON news_articles USING GIN(entities);
CREATE INDEX idx_articles_source ON news_articles(source_id);
CREATE INDEX idx_articles_category ON news_articles(category);

-- ============================================
-- INTELLIGENCE SIGNALS
-- ============================================
-- Intelligence signals (high-value events detected by AI)
CREATE TABLE IF NOT EXISTS intelligence_signals (
  id SERIAL PRIMARY KEY,
  signal_type VARCHAR(100) NOT NULL,     -- 'funding_round', 'product_launch', 'hiring_spike'
  title TEXT NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'

  -- Relationships
  article_id INTEGER REFERENCES news_articles(id) ON DELETE CASCADE,
  profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Metadata
  metadata JSONB,                        -- Signal-specific data
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_signals_workspace ON intelligence_signals(workspace_id);
CREATE INDEX idx_signals_priority ON intelligence_signals(priority, detected_at DESC);
CREATE INDEX idx_signals_acknowledged ON intelligence_signals(acknowledged);
CREATE INDEX idx_signals_type ON intelligence_signals(signal_type);

-- ============================================
-- ARTICLE ENTITIES
-- ============================================
-- Entity mentions tracking (companies/people in articles)
CREATE TABLE IF NOT EXISTS article_entities (
  article_id INTEGER REFERENCES news_articles(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,      -- 'company', 'person', 'product'
  entity_name VARCHAR(255) NOT NULL,
  profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  confidence_score DECIMAL(3,2),         -- 0.00 to 1.00
  PRIMARY KEY (article_id, entity_type, entity_name)
);

-- Indexes
CREATE INDEX idx_entities_article ON article_entities(article_id);
CREATE INDEX idx_entities_profile ON article_entities(profile_id);
CREATE INDEX idx_entities_type ON article_entities(entity_type);
CREATE INDEX idx_entities_name ON article_entities(entity_name);

-- ============================================
-- SEED DATA
-- ============================================
-- Insert default content sources
INSERT INTO content_sources (name, type, url, enabled) VALUES
  ('TechCrunch', 'rss', 'https://techcrunch.com/feed/', true),
  ('VentureBeat', 'rss', 'https://venturebeat.com/feed/', true),
  ('The Verge', 'rss', 'https://www.theverge.com/rss/index.xml', true),
  ('Wired', 'rss', 'https://www.wired.com/feed/rss', true),
  ('AI News', 'rss', 'https://www.artificialintelligence-news.com/feed/', true)
ON CONFLICT DO NOTHING;

-- Insert default topics
INSERT INTO topics (name, type, keywords, description, color) VALUES
  ('Artificial Intelligence', 'industry', '["AI", "artificial intelligence", "machine learning", "deep learning", "neural networks"]', 'AI and machine learning news', '#8b5cf6'),
  ('SaaS', 'industry', '["SaaS", "software as a service", "cloud software", "B2B software"]', 'SaaS industry news', '#3b82f6'),
  ('FinTech', 'industry', '["FinTech", "financial technology", "banking", "payments", "crypto"]', 'Financial technology news', '#10b981'),
  ('Funding Rounds', 'event_type', '["raised", "funding", "Series A", "Series B", "Series C", "investment", "venture capital"]', 'Funding and investment news', '#f59e0b'),
  ('Product Launches', 'event_type', '["launch", "released", "announced", "unveils", "introduces"]', 'New product announcements', '#ec4899'),
  ('Acquisitions', 'event_type', '["acquired", "acquisition", "acquires", "merger", "bought"]', 'M&A activity', '#ef4444')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE topics IS 'Industry topics, technologies, and event types for content classification';
COMMENT ON TABLE workspace_topics IS 'Many-to-many relationship between workspaces and topics';
COMMENT ON TABLE content_sources IS 'Configuration for external content sources (RSS, NewsAPI, etc.)';
COMMENT ON TABLE news_articles IS 'Aggregated news articles from all sources with AI analysis';
COMMENT ON TABLE intelligence_signals IS 'High-value events detected by AI (funding, launches, etc.)';
COMMENT ON TABLE article_entities IS 'Companies, people, and products mentioned in articles';

COMMENT ON COLUMN news_articles.relevance_score IS 'AI-generated relevance score (0.00-1.00) based on tracked companies/topics';
COMMENT ON COLUMN news_articles.sentiment_score IS 'AI-generated sentiment score (-1.00 to 1.00) negative to positive';
COMMENT ON COLUMN news_articles.entities IS 'JSON object with extracted entities: companies, people, products';
COMMENT ON COLUMN news_articles.key_points IS 'JSON array of AI-extracted key points from article';

-- ============================================
-- END OF MIGRATION
-- ============================================
