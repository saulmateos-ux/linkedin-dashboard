import { sql } from './sql-helper';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Topic {
  id: number;
  name: string;
  type: 'industry' | 'technology' | 'event_type' | 'keyword';
  keywords: string[];
  description?: string;
  color: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ContentSource {
  id: number;
  name: string;
  type: 'rss' | 'newsapi' | 'reddit' | 'twitter';
  url?: string;
  config?: Record<string, unknown>;
  enabled: boolean;
  last_fetched_at?: Date;
  fetch_frequency_minutes: number;
  created_at?: Date;
}

export interface NewsArticle {
  id?: number;
  title: string;
  description?: string;
  content?: string;
  url: string;
  source_id?: number;
  published_at: Date;
  scraped_at?: Date;
  author?: string;
  image_url?: string;
  profile_id?: number;
  workspace_id?: number;
  topic_ids?: number[];
  relevance_score?: number;
  sentiment_score?: number;
  category?: string;
  entities?: {
    companies?: string[];
    people?: string[];
    products?: string[];
  };
  key_points?: string[];
  created_at?: Date;
  updated_at?: Date;
}

export interface IntelligenceSignal {
  id?: number;
  signal_type: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  article_id?: number;
  profile_id?: number;
  workspace_id?: number;
  metadata?: Record<string, unknown>;
  detected_at?: Date;
  acknowledged: boolean;
  acknowledged_at?: Date;
}

export interface ArticleEntity {
  article_id: number;
  entity_type: 'company' | 'person' | 'product';
  entity_name: string;
  profile_id?: number;
  confidence_score?: number;
}

// ============================================
// TOPIC MANAGEMENT
// ============================================

export async function getTopics(): Promise<Topic[]> {
  const result = await sql`
    SELECT
      id, name, type, keywords, description, color,
      created_at, updated_at
    FROM topics
    ORDER BY name ASC
  `;

  return result.rows.map(row => ({
    ...row,
    keywords: row.keywords as string[],
  })) as Topic[];
}

export async function getTopic(id: number): Promise<Topic | null> {
  const result = await sql`
    SELECT
      id, name, type, keywords, description, color,
      created_at, updated_at
    FROM topics
    WHERE id = ${id}
  `;

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    ...row,
    keywords: row.keywords as string[],
  } as Topic;
}

export async function createTopic(data: {
  name: string;
  type: string;
  keywords: string[];
  description?: string;
  color?: string;
}): Promise<Topic> {
  const result = await sql`
    INSERT INTO topics (name, type, keywords, description, color)
    VALUES (
      ${data.name},
      ${data.type},
      ${JSON.stringify(data.keywords)}::jsonb,
      ${data.description || null},
      ${data.color || '#3b82f6'}
    )
    RETURNING id, name, type, keywords, description, color, created_at, updated_at
  `;

  const row = result.rows[0];
  return {
    ...row,
    keywords: row.keywords as string[],
  } as Topic;
}

