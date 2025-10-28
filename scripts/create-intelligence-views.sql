-- ==============================================================================
-- LinkedIn Dashboard - AI Intelligence Platform Setup
-- ==============================================================================
-- This script sets up pgvector, embeddings, and intelligence views
-- for AI-queryable LinkedIn analytics
--
-- Run this script in your Neon PostgreSQL database after enabling the
-- Neon Data API in the console.
--
-- Prerequisites:
-- 1. Neon Data API enabled (console.neon.tech)
-- 2. JWT token generated for authentication
-- 3. pgvector extension available (should be by default in Neon)
--
-- Estimated execution time: 1-2 minutes
-- ==============================================================================

-- ==============================================================================
-- PART 1: pgvector Setup
-- ==============================================================================

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to posts table (1536 dimensions for OpenAI text-embedding-3-small)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE posts ADD COLUMN embedding VECTOR(1536);
  END IF;
END $$;

-- Create HNSW index for fast vector similarity search
-- This index enables sub-100ms semantic search queries
-- HNSW parameters optimized for ~1000 posts:
--   - m: 16 (number of connections per layer)
--   - ef_construction: 64 (construction time quality)
DROP INDEX IF EXISTS posts_embedding_hnsw_idx;
CREATE INDEX posts_embedding_hnsw_idx ON posts
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Verify pgvector setup
DO $$
BEGIN
  RAISE NOTICE 'pgvector setup complete!';
  RAISE NOTICE 'Embedding column added to posts table';
  RAISE NOTICE 'HNSW index created for fast semantic search';
END $$;

-- ==============================================================================
-- PART 2: Intelligence Views
-- ==============================================================================

-- View 1: Top Performers
-- Returns the best-performing posts across all profiles
-- Ordered by engagement_total (likes + comments + shares)
DROP VIEW IF EXISTS top_performers CASCADE;
CREATE VIEW top_performers AS
SELECT
  p.id,
  p.post_url,
  p.content_preview,
  p.author_name,
  p.published_at,
  p.likes,
  p.comments,
  p.shares,
  p.views,
  p.engagement_total,
  p.engagement_rate,
  p.hashtags,
  p.media_type,
  prof.display_name as profile_name,
  prof.profile_type
FROM posts p
LEFT JOIN profiles prof ON p.profile_id = prof.id
WHERE p.engagement_total > 0
ORDER BY p.engagement_total DESC, p.published_at DESC;

-- View 2: Trending Hashtags (Materialized)
-- Aggregates hashtag performance over the last 30 days
-- Materialized for performance (refresh daily recommended)
DROP MATERIALIZED VIEW IF EXISTS trending_hashtags CASCADE;
CREATE MATERIALIZED VIEW trending_hashtags AS
SELECT
  hashtag,
  COUNT(*) as post_count,
  SUM(likes) as total_likes,
  SUM(comments) as total_comments,
  SUM(shares) as total_shares,
  SUM(engagement_total) as total_engagement,
  ROUND(AVG(engagement_rate)::numeric, 2) as avg_engagement_rate,
  ROUND(AVG(likes)::numeric, 2) as avg_likes,
  ROUND(AVG(comments)::numeric, 2) as avg_comments,
  MAX(published_at) as last_used
FROM posts,
  jsonb_array_elements_text(hashtags::jsonb) as hashtag
WHERE published_at >= CURRENT_DATE - INTERVAL '30 days'
  AND hashtag IS NOT NULL
  AND hashtag != ''
GROUP BY hashtag
HAVING COUNT(*) >= 2  -- Only show hashtags used at least twice
ORDER BY total_engagement DESC, post_count DESC
LIMIT 50;

-- Create index on materialized view for faster queries
CREATE UNIQUE INDEX trending_hashtags_hashtag_idx ON trending_hashtags (hashtag);

-- View 3: Competitive Intelligence
-- Compares performance metrics across all profiles
-- Shows average engagement, top hashtags, and posting frequency
DROP VIEW IF EXISTS competitive_intel CASCADE;
CREATE VIEW competitive_intel AS
SELECT
  prof.id as profile_id,
  prof.display_name,
  prof.profile_type,
  prof.username,
  COUNT(p.id) as total_posts,
  ROUND(AVG(p.likes)::numeric, 2) as avg_likes,
  ROUND(AVG(p.comments)::numeric, 2) as avg_comments,
  ROUND(AVG(p.shares)::numeric, 2) as avg_shares,
  ROUND(AVG(p.engagement_total)::numeric, 2) as avg_engagement,
  ROUND(AVG(p.engagement_rate)::numeric, 2) as avg_engagement_rate,
  MAX(p.likes) as max_likes,
  MAX(p.engagement_total) as max_engagement,
  MIN(p.published_at) as first_post_date,
  MAX(p.published_at) as last_post_date,
  -- Extract top 3 hashtags for this profile
  (
    SELECT jsonb_agg(hashtag_data ORDER BY post_count DESC)
    FROM (
      SELECT
        jsonb_build_object(
          'hashtag', hashtag,
          'count', COUNT(*)
        ) as hashtag_data,
        COUNT(*) as post_count
      FROM posts p2,
        jsonb_array_elements_text(p2.hashtags::jsonb) as hashtag
      WHERE p2.profile_id = prof.id
        AND hashtag IS NOT NULL
      GROUP BY hashtag
      ORDER BY COUNT(*) DESC
      LIMIT 3
    ) top_hashtags
  ) as top_hashtags
