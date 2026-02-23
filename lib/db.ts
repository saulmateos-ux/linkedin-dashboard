import { Pool } from 'pg';

// Create a single pool instance for the entire application
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

export interface Post {
  id: string;
  post_url: string;
  content: string;
  content_preview: string;
  author_name: string;
  author_username: string;
  author_profile_url: string;
  published_at: Date;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  engagement_rate: number;
  engagement_total: number;
  hashtags: string[];
  media_type: string;
  profile_id?: number;
  platform?: string;
}

export interface Profile {
  id: number;
  username: string;
  profile_url: string;
  display_name: string;
  headline: string | null;
  follower_count: number | null;
  is_primary: boolean;
  is_company: boolean;
  profile_type: 'own' | 'competitor' | 'inspiration' | 'partner' | 'team' | 'other';
  industry: string | null;
  notes: string | null;
  company_id: number | null;
  company_name?: string | null;

  // Profile background data (added in migration 006)
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  skills: Array<{ name: string; endorsements?: number }> | null;
  languages: Array<{ name: string; proficiency?: string }> | null;
  certifications: Array<{ name: string; issuer?: string; issued_date?: string }> | null;
  honors_awards: Array<{ title: string; issuer?: string; date?: string }> | null;
  profile_scraped_at: Date | null; // Timestamp when background was last scraped
  profile_data_version: number;

  created_at: Date;
  updated_at: Date;
  last_scraped_at: Date | null;
}