export async function updateTopic(
  id: number,
  data: Partial<Topic>
): Promise<Topic> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.type !== undefined) {
    updates.push(`type = $${paramIndex++}`);
    values.push(data.type);
  }
  if (data.keywords !== undefined) {
    updates.push(`keywords = $${paramIndex++}::jsonb`);
    values.push(JSON.stringify(data.keywords));
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  if (data.color !== undefined) {
    updates.push(`color = $${paramIndex++}`);
    values.push(data.color);
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const query = `
    UPDATE topics
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, name, type, keywords, description, color, created_at, updated_at
  `;

  const result = await sql.query(query, values);

  const row = result.rows[0];
  return {
    ...row,
    keywords: row.keywords as string[],
  } as Topic;
}

export async function deleteTopic(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM topics
    WHERE id = ${id}
  `;

  return result.rowCount !== null && result.rowCount > 0;
}

// ============================================
// WORKSPACE TOPIC MANAGEMENT
// ============================================

export async function getWorkspaceTopics(workspaceId: number): Promise<Topic[]> {
  const result = await sql`
    SELECT
      t.id, t.name, t.type, t.keywords, t.description, t.color,
      t.created_at, t.updated_at
    FROM topics t
    INNER JOIN workspace_topics wt ON t.id = wt.topic_id
    WHERE wt.workspace_id = ${workspaceId}
    ORDER BY t.name ASC
  `;

  return result.rows.map(row => ({
    ...row,
    keywords: row.keywords as string[],
  })) as Topic[];
}

export async function addTopicToWorkspace(
  workspaceId: number,
  topicId: number
): Promise<void> {
  await sql`
    INSERT INTO workspace_topics (workspace_id, topic_id)
    VALUES (${workspaceId}, ${topicId})
    ON CONFLICT DO NOTHING
  `;
}

export async function removeTopicFromWorkspace(
  workspaceId: number,
  topicId: number
): Promise<boolean> {
  const result = await sql`
    DELETE FROM workspace_topics
    WHERE workspace_id = ${workspaceId} AND topic_id = ${topicId}
  `;

  return result.rowCount !== null && result.rowCount > 0;
}

// ============================================
// WORKSPACE CONTENT SOURCE MANAGEMENT
// ============================================

export async function getWorkspaceContentSources(workspaceId: number): Promise<ContentSource[]> {
  const result = await sql`
    SELECT
      cs.id, cs.name, cs.type, cs.url, cs.config, cs.enabled,
      cs.last_fetched_at, cs.fetch_frequency_minutes, cs.created_at
    FROM content_sources cs
    INNER JOIN workspace_content_sources wcs ON cs.id = wcs.source_id
    WHERE wcs.workspace_id = ${workspaceId}
    ORDER BY cs.name ASC
  `;

  return result.rows as ContentSource[];
}

export async function addContentSourceToWorkspace(
  workspaceId: number,
  sourceId: number
): Promise<void> {
  await sql`
    INSERT INTO workspace_content_sources (workspace_id, source_id)
    VALUES (${workspaceId}, ${sourceId})
    ON CONFLICT DO NOTHING
  `;
}

export async function removeContentSourceFromWorkspace(
  workspaceId: number,
  sourceId: number
): Promise<boolean> {
  const result = await sql`
    DELETE FROM workspace_content_sources
    WHERE workspace_id = ${workspaceId} AND source_id = ${sourceId}
  `;

  return result.rowCount !== null && result.rowCount > 0;
}

// ============================================
// CONTENT SOURCE MANAGEMENT
// ============================================

export async function getContentSources(): Promise<ContentSource[]> {
  const result = await sql`
    SELECT
      id, name, type, url, config, enabled,
      last_fetched_at, fetch_frequency_minutes, created_at
    FROM content_sources
    ORDER BY name ASC
  `;

  return result.rows as ContentSource[];
}

export async function getActiveContentSources(): Promise<ContentSource[]> {
  const result = await sql`
    SELECT
      id, name, type, url, config, enabled,
      last_fetched_at, fetch_frequency_minutes, created_at
    FROM content_sources
    WHERE enabled = true
    ORDER BY name ASC
  `;

  return result.rows as ContentSource[];
}

export async function createContentSource(
  data: Omit<ContentSource, 'id' | 'created_at'>
): Promise<ContentSource> {
  const result = await sql`
    INSERT INTO content_sources (
      name, type, url, config, enabled, fetch_frequency_minutes
    )
    VALUES (
      ${data.name},
      ${data.type},
      ${data.url || null},
      ${data.config ? JSON.stringify(data.config) : null}::jsonb,
      ${data.enabled},
      ${data.fetch_frequency_minutes}
    )
    RETURNING *
  `;

  return result.rows[0] as ContentSource;
}

export async function updateContentSource(
  id: number,
  data: Partial<ContentSource>
): Promise<ContentSource> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.type !== undefined) {
    updates.push(`type = $${paramIndex++}`);
    values.push(data.type);
  }
  if (data.url !== undefined) {
    updates.push(`url = $${paramIndex++}`);
    values.push(data.url);
  }
  if (data.config !== undefined) {
    updates.push(`config = $${paramIndex++}::jsonb`);
    values.push(JSON.stringify(data.config));
  }
  if (data.enabled !== undefined) {
    updates.push(`enabled = $${paramIndex++}`);
    values.push(data.enabled);
  }
  if (data.last_fetched_at !== undefined) {
    updates.push(`last_fetched_at = $${paramIndex++}`);
    values.push(data.last_fetched_at);
  }
  if (data.fetch_frequency_minutes !== undefined) {
    updates.push(`fetch_frequency_minutes = $${paramIndex++}`);
    values.push(data.fetch_frequency_minutes);
  }

  values.push(id);

  const query = `
    UPDATE content_sources
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await sql.query(query, values);
  return result.rows[0] as ContentSource;
}

// ============================================
// NEWS ARTICLE MANAGEMENT
// ============================================

export async function getArticles(options: {
  workspaceId?: number;
  profileId?: number;
  topicIds?: number[];
  limit?: number;
  offset?: number;
  minRelevanceScore?: number;
  category?: string;
  dateFrom?: Date;
}): Promise<{ articles: NewsArticle[]; total: number }> {
  const {
    workspaceId,
    profileId,
    topicIds,
    limit = 50,
    offset = 0,
    minRelevanceScore = 0.0,
    category,
    dateFrom
  } = options;

  const conditions: string[] = ['1=1'];
  const values: unknown[] = [];
  let paramIndex = 1;

  // Build FROM clause with optional workspace JOIN
  let fromClause = 'news_articles';
  if (workspaceId) {
    fromClause = `news_articles
      INNER JOIN article_workspaces ON news_articles.id = article_workspaces.article_id`;
    conditions.push(`article_workspaces.workspace_id = $${paramIndex++}`);
    values.push(workspaceId);
  }

  if (profileId) {
    conditions.push(`news_articles.profile_id = $${paramIndex++}`);
    values.push(profileId);
  }

  if (topicIds && topicIds.length > 0) {
    conditions.push(`news_articles.topic_ids && $${paramIndex++}::integer[]`);
    values.push(topicIds);
  }

  if (minRelevanceScore > 0) {
    conditions.push(`news_articles.relevance_score >= $${paramIndex++}`);
    values.push(minRelevanceScore);
  }

  if (category) {
    conditions.push(`news_articles.category = $${paramIndex++}`);
    values.push(category);
  }

  if (dateFrom) {
    conditions.push(`news_articles.published_at >= $${paramIndex++}`);
    values.push(dateFrom);
  }

  // Get total count
  const countQuery = `
    SELECT COUNT(DISTINCT news_articles.id) as total
    FROM ${fromClause}
    WHERE ${conditions.join(' AND ')}
  `;

  const countResult = await sql.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total);

  // Get articles
  values.push(limit);
  values.push(offset);

  const query = `
    SELECT DISTINCT news_articles.*
    FROM ${fromClause}
    WHERE ${conditions.join(' AND ')}
    ORDER BY news_articles.published_at DESC
    LIMIT $${paramIndex++}
    OFFSET $${paramIndex++}
  `;

  const result = await sql.query(query, values);

  const articles = result.rows.map(row => ({
    ...row,
    entities: row.entities as NewsArticle['entities'],
    key_points: row.key_points as string[],
    topic_ids: row.topic_ids as number[],
  })) as NewsArticle[];

  return { articles, total };
}