FROM profiles prof
LEFT JOIN posts p ON prof.id = p.profile_id
GROUP BY prof.id, prof.display_name, prof.profile_type, prof.username
ORDER BY avg_engagement DESC;

-- View 4: Topic Performance
-- Shows engagement metrics for each hashtag across all profiles
-- Useful for identifying which topics drive the most engagement
DROP VIEW IF EXISTS topic_performance CASCADE;
CREATE VIEW topic_performance AS
SELECT
  hashtag,
  COUNT(DISTINCT p.profile_id) as profiles_using,
  COUNT(*) as post_count,
  ROUND(AVG(p.likes)::numeric, 2) as avg_likes,
  ROUND(AVG(p.comments)::numeric, 2) as avg_comments,
  ROUND(AVG(p.shares)::numeric, 2) as avg_shares,
  ROUND(AVG(p.engagement_total)::numeric, 2) as avg_engagement,
  ROUND(AVG(p.engagement_rate)::numeric, 2) as avg_engagement_rate,
  ROUND(AVG(p.views)::numeric, 2) as avg_views,
  MAX(p.engagement_total) as best_post_engagement,
  MAX(p.published_at) as last_used,
  -- Count posts with images/videos for this hashtag
  SUM(CASE WHEN p.media_type != 'text' THEN 1 ELSE 0 END) as posts_with_media
FROM posts p,
  jsonb_array_elements_text(p.hashtags::jsonb) as hashtag
WHERE hashtag IS NOT NULL
  AND hashtag != ''
GROUP BY hashtag
HAVING COUNT(*) >= 2  -- Only show hashtags used at least twice
ORDER BY avg_engagement DESC;

-- View 5: Posting Patterns
-- Analyzes best days and times to post based on historical engagement
-- Aggregates by day of week and hour of day
DROP VIEW IF EXISTS posting_patterns CASCADE;
CREATE VIEW posting_patterns AS
SELECT
  EXTRACT(DOW FROM published_at) as day_of_week,  -- 0=Sunday, 6=Saturday
  CASE EXTRACT(DOW FROM published_at)
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END as day_name,
  EXTRACT(HOUR FROM published_at) as hour_of_day,
  COUNT(*) as post_count,
  ROUND(AVG(likes)::numeric, 2) as avg_likes,
  ROUND(AVG(comments)::numeric, 2) as avg_comments,
  ROUND(AVG(shares)::numeric, 2) as avg_shares,
  ROUND(AVG(engagement_total)::numeric, 2) as avg_engagement,
  ROUND(AVG(engagement_rate)::numeric, 2) as avg_engagement_rate,
  MAX(engagement_total) as max_engagement
FROM posts
WHERE published_at IS NOT NULL
GROUP BY
  EXTRACT(DOW FROM published_at),
  EXTRACT(HOUR FROM published_at)
ORDER BY avg_engagement DESC;

-- View 6: Recent Activity
-- Summary of posts and engagement from the last 7 days
-- Useful for daily/weekly reporting
DROP VIEW IF EXISTS recent_activity CASCADE;
CREATE VIEW recent_activity AS
SELECT
  day_date as date,
  posts_published,
  active_profiles,
  total_likes,
  total_comments,
  total_shares,
  total_engagement,
  avg_engagement_rate,
  -- Best post of the day
  (
    SELECT jsonb_build_object(
      'id', p2.id,
      'content_preview', p2.content_preview,
      'author', p2.author_name,
      'engagement', p2.engagement_total,
      'url', p2.post_url
    )
    FROM posts p2
    WHERE DATE(p2.published_at) = day_date
    ORDER BY p2.engagement_total DESC
    LIMIT 1
  ) as best_post
FROM (
  SELECT
    DATE(published_at) as day_date,
    COUNT(*) as posts_published,
    COUNT(DISTINCT profile_id) as active_profiles,
    SUM(likes) as total_likes,
    SUM(comments) as total_comments,
    SUM(shares) as total_shares,
    SUM(engagement_total) as total_engagement,
    ROUND(AVG(engagement_rate)::numeric, 2) as avg_engagement_rate
  FROM posts
  WHERE published_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY DATE(published_at)
) daily_stats
ORDER BY date DESC;