export interface ProfileExperience {
  id: number;
  profile_id: number;
  company_name: string;
  company_url: string | null;
  company_logo_url: string | null;
  title: string;
  employment_type: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  duration_months: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProfileEducation {
  id: number;
  profile_id: number;
  school_name: string;
  school_url: string | null;
  school_logo_url: string | null;
  degree: string | null;
  field_of_study: string | null;
  start_year: string | null;
  end_year: string | null;
  grade: string | null;
  activities: string | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Stats {
  total_posts: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  avg_likes: number;
  avg_comments: number;
  avg_shares: number;
  max_likes: number;
  max_comments: number;
}

export interface EngagementData {
  date: string;
  likes: number;
  comments: number;
  shares: number;
}

/**
 * Get overall statistics from all posts or filtered by profile/workspace
 */
export async function getStats(profileId?: number | null, workspaceId?: number | null): Promise<Stats> {
  let whereClause = '';
  let params: (number)[] = [];

  if (profileId) {
    whereClause = 'WHERE profile_id = $1 AND (is_repost = false OR is_repost IS NULL)';
    params = [profileId];
  } else if (workspaceId) {
    whereClause = `WHERE profile_id IN (
      SELECT profile_id FROM workspace_profiles WHERE workspace_id = $1
    ) AND (is_repost = false OR is_repost IS NULL)`;
    params = [workspaceId];
  }

  const query = `
    SELECT
      COUNT(*) as total_posts,
      COALESCE(SUM(likes), 0) as total_likes,
      COALESCE(SUM(comments), 0) as total_comments,
      COALESCE(SUM(shares), 0) as total_shares,
      COALESCE(AVG(likes), 0) as avg_likes,
      COALESCE(AVG(comments), 0) as avg_comments,
      COALESCE(AVG(shares), 0) as avg_shares,
      COALESCE(MAX(likes), 0) as max_likes,
      COALESCE(MAX(comments), 0) as max_comments
    FROM posts
    ${whereClause}
  `;

  const result = await pool.query(query, params);
  const row = result.rows[0];

  return {
    total_posts: parseInt(row.total_posts),
    total_likes: parseInt(row.total_likes),
    total_comments: parseInt(row.total_comments),
    total_shares: parseInt(row.total_shares),
    avg_likes: parseFloat(Number(row.avg_likes).toFixed(1)),
    avg_comments: parseFloat(Number(row.avg_comments).toFixed(1)),
    avg_shares: parseFloat(Number(row.avg_shares).toFixed(1)),
    max_likes: parseInt(row.max_likes),
    max_comments: parseInt(row.max_comments),
  };
}

/**
 * Get top performing posts, optionally filtered by profile or workspace
 */
export async function getTopPosts(limit: number = 10, profileId?: number | null, workspaceId?: number | null): Promise<Post[]> {
  let whereClause = '';
  let params: (number)[];

  if (profileId) {
    whereClause = 'WHERE profile_id = $2 AND (is_repost = false OR is_repost IS NULL)';
    params = [limit, profileId];
  } else if (workspaceId) {
    whereClause = `WHERE profile_id IN (
      SELECT profile_id FROM workspace_profiles WHERE workspace_id = $2
    ) AND (is_repost = false OR is_repost IS NULL)`;
    params = [limit, workspaceId];
  } else {
    params = [limit];
  }

  const query = `
    SELECT
      id, post_url, content, content_preview, author_name, author_username,
      author_profile_url, published_at, likes, comments, shares, views,
      engagement_rate, engagement_total, hashtags, media_type, profile_id
    FROM posts
    ${whereClause}
    ORDER BY engagement_total DESC
    LIMIT $1
  `;

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get all posts with optional search, pagination, and profile filtering
 */
export async function getPosts(options: {
  search?: string;
  sortBy?: 'published_at' | 'likes' | 'comments' | 'shares' | 'engagement_total';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  profileId?: number | null;
  dateFrom?: string;
  dateTo?: string;
  minLikes?: number;
  minComments?: number;
  minShares?: number;
  minEngagement?: number;
  mediaType?: string;
  hashtag?: string;
}): Promise<{ posts: Post[]; total: number }> {
  const {
    search = '',
    sortBy = 'published_at',
    order = 'desc',
    limit = 50,
    offset = 0,
    profileId,
    dateFrom,
    dateTo,
    minLikes,
    minComments,
    minShares,
    minEngagement,
    mediaType,
    hashtag,
  } = options;

  let whereClause = '1=1 AND (p.is_repost = false OR p.is_repost IS NULL)';
  const params: (string | number)[] = [];

  if (profileId) {
    whereClause += ` AND p.profile_id = $${params.length + 1}`;
    params.push(profileId);
  }

  if (search) {
    whereClause += ` AND (p.content ILIKE $${params.length + 1} OR p.author_name ILIKE $${params.length + 1})`;
    params.push(`%${search}%`);
  }

  if (dateFrom) {
    whereClause += ` AND p.published_at >= $${params.length + 1}`;
    params.push(dateFrom);
  }

  if (dateTo) {
    whereClause += ` AND p.published_at <= $${params.length + 1}`;
    params.push(dateTo);
  }

  if (minLikes !== undefined) {
    whereClause += ` AND p.likes >= $${params.length + 1}`;
    params.push(minLikes);
  }

  if (minComments !== undefined) {
    whereClause += ` AND p.comments >= $${params.length + 1}`;
    params.push(minComments);
  }

  if (minShares !== undefined) {
    whereClause += ` AND p.shares >= $${params.length + 1}`;
    params.push(minShares);
  }

  if (minEngagement !== undefined) {
    whereClause += ` AND p.engagement_total >= $${params.length + 1}`;
    params.push(minEngagement);
  }

  if (mediaType) {
    whereClause += ` AND p.media_type = $${params.length + 1}`;
    params.push(mediaType);
  }

  if (hashtag) {
    whereClause += ` AND $${params.length + 1} = ANY(p.hashtags)`;
    params.push(hashtag.startsWith('#') ? hashtag : `#${hashtag}`);
  }

  // Get total count
  const countQuery = `
    SELECT COUNT(*)
    FROM posts p
    WHERE ${whereClause}
  `;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  // Get posts with company name and id (self-join to get company profile's display_name)
  params.push(limit, offset);
  const postsQuery = `
    SELECT
      p.id, p.post_url, p.content, p.content_preview, p.author_name, p.author_username,
      p.author_profile_url, p.published_at, p.likes, p.comments, p.shares, p.views,
      p.engagement_rate, p.engagement_total, p.hashtags, p.media_type, p.profile_id,
      company.display_name as company_name,
      company.id as company_id
    FROM posts p
    LEFT JOIN profiles pr ON p.profile_id = pr.id
    LEFT JOIN profiles company ON pr.company_id = company.id
    WHERE ${whereClause}
    ORDER BY p.${sortBy} ${order.toUpperCase()}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const result = await pool.query(postsQuery, params);

  return {
    posts: result.rows,
    total,
  };
}

/**
 * Get engagement data over time for charts, optionally filtered by profile
 */
export async function getEngagementOverTime(days: number = 30, profileId?: number | null): Promise<EngagementData[]> {
  const whereClause = profileId ? `AND profile_id = $1` : '';
  const params = profileId ? [profileId] : [];

  const query = `
    SELECT
      DATE(published_at) as date,
      SUM(likes) as likes,
      SUM(comments) as comments,
      SUM(shares) as shares
    FROM posts
    WHERE published_at >= NOW() - INTERVAL '${days} days'
    ${whereClause}
    GROUP BY DATE(published_at)
    ORDER BY date ASC
  `;

  const result = await pool.query(query, params);
  return result.rows.map(row => ({
    date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    likes: parseInt(row.likes),
    comments: parseInt(row.comments),
    shares: parseInt(row.shares),
  }));
}

// ============================================================================
// PROFILE FUNCTIONS
// ============================================================================

/**
 * Get all profiles ordered by primary first, then by name
 */
export async function getProfiles(): Promise<Profile[]> {
  const query = `
    SELECT
      p.*,
      c.display_name as company_name
    FROM profiles p
    LEFT JOIN profiles c ON p.company_id = c.id
    ORDER BY p.is_primary DESC, p.display_name ASC
  `;
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Get a single profile by ID
 */
export async function getProfile(id: number): Promise<Profile | null> {
  const query = 'SELECT * FROM profiles WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * Get the primary profile
 */
export async function getPrimaryProfile(): Promise<Profile | null> {
  const query = 'SELECT * FROM profiles WHERE is_primary = true LIMIT 1';
  const result = await pool.query(query);
  return result.rows[0] || null;
}

/**
 * Get profiles by type
 */
export async function getProfilesByType(type: string): Promise<Profile[]> {
  const query = 'SELECT * FROM profiles WHERE profile_type = $1 ORDER BY display_name ASC';
  const result = await pool.query(query, [type]);
  return result.rows;
}

/**
 * Add a new profile
 */
export async function addProfile(profile: {
  username: string;
  profile_url: string;
  display_name: string;
  headline?: string;
  follower_count?: number;
  is_primary?: boolean;
  is_company?: boolean;
  profile_type?: string;
  industry?: string;
  notes?: string;
  company_id?: number;
}): Promise<Profile> {
  const query = `
    INSERT INTO profiles (
      username, profile_url, display_name, headline, follower_count,
      is_primary, is_company, profile_type, industry, notes, company_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  const values = [
    profile.username,
    profile.profile_url,
    profile.display_name,
    profile.headline || null,
    profile.follower_count || null,
    profile.is_primary || false,
    profile.is_company || false,
    profile.profile_type || 'other',
    profile.industry || null,
    profile.notes || null,
    profile.company_id || null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Update a profile
 */
export async function updateProfile(id: number, updates: Partial<Profile>): Promise<Profile | null> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  let paramCount = 1;

  if (updates.display_name !== undefined) {
    fields.push(`display_name = $${paramCount++}`);
    values.push(updates.display_name);
  }
  if (updates.headline !== undefined) {
    fields.push(`headline = $${paramCount++}`);
    values.push(updates.headline);
  }
  if (updates.follower_count !== undefined) {
    fields.push(`follower_count = $${paramCount++}`);
    values.push(updates.follower_count);
  }
  if (updates.profile_type !== undefined) {
    fields.push(`profile_type = $${paramCount++}`);
    values.push(updates.profile_type);
  }
  if (updates.industry !== undefined) {
    fields.push(`industry = $${paramCount++}`);
    values.push(updates.industry);
  }
  if (updates.notes !== undefined) {
    fields.push(`notes = $${paramCount++}`);
    values.push(updates.notes);
  }

  if (fields.length === 0) {
    return getProfile(id);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const query = `
    UPDATE profiles
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

/**
 * Delete a profile
 */
export async function deleteProfile(id: number): Promise<boolean> {
  const query = 'DELETE FROM profiles WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Set a profile as primary (and unset others)
 */
export async function setPrimaryProfile(id: number): Promise<Profile | null> {
  // Start a transaction
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Unset all primary flags
    await client.query('UPDATE profiles SET is_primary = false');

    // Set the new primary
    const result = await client.query(
      'UPDATE profiles SET is_primary = true, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );

    await client.query('COMMIT');
    return result.rows[0] || null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT NOW()');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// ============================================================================
// AI INTELLIGENCE FUNCTIONS
// ============================================================================

export interface TrendingHashtag {
  hashtag: string;
  post_count: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_engagement: number;
  avg_engagement_rate: number;
  avg_likes: number;
  avg_comments: number;
  last_used: Date;
}

export interface CompetitiveIntel {
  profile_id: number;
  display_name: string;
  profile_type: string;
  username: string;
  total_posts: number;
  avg_likes: number;
  avg_comments: number;
  avg_shares: number;
  avg_engagement: number;
  avg_engagement_rate: number;
  max_likes: number;
  max_engagement: number;
  first_post_date: Date;
  last_post_date: Date;
  top_hashtags: Array<{ hashtag: string; count: number }>;
}

export interface TopicPerformance {
  hashtag: string;
  profiles_using: number;
  post_count: number;
  avg_likes: number;
  avg_comments: number;
  avg_shares: number;
  avg_engagement: number;
  avg_engagement_rate: number;
  avg_views: number;
  best_post_engagement: number;
  last_used: Date;
  posts_with_media: number;
}

export interface PostingPattern {
  day_of_week: number;
  day_name: string;
  hour_of_day: number;
  post_count: number;
  avg_likes: number;
  avg_comments: number;
  avg_shares: number;
  avg_engagement: number;
  avg_engagement_rate: number;
  max_engagement: number;
}

export interface RecentActivity {
  date: string;
  posts_published: number;
  active_profiles: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_engagement: number;
  avg_engagement_rate: number;
  best_post: {
    id: string;
    content_preview: string;
    author: string;
    engagement: number;
    url: string;
  };
}

/**
 * Get trending hashtags from the last 30 days
 */
export async function getTrendingHashtags(limit: number = 20, workspaceId?: number | null): Promise<TrendingHashtag[]> {
  let query: string;
  let params: (number | null)[];

  if (workspaceId) {
    // Filter hashtags to only include those from workspace profiles
    query = `
      SELECT
        hashtag,
        COUNT(*) as post_count,
        SUM(engagement_total) as total_engagement,
        AVG(engagement_total) as avg_engagement
      FROM (
        SELECT DISTINCT ON (p.id, h.hashtag)
          p.id,
          h.hashtag,
          p.engagement_total
        FROM posts p
        CROSS JOIN LATERAL jsonb_array_elements_text(p.hashtags) AS h(hashtag)
        WHERE p.profile_id IN (
          SELECT profile_id FROM workspace_profiles WHERE workspace_id = $1
        )
        AND p.published_at >= NOW() - INTERVAL '30 days'
      ) hashtag_posts
      GROUP BY hashtag
      ORDER BY total_engagement DESC
      LIMIT $2
    `;
    params = [workspaceId, limit];
  } else {
    query = `
      SELECT * FROM trending_hashtags
      LIMIT $1
    `;
    params = [limit];
  }

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get competitive intelligence comparing all profiles
 */
export async function getCompetitiveIntel(workspaceId?: number | null): Promise<CompetitiveIntel[]> {
  let query: string;
  let params: (number)[] = [];

  if (workspaceId) {
    // Only show profiles in the workspace
    query = `
      SELECT * FROM competitive_intel
      WHERE profile_id IN (
        SELECT profile_id FROM workspace_profiles WHERE workspace_id = $1
      )
    `;
    params = [workspaceId];
  } else {
    query = 'SELECT * FROM competitive_intel';
  }

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get topic performance by hashtag
 */
export async function getTopicPerformance(limit: number = 50, workspaceId?: number | null): Promise<TopicPerformance[]> {
  let query: string;
  let params: (number)[];

  if (workspaceId) {
    // Filter to only hashtags from workspace profiles
    query = `
      SELECT
        hashtag,
        COUNT(*) as post_count,
        AVG(engagement_total) as avg_engagement,
        SUM(engagement_total) as total_engagement
      FROM (
        SELECT DISTINCT ON (p.id, h.hashtag)
          p.id,
          h.hashtag,
          p.engagement_total
        FROM posts p
        CROSS JOIN LATERAL jsonb_array_elements_text(p.hashtags) AS h(hashtag)
        WHERE p.profile_id IN (
          SELECT profile_id FROM workspace_profiles WHERE workspace_id = $1
        )
      ) hashtag_posts
      GROUP BY hashtag
      ORDER BY avg_engagement DESC
      LIMIT $2
    `;
    params = [workspaceId, limit];
  } else {
    query = `
      SELECT * FROM topic_performance
      ORDER BY avg_engagement DESC
      LIMIT $1
    `;
    params = [limit];
  }

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get posting patterns (best days/times to post)
 */
export async function getPostingPatterns(workspaceId?: number | null): Promise<PostingPattern[]> {
  let query: string;
  let params: (number)[] = [];

  if (workspaceId) {
    // Filter to only posts from workspace profiles
    query = `
      SELECT
        EXTRACT(DOW FROM published_at) as day_of_week,
        EXTRACT(HOUR FROM published_at) as hour_of_day,
        COUNT(*) as post_count,
        AVG(engagement_total) as avg_engagement
      FROM posts
      WHERE profile_id IN (
        SELECT profile_id FROM workspace_profiles WHERE workspace_id = $1
      )
      GROUP BY day_of_week, hour_of_day
      ORDER BY avg_engagement DESC
    `;
    params = [workspaceId];
  } else {
    query = `
      SELECT * FROM posting_patterns
      ORDER BY avg_engagement DESC
    `;
  }

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get recent activity from the last 7 days
 */
export async function getRecentActivity(workspaceId?: number | null): Promise<RecentActivity[]> {
  let query: string;
  let params: (number)[] = [];

  if (workspaceId) {
    // Filter to only posts from workspace profiles
    query = `
      SELECT
        DATE(published_at) as activity_date,
        COUNT(*) as posts_count,
        SUM(likes) as total_likes,
        SUM(comments) as total_comments,
        SUM(shares) as total_shares,
        SUM(engagement_total) as total_engagement
      FROM posts
      WHERE profile_id IN (
        SELECT profile_id FROM workspace_profiles WHERE workspace_id = $1
      )
      AND published_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(published_at)
      ORDER BY activity_date DESC
    `;
    params = [workspaceId];
  } else {
    query = 'SELECT * FROM recent_activity';
  }

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Semantic search for posts by topic (requires embeddings to be generated)
 */
export async function semanticSearch(
  embedding: number[],
  limit: number = 10,
  minSimilarity: number = 0.7
): Promise<Post[]> {
  const query = `
    SELECT * FROM semantic_search($1::vector, $2, $3)
  `;
  const result = await pool.query(query, [
    `[${embedding.join(',')}]`,
    limit,
    minSimilarity,
  ]);
  return result.rows;
}

/**
 * Execute a custom SQL query (for AI-generated queries)
 * SECURITY: Only use with trusted/validated queries
 */
export async function queryDatabase(sql: string): Promise<unknown[]> {
  const result = await pool.query(sql);
  return result.rows;
}

// ============================================================================
// WORKSPACE FUNCTIONS
// ============================================================================

export interface Workspace {
  id: number;
  name: string;
  description: string | null;
  color: string;
  created_at: Date;
  updated_at: Date;
}

export interface WorkspaceWithCounts extends Workspace {
  profile_count: number;
  post_count: number;
}

/**
 * Get all workspaces with profile and post counts
 */
export async function getWorkspaces(): Promise<WorkspaceWithCounts[]> {
  const query = `
    SELECT
      w.*,
      COUNT(DISTINCT wp.profile_id) as profile_count,
      COUNT(DISTINCT p.id) as post_count
    FROM workspaces w
    LEFT JOIN workspace_profiles wp ON w.id = wp.workspace_id
    LEFT JOIN posts p ON wp.profile_id = p.profile_id
    GROUP BY w.id
    ORDER BY w.name
  `;
  const result = await pool.query(query);
  return result.rows.map(row => ({
    ...row,
    profile_count: parseInt(row.profile_count),
    post_count: parseInt(row.post_count),
  }));
}

/**
 * Get a single workspace by ID
 */
export async function getWorkspace(id: number): Promise<Workspace | null> {
  const query = 'SELECT * FROM workspaces WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * Get a workspace by name
 */
export async function getWorkspaceByName(name: string): Promise<Workspace | null> {
  const query = 'SELECT * FROM workspaces WHERE name = $1';
  const result = await pool.query(query, [name]);
  return result.rows[0] || null;
}

/**
 * Create a new workspace
 */
export async function createWorkspace(workspace: {
  name: string;
  description?: string;
  color?: string;
}): Promise<Workspace> {
  const query = `
    INSERT INTO workspaces (name, description, color)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const values = [
    workspace.name,
    workspace.description || null,
    workspace.color || '#6366f1',
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Update a workspace
 */
export async function updateWorkspace(
  id: number,
  updates: Partial<Omit<Workspace, 'id' | 'created_at' | 'updated_at'>>
): Promise<Workspace | null> {
  const fields: string[] = [];
  const values: (string | null)[] = [];
  let paramCount = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(updates.description);
  }
  if (updates.color !== undefined) {
    fields.push(`color = $${paramCount++}`);
    values.push(updates.color);
  }

  if (fields.length === 0) {
    return getWorkspace(id);
  }

  fields.push(`updated_at = NOW()`);
  values.push(String(id));

  const query = `
    UPDATE workspaces
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

/**
 * Delete a workspace
 */
export async function deleteWorkspace(id: number): Promise<boolean> {
  const query = 'DELETE FROM workspaces WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Get profiles in a workspace
 */
export async function getWorkspaceProfiles(workspaceId: number): Promise<Profile[]> {
  const query = `
    SELECT
      p.*,
      c.display_name as company_name,
      COUNT(posts.id) as post_count,
      MIN(wp.added_at) as added_at
    FROM workspace_profiles wp
    INNER JOIN profiles p ON wp.profile_id = p.id
    LEFT JOIN profiles c ON p.company_id = c.id
    LEFT JOIN posts ON p.id = posts.profile_id
    WHERE wp.workspace_id = $1
    GROUP BY p.id, c.display_name
    ORDER BY p.is_primary DESC, MIN(wp.added_at) ASC
  `;
  const result = await pool.query(query, [workspaceId]);
  return result.rows;
}

/**
 * Add a profile to a workspace
 */
export async function addProfileToWorkspace(workspaceId: number, profileId: number): Promise<void> {
  const query = `
    INSERT INTO workspace_profiles (workspace_id, profile_id)
    VALUES ($1, $2)
    ON CONFLICT (workspace_id, profile_id) DO NOTHING
  `;
  await pool.query(query, [workspaceId, profileId]);
}

/**
 * Remove a profile from a workspace
 */
export async function removeProfileFromWorkspace(workspaceId: number, profileId: number): Promise<boolean> {
  const query = 'DELETE FROM workspace_profiles WHERE workspace_id = $1 AND profile_id = $2';
  const result = await pool.query(query, [workspaceId, profileId]);
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Get posts for a workspace (across all profiles in the workspace)
 */
export async function getWorkspacePosts(
  workspaceId: number,
  options: {
    search?: string;
    sortBy?: 'published_at' | 'likes' | 'comments' | 'shares' | 'engagement_total';
    order?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
    minLikes?: number;
    minComments?: number;
    minShares?: number;
    minEngagement?: number;
    mediaType?: string;
    hashtag?: string;
  }
): Promise<{ posts: Post[]; total: number }> {
  const {
    search = '',
    sortBy = 'published_at',
    order = 'desc',
    limit = 50,
    offset = 0,
    dateFrom,
    dateTo,
    minLikes,
    minComments,
    minShares,
    minEngagement,
    mediaType,
    hashtag,
  } = options;

  let whereClause = '1=1';
  const params: (string | number)[] = [workspaceId];

  if (search) {
    whereClause += ` AND (p.content ILIKE $${params.length + 1} OR p.author_name ILIKE $${params.length + 1})`;
    params.push(`%${search}%`);
  }

  if (dateFrom) {
    whereClause += ` AND p.published_at >= $${params.length + 1}`;
    params.push(dateFrom);
  }

  if (dateTo) {
    whereClause += ` AND p.published_at <= $${params.length + 1}`;
    params.push(dateTo);
  }

  if (minLikes !== undefined) {
    whereClause += ` AND p.likes >= $${params.length + 1}`;
    params.push(minLikes);
  }

  if (minComments !== undefined) {
    whereClause += ` AND p.comments >= $${params.length + 1}`;
    params.push(minComments);
  }

  if (minShares !== undefined) {
    whereClause += ` AND p.shares >= $${params.length + 1}`;
    params.push(minShares);
  }

  if (minEngagement !== undefined) {
    whereClause += ` AND p.engagement_total >= $${params.length + 1}`;
    params.push(minEngagement);
  }

  if (mediaType) {
    whereClause += ` AND p.media_type = $${params.length + 1}`;
    params.push(mediaType);
  }

  if (hashtag) {
    whereClause += ` AND $${params.length + 1} = ANY(p.hashtags)`;
    params.push(hashtag.startsWith('#') ? hashtag : `#${hashtag}`);
  }

  // Get total count
  const countQuery = `
    SELECT COUNT(DISTINCT p.id)
    FROM posts p
    INNER JOIN workspace_profiles wp ON p.profile_id = wp.profile_id
    WHERE wp.workspace_id = $1 AND ${whereClause}
  `;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  // Get posts with company name and id (self-join to get company profile's display_name)
  params.push(limit, offset);
  const postsQuery = `
    SELECT DISTINCT
      p.id, p.post_url, p.content, p.content_preview, p.author_name, p.author_username,
      p.author_profile_url, p.published_at, p.likes, p.comments, p.shares, p.views,
      p.engagement_rate, p.engagement_total, p.hashtags, p.media_type, p.profile_id,
      company.display_name as company_name,
      company.id as company_id
    FROM posts p
    INNER JOIN workspace_profiles wp ON p.profile_id = wp.profile_id
    LEFT JOIN profiles pr ON p.profile_id = pr.id
    LEFT JOIN profiles company ON pr.company_id = company.id
    WHERE wp.workspace_id = $1 AND ${whereClause}
    ORDER BY p.${sortBy} ${order.toUpperCase()}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const result = await pool.query(postsQuery, params);

  return {
    posts: result.rows,
    total,
  };
}

/**
 * Auto-link profiles to companies based on current work experience
 */
export async function autoLinkProfilesToCompanies(): Promise<{
  linked: number;
  unmatched: string[];
}> {
  // Get all person profiles with current companies
  const currentJobsQuery = `
    SELECT DISTINCT ON (pr.id)
      pr.id as profile_id,
      pr.display_name as person_name,
      exp.company_name,
      exp.title
    FROM profiles pr
    JOIN profile_experiences exp ON pr.id = exp.profile_id
    WHERE exp.is_current = true
      AND pr.is_company = false
    ORDER BY pr.id, exp.created_at DESC
  `;

  const jobsResult = await pool.query(currentJobsQuery);
  const currentJobs = jobsResult.rows;

  // Get all company profiles
  const companiesQuery = `
    SELECT id, display_name
    FROM profiles
    WHERE is_company = true
  `;
  const companiesResult = await pool.query(companiesQuery);
  const companies = companiesResult.rows;

  let linked = 0;
  const unmatched: string[] = [];

  // Match and link profiles
  for (const job of currentJobs) {
    const companyName = job.company_name.toLowerCase().trim();

    // Try to find matching company profile (fuzzy match)
    const matchedCompany = companies.find(c => {
      const displayName = c.display_name.toLowerCase();
      // Remove common suffixes for matching
      const normalized = displayName
        .replace(' (company)', '')
        .replace(', llc', '')
        .replace(' llc', '')
        .replace(', inc', '')
        .replace(' inc', '')
        .trim();

      return (
        displayName.includes(companyName) ||
        companyName.includes(normalized) ||
        normalized === companyName
      );
    });

    if (matchedCompany) {
      // Link profile to company
      const updateQuery = `
        UPDATE profiles
        SET company_id = $1, updated_at = NOW()
        WHERE id = $2
      `;
      await pool.query(updateQuery, [matchedCompany.id, job.profile_id]);
      linked++;
      console.log(`✅ Linked ${job.person_name} to ${matchedCompany.display_name}`);
    } else {
      unmatched.push(`${job.person_name} - ${job.company_name}`);
      console.log(`⚠️  No match found for ${job.company_name}`);
    }
  }

  return { linked, unmatched };
}

/**
 * Get all companies with post counts
 */
export async function getCompaniesWithStats(): Promise<Array<{
  id: number;
  display_name: string;
  profile_url: string;
  follower_count: number | null;
  employee_count: number;
  post_count: number;
  total_engagement: number;
}>> {
  const query = `
    SELECT
      c.id,
      c.display_name,
      c.profile_url,
      c.follower_count,
      COUNT(DISTINCT pr.id) as employee_count,
      COUNT(DISTINCT p.id) as post_count,
      COALESCE(SUM(p.engagement_total), 0) as total_engagement
    FROM profiles c
    LEFT JOIN profiles pr ON pr.company_id = c.id
    LEFT JOIN posts p ON p.profile_id = pr.id
    WHERE c.is_company = true
    GROUP BY c.id, c.display_name, c.profile_url, c.follower_count
    ORDER BY employee_count DESC, c.display_name
  `;

  const result = await pool.query(query);
  return result.rows;
}

/**
 * Get posts for a specific company (all employees)
 */
export async function getCompanyPosts(
  companyId: number,
  options: {
    search?: string;
    sortBy?: 'published_at' | 'likes' | 'comments' | 'shares' | 'engagement_total';
    order?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }
): Promise<{ posts: (Post & { company_name?: string | null })[]; total: number }> {
  const {
    search = '',
    sortBy = 'published_at',
    order = 'desc',
    limit = 50,
    offset = 0,
  } = options;

  let whereClause = 'pr.company_id = $1';
  const params: (string | number)[] = [companyId];

  if (search) {
    whereClause += ` AND (p.content ILIKE $${params.length + 1} OR p.author_name ILIKE $${params.length + 1})`;
    params.push(`%${search}%`);
  }

  // Get total count
  const countQuery = `
    SELECT COUNT(DISTINCT p.id)
    FROM posts p
    JOIN profiles pr ON p.profile_id = pr.id
    WHERE ${whereClause}
  `;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  // Get posts with company id
  params.push(limit, offset);
  const postsQuery = `
    SELECT DISTINCT
      p.id, p.post_url, p.content, p.content_preview, p.author_name, p.author_username,
      p.author_profile_url, p.published_at, p.likes, p.comments, p.shares, p.views,
      p.engagement_rate, p.engagement_total, p.hashtags, p.media_type, p.profile_id,
      company.display_name as company_name,
      company.id as company_id
    FROM posts p
    JOIN profiles pr ON p.profile_id = pr.id
    LEFT JOIN profiles company ON pr.company_id = company.id
    WHERE ${whereClause}
    ORDER BY p.${sortBy} ${order.toUpperCase()}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const result = await pool.query(postsQuery, params);

  return {
    posts: result.rows,
    total,
  };
}

/**
 * Bulk update company profile data from scraping
 */
export async function bulkUpdateCompanyData(
  companies: Array<{
    profile_id: number;
    display_name?: string;
    headline?: string;
    summary?: string;
    industry?: string;
    location?: string;
    follower_count?: number;
    notes?: string;
  }>
): Promise<{ updated: number; failed: number }> {
  let updated = 0;
  let failed = 0;

  for (const company of companies) {
    try {
      const updates: string[] = [];
      const values: (string | number | null)[] = [];
      let paramCount = 1;

      if (company.display_name !== undefined) {
        updates.push(`display_name = $${paramCount++}`);
        values.push(company.display_name);
      }

      if (company.headline !== undefined) {
        updates.push(`headline = $${paramCount++}`);
        values.push(company.headline);
      }

      if (company.summary !== undefined) {
        updates.push(`summary = $${paramCount++}`);
        values.push(company.summary);
      }

      if (company.industry !== undefined) {
        updates.push(`industry = $${paramCount++}`);
        values.push(company.industry);
      }

      if (company.location !== undefined) {
        updates.push(`location = $${paramCount++}`);
        values.push(company.location);
      }

      if (company.follower_count !== undefined) {
        updates.push(`follower_count = $${paramCount++}`);
        values.push(company.follower_count);
      }

      if (company.notes !== undefined) {
        updates.push(`notes = $${paramCount++}`);
        values.push(company.notes);
      }

      if (updates.length === 0) {
        console.warn(`No updates for company ${company.profile_id}`);
        continue;
      }

      updates.push(`updated_at = NOW()`);
      values.push(company.profile_id);

      const query = `
        UPDATE profiles
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
      `;

      await pool.query(query, values);
      updated++;
    } catch (error) {
      console.error(`Failed to update company ${company.profile_id}:`, error);
      failed++;
    }
  }

  return { updated, failed };
}

/**
 * Get statistics for a workspace
 */
export async function getWorkspaceStats(workspaceId: number): Promise<Stats & { total_profiles: number }> {
  const query = `
    SELECT
      COUNT(DISTINCT p.id) as total_posts,
      COUNT(DISTINCT wp.profile_id) as total_profiles,
      COALESCE(SUM(p.likes), 0) as total_likes,
      COALESCE(SUM(p.comments), 0) as total_comments,
      COALESCE(SUM(p.shares), 0) as total_shares,
      COALESCE(AVG(p.likes), 0) as avg_likes,
      COALESCE(AVG(p.comments), 0) as avg_comments,
      COALESCE(AVG(p.shares), 0) as avg_shares,
      COALESCE(MAX(p.likes), 0) as max_likes,
      COALESCE(MAX(p.comments), 0) as max_comments
    FROM posts p
    INNER JOIN workspace_profiles wp ON p.profile_id = wp.profile_id
    WHERE wp.workspace_id = $1
  `;

  const result = await pool.query(query, [workspaceId]);
  const row = result.rows[0];

  return {
    total_posts: parseInt(row.total_posts),
    total_profiles: parseInt(row.total_profiles),
    total_likes: parseInt(row.total_likes),
    total_comments: parseInt(row.total_comments),
    total_shares: parseInt(row.total_shares),
    avg_likes: parseFloat(Number(row.avg_likes).toFixed(1)),
    avg_comments: parseFloat(Number(row.avg_comments).toFixed(1)),
    avg_shares: parseFloat(Number(row.avg_shares).toFixed(1)),
    max_likes: parseInt(row.max_likes),
    max_comments: parseInt(row.max_comments),
  };
}

// ============================================================================
// SMART SCRAPING HELPERS
// ============================================================================

/**
 * Calculate days since last scrape for a profile
 */
export function getDaysSinceLastScrape(lastScrapedAt: Date | null): number | null {
  if (!lastScrapedAt) return null;
  const now = new Date();
  const lastScrape = new Date(lastScrapedAt);
  const diffMs = now.getTime() - lastScrape.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculate smart maxPosts for a profile based on last scrape date
 */
export function calculateSmartMaxPosts(profile: Profile): number {
  if (!profile.last_scraped_at) {
    return 50; // Initial scrape
  }

  const daysSince = getDaysSinceLastScrape(profile.last_scraped_at);

  if (daysSince === null) {
    return 50; // Treat as initial scrape
  }

  if (daysSince <= 7) {
    return 3; // Weekly update
  } else if (daysSince <= 30) {
    return 10; // Catch-up scrape
  } else {
    return 25; // Full refresh
  }
}

export interface ProfileGroup {
  profiles: Profile[];
  maxPosts: number;
  groupName: string;
}

/**
 * Group profiles by their smart scrape needs
 */
export function groupProfilesByMaxPosts(profiles: Profile[]): ProfileGroup[] {
  const groups: { [key: number]: Profile[] } = {
    50: [],  // Initial scrape
    25: [],  // Full refresh (>30 days)
    10: [],  // Catch-up (8-30 days)
    3: [],   // Weekly (≤7 days)
  };

  profiles.forEach(profile => {
    const maxPosts = calculateSmartMaxPosts(profile);
    groups[maxPosts].push(profile);
  });

  const result: ProfileGroup[] = [];

  if (groups[50].length > 0) {
    result.push({
      profiles: groups[50],
      maxPosts: 50,
      groupName: 'initial'
    });
  }

  if (groups[25].length > 0) {
    result.push({
      profiles: groups[25],
      maxPosts: 25,
      groupName: 'refresh'
    });
  }

  if (groups[10].length > 0) {
    result.push({
      profiles: groups[10],
      maxPosts: 10,
      groupName: 'catchup'
    });
  }

  if (groups[3].length > 0) {
    result.push({
      profiles: groups[3],
      maxPosts: 3,
      groupName: 'weekly'
    });
  }

  return result;
}

/**
 * Get profiles by array of IDs
 */
export async function getProfilesByIds(ids: number[]): Promise<Profile[]> {
  if (ids.length === 0) return [];

  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
  const query = `SELECT * FROM profiles WHERE id IN (${placeholders}) ORDER BY display_name ASC`;
  const result = await pool.query(query, ids);
  return result.rows;
}

/**
 * Update last_scraped_at timestamp for profiles
 */
export async function updateProfilesLastScraped(profileIds: number[]): Promise<void> {
  if (profileIds.length === 0) return;

  const placeholders = profileIds.map((_, i) => `$${i + 1}`).join(', ');
  const query = `UPDATE profiles SET last_scraped_at = NOW(), updated_at = NOW() WHERE id IN (${placeholders})`;
  await pool.query(query, profileIds);
}

// ============================================================================
// ENHANCED ANALYTICS FUNCTIONS (Backend calculations only)
// ============================================================================

export interface ProfilePerformance {
  profile_id: number;
  display_name: string;
  profile_type: string;
  username: string;
  total_posts: number;
  total_engagement: number;
  avg_engagement_per_post: number;
  engagement_rate: number;
  viral_score: number; // shares per post
  conversation_rate: number; // comments to likes ratio
  total_likes: number;
  total_comments: number;
  total_shares: number;
  avg_likes: number;
  avg_comments: number;
  avg_shares: number;
  trend_percent: number | null; // Week-over-week change
  last_post_date: Date | null;
}

export interface EnhancedStats extends Stats {
  engagement_rate: number; // (likes + comments + shares) / posts
  viral_score: number; // shares / posts
  conversation_rate: number; // comments / likes ratio (as percentage)
  week_over_week_engagement_change: number | null; // % change vs last week
  week_over_week_posts_change: number | null;
}

export interface ContentInsights {
  top_hashtags: Array<{ hashtag: string; count: number; avg_engagement: number }>;
  best_posting_times: Array<{ day: string; hour: number; avg_engagement: number; post_count: number }>;
  content_type_performance: Array<{ media_type: string; post_count: number; avg_engagement: number }>;
}

/**
 * Get profile performance leaderboard with all metrics calculated in DB
 * Supports filtering by workspace
 */
export async function getProfilePerformanceLeaderboard(
  workspaceId?: number | null,
  limit: number = 10
): Promise<ProfilePerformance[]> {
  let whereClause = '';
  let params: number[] = [];

  if (workspaceId) {
    whereClause = `
      AND prof.id IN (
        SELECT profile_id FROM workspace_profiles WHERE workspace_id = $1
      )
    `;
    params = [workspaceId, limit];
  } else {
    params = [limit];
  }

  const query = `
    WITH current_week AS (
      SELECT
        profile_id,
        COUNT(*) as posts_this_week,
        COALESCE(SUM(engagement_total), 0) as engagement_this_week
      FROM posts
      WHERE published_at >= NOW() - INTERVAL '7 days'
      GROUP BY profile_id
    ),
    previous_week AS (
      SELECT
        profile_id,
        COUNT(*) as posts_last_week,
        COALESCE(SUM(engagement_total), 0) as engagement_last_week
      FROM posts
      WHERE published_at >= NOW() - INTERVAL '14 days'
        AND published_at < NOW() - INTERVAL '7 days'
      GROUP BY profile_id
    )
    SELECT
      prof.id as profile_id,
      prof.display_name,
      prof.profile_type,
      prof.username,
      COUNT(p.id) as total_posts,
      COALESCE(SUM(p.engagement_total), 0) as total_engagement,
      COALESCE(AVG(p.engagement_total), 0) as avg_engagement_per_post,
      CASE
        WHEN COUNT(p.id) > 0
        THEN COALESCE(SUM(p.engagement_total)::float / COUNT(p.id), 0)
        ELSE 0
      END as engagement_rate,
      CASE
        WHEN COUNT(p.id) > 0
        THEN COALESCE(SUM(p.shares)::float / COUNT(p.id), 0)
        ELSE 0
      END as viral_score,
      CASE
        WHEN SUM(p.likes) > 0
        THEN (SUM(p.comments)::float / SUM(p.likes) * 100)
        ELSE 0
      END as conversation_rate,
      COALESCE(SUM(p.likes), 0) as total_likes,
      COALESCE(SUM(p.comments), 0) as total_comments,
      COALESCE(SUM(p.shares), 0) as total_shares,
      COALESCE(AVG(p.likes), 0) as avg_likes,
      COALESCE(AVG(p.comments), 0) as avg_comments,
      COALESCE(AVG(p.shares), 0) as avg_shares,
      CASE
        WHEN prev.engagement_last_week > 0
        THEN ((curr.engagement_this_week - prev.engagement_last_week)::float / prev.engagement_last_week * 100)
        ELSE NULL
      END as trend_percent,
      MAX(p.published_at) as last_post_date
    FROM profiles prof
    LEFT JOIN posts p ON prof.id = p.profile_id
    LEFT JOIN current_week curr ON prof.id = curr.profile_id
    LEFT JOIN previous_week prev ON prof.id = prev.profile_id
    WHERE 1=1 ${whereClause}
    GROUP BY prof.id, prof.display_name, prof.profile_type, prof.username,
             curr.engagement_this_week, prev.engagement_last_week
    HAVING COUNT(p.id) > 0
    ORDER BY avg_engagement_per_post DESC
    LIMIT $${params.length}
  `;

  const result = await pool.query(query, params);
  return result.rows.map(row => ({
    ...row,
    total_posts: parseInt(row.total_posts),
    total_engagement: parseInt(row.total_engagement),
    avg_engagement_per_post: parseFloat(Number(row.avg_engagement_per_post).toFixed(1)),
    engagement_rate: parseFloat(Number(row.engagement_rate).toFixed(1)),
    viral_score: parseFloat(Number(row.viral_score).toFixed(2)),
    conversation_rate: parseFloat(Number(row.conversation_rate).toFixed(1)),
    total_likes: parseInt(row.total_likes),
    total_comments: parseInt(row.total_comments),
    total_shares: parseInt(row.total_shares),
    avg_likes: parseFloat(Number(row.avg_likes).toFixed(1)),
    avg_comments: parseFloat(Number(row.avg_comments).toFixed(1)),
    avg_shares: parseFloat(Number(row.avg_shares).toFixed(1)),
    trend_percent: row.trend_percent ? parseFloat(Number(row.trend_percent).toFixed(1)) : null,
  }));
}

/**
 * Get enhanced stats with engagement rate, viral score, and trends
 * All calculations done in the database
 */
export async function getEnhancedStats(
  profileId?: number | null,
  workspaceId?: number | null
): Promise<EnhancedStats> {
  let whereClause = '';
  let params: number[] = [];

  if (profileId) {
    whereClause = 'WHERE profile_id = $1 AND (is_repost = false OR is_repost IS NULL)';
    params = [profileId];
  } else if (workspaceId) {
    whereClause = `
      WHERE profile_id IN (
        SELECT profile_id FROM workspace_profiles WHERE workspace_id = $1
      ) AND (is_repost = false OR is_repost IS NULL)
    `;
    params = [workspaceId];
  }

  const query = `
    WITH current_week AS (
      SELECT
        COUNT(*) as posts_this_week,
        COALESCE(SUM(engagement_total), 0) as engagement_this_week
      FROM posts
      WHERE published_at >= NOW() - INTERVAL '7 days'
      ${whereClause ? whereClause.replace('WHERE', 'AND') : ''}
    ),
    previous_week AS (
      SELECT
        COUNT(*) as posts_last_week,
        COALESCE(SUM(engagement_total), 0) as engagement_last_week
      FROM posts
      WHERE published_at >= NOW() - INTERVAL '14 days'
        AND published_at < NOW() - INTERVAL '7 days'
      ${whereClause ? whereClause.replace('WHERE', 'AND') : ''}
    ),
    base_stats AS (
      SELECT
        COUNT(*) as total_posts,
        COALESCE(SUM(likes), 0) as total_likes,
        COALESCE(SUM(comments), 0) as total_comments,
        COALESCE(SUM(shares), 0) as total_shares,
        COALESCE(AVG(likes), 0) as avg_likes,
        COALESCE(AVG(comments), 0) as avg_comments,
        COALESCE(AVG(shares), 0) as avg_shares,
        COALESCE(MAX(likes), 0) as max_likes,
        COALESCE(MAX(comments), 0) as max_comments
      FROM posts
      ${whereClause}
    )
    SELECT
      bs.*,
      CASE
        WHEN bs.total_posts > 0
        THEN ((bs.total_likes + bs.total_comments + bs.total_shares)::float / bs.total_posts)
        ELSE 0
      END as engagement_rate,
      CASE
        WHEN bs.total_posts > 0
        THEN (bs.total_shares::float / bs.total_posts)
        ELSE 0
      END as viral_score,
      CASE
        WHEN bs.total_likes > 0
        THEN (bs.total_comments::float / bs.total_likes * 100)
        ELSE 0
      END as conversation_rate,
      CASE
        WHEN prev.engagement_last_week > 0
        THEN ((curr.engagement_this_week - prev.engagement_last_week)::float / prev.engagement_last_week * 100)
        ELSE NULL
      END as week_over_week_engagement_change,
      CASE
        WHEN prev.posts_last_week > 0
        THEN ((curr.posts_this_week - prev.posts_last_week)::float / prev.posts_last_week * 100)
        ELSE NULL
      END as week_over_week_posts_change
    FROM base_stats bs
    CROSS JOIN current_week curr
    CROSS JOIN previous_week prev
  `;

  const result = await pool.query(query, params);
  const row = result.rows[0];

  return {
    total_posts: parseInt(row.total_posts),
    total_likes: parseInt(row.total_likes),
    total_comments: parseInt(row.total_comments),
    total_shares: parseInt(row.total_shares),
    avg_likes: parseFloat(Number(row.avg_likes).toFixed(1)),
    avg_comments: parseFloat(Number(row.avg_comments).toFixed(1)),
    avg_shares: parseFloat(Number(row.avg_shares).toFixed(1)),
    max_likes: parseInt(row.max_likes),
    max_comments: parseInt(row.max_comments),
    engagement_rate: parseFloat(Number(row.engagement_rate).toFixed(1)),
    viral_score: parseFloat(Number(row.viral_score).toFixed(2)),
    conversation_rate: parseFloat(Number(row.conversation_rate).toFixed(1)),
    week_over_week_engagement_change: row.week_over_week_engagement_change
      ? parseFloat(Number(row.week_over_week_engagement_change).toFixed(1))
      : null,
    week_over_week_posts_change: row.week_over_week_posts_change
      ? parseFloat(Number(row.week_over_week_posts_change).toFixed(1))
      : null,
  };
}

/**
 * Get content insights (hashtags, posting times, content types)
 * All aggregations done in the database
 */
export async function getContentInsights(
  profileId?: number | null,
  workspaceId?: number | null
): Promise<ContentInsights> {
  let whereClause = '';
  let params: number[] = [];

  if (profileId) {
    whereClause = 'WHERE profile_id = $1';
    params = [profileId];
  } else if (workspaceId) {
    whereClause = `
      WHERE profile_id IN (
        SELECT profile_id FROM workspace_profiles WHERE workspace_id = $1
      )
    `;
    params = [workspaceId];
  }

  // Top hashtags
  const hashtagQuery = `
    SELECT
      hashtag,
      COUNT(*) as count,
      AVG(engagement_total) as avg_engagement
    FROM (
      SELECT DISTINCT ON (p.id, h.hashtag)
        p.id,
        h.hashtag,
        p.engagement_total
      FROM posts p
      CROSS JOIN LATERAL jsonb_array_elements_text(p.hashtags) AS h(hashtag)
      ${whereClause}
      AND p.published_at >= NOW() - INTERVAL '30 days'
    ) hashtag_posts
    GROUP BY hashtag
    ORDER BY avg_engagement DESC
    LIMIT 5
  `;

  // Best posting times
  const timingQuery = `
    SELECT
      CASE EXTRACT(DOW FROM published_at)
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
      END as day,
      EXTRACT(HOUR FROM published_at) as hour,
      COUNT(*) as post_count,
      AVG(engagement_total) as avg_engagement
    FROM posts
    ${whereClause}
    AND published_at >= NOW() - INTERVAL '30 days'
    GROUP BY EXTRACT(DOW FROM published_at), EXTRACT(HOUR FROM published_at)
    HAVING COUNT(*) >= 2
    ORDER BY avg_engagement DESC
    LIMIT 3
  `;

  // Content type performance
  const contentTypeQuery = `
    SELECT
      COALESCE(media_type, 'text') as media_type,
      COUNT(*) as post_count,
      AVG(engagement_total) as avg_engagement
    FROM posts
    ${whereClause}
    AND published_at >= NOW() - INTERVAL '30 days'
    GROUP BY media_type
    ORDER BY avg_engagement DESC
  `;

  const [hashtagResult, timingResult, contentTypeResult] = await Promise.all([
    pool.query(hashtagQuery, params),
    pool.query(timingQuery, params),
    pool.query(contentTypeQuery, params),
  ]);

  return {
    top_hashtags: hashtagResult.rows.map(row => ({
      hashtag: row.hashtag,
      count: parseInt(row.count),
      avg_engagement: parseFloat(Number(row.avg_engagement).toFixed(1)),
    })),
    best_posting_times: timingResult.rows.map(row => ({
      day: row.day,
      hour: parseInt(row.hour),
      avg_engagement: parseFloat(Number(row.avg_engagement).toFixed(1)),
      post_count: parseInt(row.post_count),
    })),
    content_type_performance: contentTypeResult.rows.map(row => ({
      media_type: row.media_type,
      post_count: parseInt(row.post_count),
      avg_engagement: parseFloat(Number(row.avg_engagement).toFixed(1)),
    })),
  };
}

/**
 * Get top posts with flexible sorting and filtering
 * Supports: top by engagement, recent posts, custom sort
 */
export async function getTopPostsEnhanced(options: {
  limit?: number;
  profileId?: number | null;
  workspaceId?: number | null;
  sortBy?: 'engagement_total' | 'published_at' | 'likes' | 'comments' | 'shares';
  order?: 'asc' | 'desc';
}): Promise<Post[]> {
  const {
    limit = 25,
    profileId = null,
    workspaceId = null,
    sortBy = 'engagement_total',
    order = 'desc',
  } = options;

  let whereClause = '';
  let params: number[];

  if (profileId) {
    whereClause = 'WHERE profile_id = $2 AND (is_repost = false OR is_repost IS NULL)';
    params = [limit, profileId];
  } else if (workspaceId) {
    whereClause = `
      WHERE profile_id IN (
        SELECT profile_id FROM workspace_profiles WHERE workspace_id = $2
      ) AND (is_repost = false OR is_repost IS NULL)
    `;
    params = [limit, workspaceId];
  } else {
    params = [limit];
  }

  const query = `
    SELECT
      id, post_url, content, content_preview, author_name, author_username,
      author_profile_url, published_at, likes, comments, shares, views,
      engagement_rate, engagement_total, hashtags, media_type, profile_id,
      COALESCE(platform, 'linkedin') as platform
    FROM posts
    ${whereClause}
    ORDER BY ${sortBy} ${order.toUpperCase()}
    LIMIT $1
  `;

  const result = await pool.query(query, params);
  return result.rows;
}

// ============================================================================
// PROFILE BACKGROUND FUNCTIONS (Added for LinkedIn Profile Scraping)
// ============================================================================

/**
 * Update profile with background data (email, location, summary, skills, etc.)
 */
export async function updateProfileBackground(
  profileId: number,
  data: {
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
    skills?: Array<{ name: string; endorsements?: number }>;
    languages?: Array<{ name: string; proficiency?: string }>;
    certifications?: Array<{ name: string; issuer?: string; issued_date?: string }>;
    honors_awards?: Array<{ title: string; issuer?: string; date?: string }>;
  }
): Promise<Profile> {
  const query = `
    UPDATE profiles
    SET
      email = COALESCE($2, email),
      phone = COALESCE($3, phone),
      location = COALESCE($4, location),
      summary = COALESCE($5, summary),
      skills = COALESCE($6, skills),
      languages = COALESCE($7, languages),
      certifications = COALESCE($8, certifications),
      honors_awards = COALESCE($9, honors_awards),
      profile_scraped_at = CURRENT_TIMESTAMP,
      profile_data_version = profile_data_version + 1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [
    profileId,
    data.email,
    data.phone,
    data.location,
    data.summary,
    data.skills ? JSON.stringify(data.skills) : null,
    data.languages ? JSON.stringify(data.languages) : null,
    data.certifications ? JSON.stringify(data.certifications) : null,
    data.honors_awards ? JSON.stringify(data.honors_awards) : null,
  ]);

  return result.rows[0];
}

/**
 * Add work experience to a profile
 */
export async function addProfileExperience(
  profileId: number,
  experience: {
    company_name: string;
    company_url?: string;
    company_logo_url?: string;
    title: string;
    employment_type?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
    description?: string;
    duration_months?: number;
  }
): Promise<ProfileExperience> {
  const query = `
    INSERT INTO profile_experiences (
      profile_id, company_name, company_url, company_logo_url, title,
      employment_type, location, start_date, end_date, is_current,
      description, duration_months
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `;

  const result = await pool.query(query, [
    profileId,
    experience.company_name,
    experience.company_url || null,
    experience.company_logo_url || null,
    experience.title,
    experience.employment_type || null,
    experience.location || null,
    experience.start_date || null,
    experience.end_date || null,
    experience.is_current || false,
    experience.description || null,
    experience.duration_months || null,
  ]);

  return result.rows[0];
}

/**
 * Add education to a profile
 */
export async function addProfileEducation(
  profileId: number,
  education: {
    school_name: string;
    school_url?: string;
    school_logo_url?: string;
    degree?: string;
    field_of_study?: string;
    start_year?: string;
    end_year?: string;
    grade?: string;
    activities?: string;
    description?: string;
  }
): Promise<ProfileEducation> {
  const query = `
    INSERT INTO profile_education (
      profile_id, school_name, school_url, school_logo_url, degree,
      field_of_study, start_year, end_year, grade, activities, description
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  const result = await pool.query(query, [
    profileId,
    education.school_name,
    education.school_url || null,
    education.school_logo_url || null,
    education.degree || null,
    education.field_of_study || null,
    education.start_year || null,
    education.end_year || null,
    education.grade || null,
    education.activities || null,
    education.description || null,
  ]);

  return result.rows[0];
}

/**
 * Get all work experiences for a profile
 */
export async function getProfileExperiences(profileId: number): Promise<ProfileExperience[]> {
  const query = `
    SELECT *
    FROM profile_experiences
    WHERE profile_id = $1
    ORDER BY is_current DESC, start_date DESC
  `;

  const result = await pool.query(query, [profileId]);
  return result.rows;
}

/**
 * Get all education for a profile
 */
export async function getProfileEducation(profileId: number): Promise<ProfileEducation[]> {
  const query = `
    SELECT *
    FROM profile_education
    WHERE profile_id = $1
    ORDER BY end_year DESC NULLS FIRST, start_year DESC
  `;

  const result = await pool.query(query, [profileId]);
  return result.rows;
}

/**
 * Get complete profile with all background data
 */
export async function getProfileComplete(profileId: number): Promise<{
  profile: Profile;
  experiences: ProfileExperience[];
  education: ProfileEducation[];
}> {
  const profile = await getProfile(profileId);
  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`);
  }

  const experiences = await getProfileExperiences(profileId);
  const education = await getProfileEducation(profileId);

  return {
    profile,
    experiences,
    education,
  };
}

/**
 * Delete all experiences for a profile (useful before re-scraping)
 */
export async function deleteProfileExperiences(profileId: number): Promise<void> {
  await pool.query('DELETE FROM profile_experiences WHERE profile_id = $1', [profileId]);
}

/**
 * Delete all education for a profile (useful before re-scraping)
 */
export async function deleteProfileEducation(profileId: number): Promise<void> {
  await pool.query('DELETE FROM profile_education WHERE profile_id = $1', [profileId]);
}

/**
 * Bulk import profile backgrounds from Apify scraper output
 */
export async function bulkImportProfileBackgrounds(
  profiles: Array<{
    profile_id: number;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
    skills?: Array<{ name: string; endorsements?: number }>;
    languages?: Array<{ name: string; proficiency?: string }>;
    certifications?: Array<{ name: string; issuer?: string; issued_date?: string }>;
    honors_awards?: Array<{ title: string; issuer?: string; date?: string }>;
    experiences?: Array<{
      company_name: string;
      company_url?: string;
      title: string;
      employment_type?: string;
      location?: string;
      start_date?: string;
      end_date?: string;
      is_current?: boolean;
      description?: string;
    }>;
    education?: Array<{
      school_name: string;
      degree?: string;
      field_of_study?: string;
      start_year?: string;
      end_year?: string;
    }>;
  }>
): Promise<{ updated: number; experiences_added: number; education_added: number }> {
  let updated = 0;
  let experiences_added = 0;
  let education_added = 0;

  for (const profileData of profiles) {
    // Update profile background fields
    await updateProfileBackground(profileData.profile_id, {
      email: profileData.email,
      phone: profileData.phone,
      location: profileData.location,
      summary: profileData.summary,
      skills: profileData.skills,
      languages: profileData.languages,
      certifications: profileData.certifications,
      honors_awards: profileData.honors_awards,
    });
    updated++;

    // Delete existing experiences and education (to avoid duplicates)
    await deleteProfileExperiences(profileData.profile_id);
    await deleteProfileEducation(profileData.profile_id);

    // Add experiences
    if (profileData.experiences) {
      for (const exp of profileData.experiences) {
        await addProfileExperience(profileData.profile_id, exp);
        experiences_added++;
      }
    }

    // Add education
    if (profileData.education) {
      for (const edu of profileData.education) {
        await addProfileEducation(profileData.profile_id, edu);
        education_added++;
      }
    }
  }

  return { updated, experiences_added, education_added };
}

// ============================================================================
// YOUTUBE FUNCTIONS
// ============================================================================

export interface YouTubeVideo {
  id: string;
  post_url: string;
  title: string;
  content: string;
  author_name: string;
  author_username: string;
  published_at: Date;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  engagement_total: number;
  video_duration: number | null;
  transcript_language: string | null;
  profile_id: number;
}

export interface YouTubeChannel {
  id: number;
  username: string;
  display_name: string;
  profile_type: string;
  follower_count: number | null;
  video_count: number;
}

export interface YouTubeStats {
  total_videos: number;
  total_channels: number;
  with_transcripts: number;
  total_views: number;
  total_likes: number;
}

/**
 * Get YouTube videos with search/sort/pagination
 */
export async function getYouTubeVideos(options: {
  search?: string;
  sortBy?: 'published_at' | 'views' | 'likes' | 'engagement_total';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  channelId?: number | null;
  workspaceId?: number | null;
}): Promise<{ videos: YouTubeVideo[]; total: number }> {
  const {
    search = '',
    sortBy = 'published_at',
    order = 'desc',
    limit = 50,
    offset = 0,
    channelId,
    workspaceId,
  } = options;

  let whereClause = "p.platform = 'youtube'";
  const params: (string | number)[] = [];

  if (channelId) {
    whereClause += ` AND p.profile_id = $${params.length + 1}`;
    params.push(channelId);
  }

  if (workspaceId) {
    whereClause += ` AND p.profile_id IN (SELECT profile_id FROM workspace_profiles WHERE workspace_id = $${params.length + 1})`;
    params.push(workspaceId);
  }

  if (search) {
    whereClause += ` AND (p.title ILIKE $${params.length + 1} OR p.content ILIKE $${params.length + 1})`;
    params.push(`%${search}%`);
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM posts p WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  params.push(limit, offset);
  const query = `
    SELECT
      p.id, p.post_url, p.title, p.content, p.author_name, p.author_username,
      p.published_at, p.likes, p.comments, p.shares, p.views,
      p.engagement_total, p.video_duration, p.transcript_language, p.profile_id
    FROM posts p
    WHERE ${whereClause}
    ORDER BY p.${sortBy} ${order.toUpperCase()}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const result = await pool.query(query, params);
  return { videos: result.rows, total };
}

/**
 * Get YouTube channels (profiles with username starting with @)
 */
export async function getYouTubeChannels(): Promise<YouTubeChannel[]> {
  const query = `
    SELECT
      pr.id, pr.username, pr.display_name, pr.profile_type, pr.follower_count,
      COUNT(p.id) as video_count
    FROM profiles pr
    LEFT JOIN posts p ON pr.id = p.profile_id AND p.platform = 'youtube'
    WHERE pr.username LIKE '@%'
    GROUP BY pr.id
    ORDER BY video_count DESC, pr.display_name
  `;
  const result = await pool.query(query);
  return result.rows.map(r => ({ ...r, video_count: parseInt(r.video_count) }));
}

/**
 * Get aggregate YouTube stats
 */
export async function getYouTubeStats(workspaceId?: number | null): Promise<YouTubeStats> {
  let whereClause = "p.platform = 'youtube'";
  const params: number[] = [];

  if (workspaceId) {
    whereClause += ` AND p.profile_id IN (SELECT profile_id FROM workspace_profiles WHERE workspace_id = $1)`;
    params.push(workspaceId);
  }

  const query = `
    SELECT
      COUNT(*) as total_videos,
      COUNT(DISTINCT p.profile_id) as total_channels,
      COUNT(*) FILTER (WHERE p.transcript_language IS NOT NULL) as with_transcripts,
      COALESCE(SUM(p.views), 0) as total_views,
      COALESCE(SUM(p.likes), 0) as total_likes
    FROM posts p
    WHERE ${whereClause}
  `;

  const result = await pool.query(query, params);
  const row = result.rows[0];
  return {
    total_videos: parseInt(row.total_videos),
    total_channels: parseInt(row.total_channels),
    with_transcripts: parseInt(row.with_transcripts),
    total_views: parseInt(row.total_views),
    total_likes: parseInt(row.total_likes),
  };
}

// Export pool for direct access in API routes if needed
export { pool };