export async function getArticle(id: number): Promise<NewsArticle | null> {
  const result = await sql`
    SELECT *
    FROM news_articles
    WHERE id = ${id}
  `;

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    ...row,
    entities: row.entities as NewsArticle['entities'],
    key_points: row.key_points as string[],
    topic_ids: row.topic_ids as number[],
  } as NewsArticle;
}

export async function saveArticle(article: NewsArticle): Promise<NewsArticle> {
  const result = await sql`
    INSERT INTO news_articles (
      title, description, content, url, source_id, published_at,
      author, image_url, profile_id, workspace_id, topic_ids,
      relevance_score, sentiment_score, category, entities, key_points
    )
    VALUES (
      ${article.title},
      ${article.description || null},
      ${article.content || null},
      ${article.url},
      ${article.source_id || null},
      ${article.published_at},
      ${article.author || null},
      ${article.image_url || null},
      ${article.profile_id || null},
      ${article.workspace_id || null},
      ${article.topic_ids || []}::integer[],
      ${article.relevance_score || null},
      ${article.sentiment_score || null},
      ${article.category || null},
      ${article.entities ? JSON.stringify(article.entities) : null}::jsonb,
      ${article.key_points ? JSON.stringify(article.key_points) : null}::jsonb
    )
    ON CONFLICT (url) DO UPDATE SET
      relevance_score = EXCLUDED.relevance_score,
      sentiment_score = EXCLUDED.sentiment_score,
      category = EXCLUDED.category,
      entities = EXCLUDED.entities,
      key_points = EXCLUDED.key_points,
      topic_ids = EXCLUDED.topic_ids,
      profile_id = EXCLUDED.profile_id,
      workspace_id = EXCLUDED.workspace_id,
      updated_at = NOW()
    RETURNING *
  `;

  const row = result.rows[0];
  return {
    ...row,
    entities: row.entities as NewsArticle['entities'],
    key_points: row.key_points as string[],
    topic_ids: row.topic_ids as number[],
  } as NewsArticle;
}