-- ==============================================================================
-- PART 3: Utility Functions
-- ==============================================================================

-- Function to refresh all materialized views
-- Run this daily to keep trending_hashtags up to date
CREATE OR REPLACE FUNCTION refresh_intelligence_views()
RETURNS TABLE(view_name text, status text) AS $$
BEGIN
  -- Refresh trending_hashtags
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_hashtags;
  RETURN QUERY SELECT 'trending_hashtags'::text, 'refreshed'::text;

  RAISE NOTICE 'All materialized views refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to get semantic search results
-- Usage: SELECT * FROM semantic_search('[1,2,3,...]'::vector, 10);
CREATE OR REPLACE FUNCTION semantic_search(
  query_embedding VECTOR(1536),
  max_results INTEGER DEFAULT 10,
  min_similarity FLOAT DEFAULT 0.7
)
RETURNS TABLE(
  id TEXT,
  post_url TEXT,
  content TEXT,
  author_name TEXT,
  published_at TIMESTAMP,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  engagement_total INTEGER,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.post_url,
    p.content,
    p.author_name,
    p.published_at,
    p.likes,
    p.comments,
    p.shares,
    p.engagement_total,
    1 - (p.embedding <=> query_embedding) as similarity
  FROM posts p
  WHERE p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) >= min_similarity
  ORDER BY p.embedding <=> query_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- PART 4: Verification & Testing
-- ==============================================================================

-- Test pgvector extension
DO $$
DECLARE
  vec_version text;
BEGIN
  SELECT extversion INTO vec_version
  FROM pg_extension
  WHERE extname = 'vector';

  RAISE NOTICE 'pgvector version: %', vec_version;
END $$;

-- Count posts with/without embeddings
DO $$
DECLARE
  total_posts INTEGER;
  posts_with_embeddings INTEGER;
  posts_without_embeddings INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_posts FROM posts;
  SELECT COUNT(*) INTO posts_with_embeddings FROM posts WHERE embedding IS NOT NULL;
  posts_without_embeddings := total_posts - posts_with_embeddings;

  RAISE NOTICE 'Total posts: %', total_posts;
  RAISE NOTICE 'Posts with embeddings: %', posts_with_embeddings;
  RAISE NOTICE 'Posts without embeddings: %', posts_without_embeddings;

  IF posts_without_embeddings > 0 THEN
    RAISE NOTICE 'Run generate-embeddings.js to generate embeddings for % posts', posts_without_embeddings;
  END IF;
END $$;

-- List all intelligence views
DO $$
BEGIN
  RAISE NOTICE '=== Intelligence Views Created ===';
  RAISE NOTICE '1. top_performers - Best performing posts';
  RAISE NOTICE '2. trending_hashtags - Popular hashtags (last 30 days)';
  RAISE NOTICE '3. competitive_intel - Profile comparison metrics';
  RAISE NOTICE '4. topic_performance - Engagement by hashtag';
  RAISE NOTICE '5. posting_patterns - Best days/times to post';
  RAISE NOTICE '6. recent_activity - Last 7 days summary';
  RAISE NOTICE '';
  RAISE NOTICE '=== Utility Functions Created ===';
  RAISE NOTICE '- refresh_intelligence_views() - Refresh materialized views';
  RAISE NOTICE '- semantic_search(vector, limit, threshold) - Find similar posts';
  RAISE NOTICE '';
  RAISE NOTICE 'Setup complete! Next steps:';
  RAISE NOTICE '1. Run generate-embeddings.js to create embeddings';
  RAISE NOTICE '2. Query views via Neon Data API';
  RAISE NOTICE '3. Integrate with AI tools (see docs/AI-QUERY-GUIDE.md)';
END $$;

-- ==============================================================================
-- PART 5: Row-Level Security (Optional)
-- ==============================================================================
-- Uncomment if you want to restrict Data API access with RLS

-- Enable RLS on posts table
-- ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to all posts for authenticated users
-- CREATE POLICY "Allow read access to posts"
--   ON posts FOR SELECT
--   TO authenticated
--   USING (true);

-- Policy: Allow read access to profiles for authenticated users
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow read access to profiles"
--   ON profiles FOR SELECT
--   TO authenticated
--   USING (true);

-- ==============================================================================
-- MAINTENANCE NOTES
-- ==============================================================================
--
-- Daily maintenance:
-- SELECT * FROM refresh_intelligence_views();
--
-- Check index health:
-- SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid))
-- FROM pg_indexes
-- WHERE tablename = 'posts'
-- ORDER BY pg_relation_size(indexrelid) DESC;
--
-- Vacuum and analyze after bulk embedding updates:
-- VACUUM ANALYZE posts;
--
-- ==============================================================================
