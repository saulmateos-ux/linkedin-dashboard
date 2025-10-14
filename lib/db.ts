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
  published_at: Date;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  engagement_rate: number;
  engagement_total: number;
  hashtags: string[];
  media_type: string;
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
 * Get overall statistics from all posts
 */
export async function getStats(): Promise<Stats> {
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
  `;

  const result = await pool.query(query);
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
 * Get top performing posts
 */
export async function getTopPosts(limit: number = 10): Promise<Post[]> {
  const query = `
    SELECT
      id, post_url, content, content_preview, author_name, author_username,
      published_at, likes, comments, shares, views, engagement_rate,
      engagement_total, hashtags, media_type
    FROM posts
    ORDER BY engagement_total DESC
    LIMIT $1
  `;

  const result = await pool.query(query, [limit]);
  return result.rows;
}

/**
 * Get all posts with optional search and pagination
 */
export async function getPosts(options: {
  search?: string;
  sortBy?: 'published_at' | 'likes' | 'comments' | 'shares' | 'engagement_total';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}): Promise<{ posts: Post[]; total: number }> {
  const {
    search = '',
    sortBy = 'published_at',
    order = 'desc',
    limit = 50,
    offset = 0,
  } = options;

  let whereClause = '1=1';
  const params: (string | number)[] = [];

  if (search) {
    whereClause += ` AND (content ILIKE $${params.length + 1} OR author_name ILIKE $${params.length + 1})`;
    params.push(`%${search}%`);
  }

  // Get total count
  const countQuery = `SELECT COUNT(*) FROM posts WHERE ${whereClause}`;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  // Get posts
  params.push(limit, offset);
  const postsQuery = `
    SELECT
      id, post_url, content, content_preview, author_name, author_username,
      published_at, likes, comments, shares, views, engagement_rate,
      engagement_total, hashtags, media_type
    FROM posts
    WHERE ${whereClause}
    ORDER BY ${sortBy} ${order.toUpperCase()}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const result = await pool.query(postsQuery, params);

  return {
    posts: result.rows,
    total,
  };
}

/**
 * Get engagement data over time for charts
 */
export async function getEngagementOverTime(days: number = 30): Promise<EngagementData[]> {
  const query = `
    SELECT
      DATE(published_at) as date,
      SUM(likes) as likes,
      SUM(comments) as comments,
      SUM(shares) as shares
    FROM posts
    WHERE published_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(published_at)
    ORDER BY date ASC
  `;

  const result = await pool.query(query);
  return result.rows.map(row => ({
    date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    likes: parseInt(row.likes),
    comments: parseInt(row.comments),
    shares: parseInt(row.shares),
  }));
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