// ============================================
// INTELLIGENCE SIGNALS
// ============================================

export async function getSignals(
  workspaceId?: number,
  acknowledged?: boolean
): Promise<IntelligenceSignal[]> {
  const conditions: string[] = ['1=1'];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (workspaceId !== undefined) {
    conditions.push(`workspace_id = $${paramIndex++}`);
    values.push(workspaceId);
  }

  if (acknowledged !== undefined) {
    conditions.push(`acknowledged = $${paramIndex++}`);
    values.push(acknowledged);
  }

  const query = `
    SELECT *
    FROM intelligence_signals
    WHERE ${conditions.join(' AND ')}
    ORDER BY priority DESC, detected_at DESC
    LIMIT 100
  `;

  const result = await sql.query(query, values);
  return result.rows as IntelligenceSignal[];
}

export async function createSignal(
  signal: Omit<IntelligenceSignal, 'id' | 'detected_at'>
): Promise<IntelligenceSignal> {
  const result = await sql`
    INSERT INTO intelligence_signals (
      signal_type, title, description, priority,
      article_id, profile_id, workspace_id, metadata, acknowledged
    )
    VALUES (
      ${signal.signal_type},
      ${signal.title},
      ${signal.description || null},
      ${signal.priority},
      ${signal.article_id || null},
      ${signal.profile_id || null},
      ${signal.workspace_id || null},
      ${signal.metadata ? JSON.stringify(signal.metadata) : null}::jsonb,
      ${signal.acknowledged}
    )
    RETURNING *
  `;

  return result.rows[0] as IntelligenceSignal;
}

export async function acknowledgeSignal(id: number): Promise<void> {
  await sql`
    UPDATE intelligence_signals
    SET acknowledged = true, acknowledged_at = NOW()
    WHERE id = ${id}
  `;
}

// ============================================
// ARTICLE-WORKSPACE MANY-TO-MANY FUNCTIONS
// ============================================

/**
 * Get all workspace IDs that a content source feeds into
 */
export async function getAllWorkspacesForSource(sourceId: number): Promise<number[]> {
  const result = await sql`
    SELECT workspace_id
    FROM workspace_content_sources
    WHERE source_id = ${sourceId}
    ORDER BY workspace_id
  `;
  return result.rows.map(r => r.workspace_id);
}

/**
 * Link an article to a workspace
 */
export async function linkArticleToWorkspace(
  articleId: number,
  workspaceId: number
): Promise<void> {
  await sql`
    INSERT INTO article_workspaces (article_id, workspace_id)
    VALUES (${articleId}, ${workspaceId})
    ON CONFLICT (article_id, workspace_id) DO NOTHING
  `;
}

/**
 * Get all workspace IDs that an article belongs to
 */
export async function getArticleWorkspaces(articleId: number): Promise<number[]> {
  const result = await sql`
    SELECT workspace_id
    FROM article_workspaces
    WHERE article_id = ${articleId}
    ORDER BY workspace_id
  `;
  return result.rows.map(r => r.workspace_id);
}

/**
 * Remove an article from a workspace
 */
export async function unlinkArticleFromWorkspace(
  articleId: number,
  workspaceId: number
): Promise<void> {
  await sql`
    DELETE FROM article_workspaces
    WHERE article_id = ${articleId} AND workspace_id = ${workspaceId}
  `;
}
