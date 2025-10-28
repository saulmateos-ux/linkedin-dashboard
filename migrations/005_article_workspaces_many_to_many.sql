-- Migration: Article-Workspace Many-to-Many Relationship
-- Date: 2025-10-27
-- Purpose: Allow articles to belong to multiple workspaces

-- Step 1: Create article_workspaces junction table
CREATE TABLE IF NOT EXISTS article_workspaces (
  id SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_article_workspace UNIQUE(article_id, workspace_id)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_article_workspaces_article
  ON article_workspaces(article_id);

CREATE INDEX IF NOT EXISTS idx_article_workspaces_workspace
  ON article_workspaces(workspace_id);

CREATE INDEX IF NOT EXISTS idx_article_workspaces_added_at
  ON article_workspaces(added_at DESC);

-- Step 3: Migrate existing data
-- Insert existing article-workspace relationships from news_articles table
INSERT INTO article_workspaces (article_id, workspace_id, added_at)
SELECT id, workspace_id, created_at
FROM news_articles
WHERE workspace_id IS NOT NULL
ON CONFLICT (article_id, workspace_id) DO NOTHING;

-- Step 4: Verification query (for manual checking)
-- Check that migration worked
-- SELECT
--   (SELECT COUNT(*) FROM news_articles WHERE workspace_id IS NOT NULL) as old_count,
--   (SELECT COUNT(*) FROM article_workspaces) as new_count;

-- Step 5: Optional - Set workspace_id to NULL on news_articles
-- (Keeping column for backward compatibility, but new articles won't use it)
-- UNCOMMENT AFTER VERIFYING MIGRATION:
-- UPDATE news_articles SET workspace_id = NULL WHERE workspace_id IS NOT NULL;

COMMENT ON TABLE article_workspaces IS 'Many-to-many relationship between articles and workspaces';
COMMENT ON COLUMN article_workspaces.article_id IS 'Foreign key to news_articles';
COMMENT ON COLUMN article_workspaces.workspace_id IS 'Foreign key to workspaces';
COMMENT ON COLUMN article_workspaces.added_at IS 'When article was added to workspace';
