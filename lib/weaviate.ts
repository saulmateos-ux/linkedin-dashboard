import weaviate, { WeaviateClient, ApiKey } from 'weaviate-ts-client';

let client: WeaviateClient | null = null;

/**
 * Get Weaviate client instance (singleton)
 */
export function getWeaviateClient(): WeaviateClient {
  if (client) return client;

  if (!process.env.WEAVIATE_URL || !process.env.WEAVIATE_API_KEY) {
    throw new Error('Weaviate credentials not configured. Add WEAVIATE_URL and WEAVIATE_API_KEY to .env');
  }

  client = weaviate.client({
    scheme: 'https',
    host: process.env.WEAVIATE_URL.replace('https://', ''),
    apiKey: new ApiKey(process.env.WEAVIATE_API_KEY),
    headers: {
      'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY || '',
    },
  });

  return client;
}

/**
 * Initialize Weaviate schema
 * Creates collections for Posts, Entities, and Topics
 */
export async function initializeWeaviateSchema() {
  const client = getWeaviateClient();

  // Check if schema already exists
  const schema = await client.schema.getter().do();
  const existingClasses = schema.classes?.map(c => c.class) || [];

  // Create Post class
  if (!existingClasses.includes('Post')) {
    await client.schema
      .classCreator()
      .withClass({
        class: 'Post',
        description: 'LinkedIn posts and content',
        vectorizer: 'text2vec-openai',
        moduleConfig: {
          'text2vec-openai': {
            model: 'text-embedding-3-small',
            modelVersion: '3',
            type: 'text',
          },
        },
        properties: [
          {
            name: 'postId',
            dataType: ['text'],
            description: 'Unique post ID from database',
          },
          {
            name: 'content',
            dataType: ['text'],
            description: 'Full post content',
          },
          {
            name: 'authorName',
            dataType: ['text'],
            description: 'Author display name',
          },
          {
            name: 'authorUsername',
            dataType: ['text'],
            description: 'Author LinkedIn username',
          },
          {
            name: 'publishedAt',
            dataType: ['date'],
            description: 'Publication timestamp',
          },
          {
            name: 'likes',
            dataType: ['int'],
            description: 'Number of likes',
          },
          {
            name: 'comments',
            dataType: ['int'],
            description: 'Number of comments',
          },
          {
            name: 'shares',
            dataType: ['int'],
            description: 'Number of shares',
          },
          {
            name: 'engagementTotal',
            dataType: ['int'],
            description: 'Total engagement score',
          },
          {
            name: 'hashtags',
            dataType: ['text[]'],
            description: 'Hashtags mentioned',
          },
          {
            name: 'postUrl',
            dataType: ['text'],
            description: 'LinkedIn post URL',
          },
          {
            name: 'profileId',
            dataType: ['int'],
            description: 'Profile ID from database',
          },
          {
            name: 'workspaceIds',
            dataType: ['int[]'],
            description: 'Workspace IDs this post belongs to',
          },
        ],
      })
      .do();

    console.log('✅ Created Post class in Weaviate');
  }

  // Create Entity class (companies, people, products mentioned)
  if (!existingClasses.includes('Entity')) {
    await client.schema
      .classCreator()
      .withClass({
        class: 'Entity',
        description: 'Extracted entities (companies, people, products, technologies)',
        vectorizer: 'text2vec-openai',
        properties: [
          {
            name: 'name',
            dataType: ['text'],
            description: 'Entity name',
          },
          {
            name: 'type',
            dataType: ['text'],
            description: 'Entity type: company, person, product, technology, concept',
          },
          {
            name: 'description',
            dataType: ['text'],
            description: 'Entity description or context',
          },
          {
            name: 'mentionCount',
            dataType: ['int'],
            description: 'Number of times mentioned across all posts',
          },
          {
            name: 'firstSeen',
            dataType: ['date'],
            description: 'First time this entity appeared',
          },
          {
            name: 'lastSeen',
            dataType: ['date'],
            description: 'Most recent mention',
          },
        ],
      })
      .do();

    console.log('✅ Created Entity class in Weaviate');
  }

  // Create Topic class (themes, trends)
  if (!existingClasses.includes('Topic')) {
    await client.schema
      .classCreator()
      .withClass({
        class: 'Topic',
        description: 'Topics and themes extracted from content',
        vectorizer: 'text2vec-openai',
        properties: [
          {
            name: 'name',
            dataType: ['text'],
            description: 'Topic name',
          },
          {
            name: 'description',
            dataType: ['text'],
            description: 'Topic description',
          },
          {
            name: 'category',
            dataType: ['text'],
            description: 'Topic category (e.g., AI, Healthcare, Finance)',
          },
          {
            name: 'trendScore',
            dataType: ['number'],
            description: 'Trending score (higher = more trending)',
          },
          {
            name: 'postCount',
            dataType: ['int'],
            description: 'Number of posts about this topic',
          },
          {
            name: 'avgEngagement',
            dataType: ['number'],
            description: 'Average engagement for posts on this topic',
          },
        ],
      })
      .do();

    console.log('✅ Created Topic class in Weaviate');
  }

  console.log('🎉 Weaviate schema initialized successfully');
  return true;
}

/**
 * Add a post to Weaviate
 */
export async function addPostToWeaviate(post: {
  id: string;
  content: string;
  author_name: string;
  author_username: string;
  published_at: string;
  likes: number;
  comments: number;
  shares: number;
  engagement_total: number;
  hashtags: string[];
  post_url: string;
  profile_id: number;
  workspace_ids?: number[];
}) {
  const client = getWeaviateClient();

  const result = await client.data
    .creator()
    .withClassName('Post')
    .withProperties({
      postId: post.id,
      content: post.content,
      authorName: post.author_name,
      authorUsername: post.author_username,
      publishedAt: new Date(post.published_at).toISOString(),
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      engagementTotal: post.engagement_total,
      hashtags: post.hashtags,
      postUrl: post.post_url,
      profileId: post.profile_id,
      workspaceIds: post.workspace_ids || [],
    })
    .do();

  return result;
}

/**
 * Search posts by semantic meaning
 */
export async function searchPosts(query: string, limit: number = 10, filters?: {
  workspaceIds?: number[];
  profileIds?: number[];
  minEngagement?: number;
  startDate?: string;
  endDate?: string;
}) {
  const client = getWeaviateClient();

  let queryBuilder = client.graphql
    .get()
    .withClassName('Post')
    .withNearText({ concepts: [query] })
    .withLimit(limit)
    .withFields('postId content authorName authorUsername publishedAt likes comments shares engagementTotal hashtags postUrl _additional { certainty distance }');

  // Add filters if provided
  if (filters) {
    interface WhereFilter {
      path: string[];
      operator: 'GreaterThanEqual' | 'And' | 'Or' | 'Equal' | 'Like' | 'NotEqual' | 'GreaterThan' | 'LessThan' | 'LessThanEqual' | 'WithinGeoRange' | 'IsNull' | 'ContainsAny' | 'ContainsAll';
      valueInt?: number | number[];
      valueDate?: string;
    }
    const whereFilters: WhereFilter[] = [];

    if (filters.workspaceIds && filters.workspaceIds.length > 0) {
      whereFilters.push({
        path: ['workspaceIds'],
        operator: 'ContainsAny',
        valueInt: filters.workspaceIds,
      });
    }

    if (filters.profileIds && filters.profileIds.length > 0) {
      whereFilters.push({
        path: ['profileId'],
        operator: 'Equal',
        valueInt: filters.profileIds,
      });
    }

    if (filters.minEngagement) {
      whereFilters.push({
        path: ['engagementTotal'],
        operator: 'GreaterThanEqual',
        valueInt: filters.minEngagement,
      });
    }

    if (filters.startDate) {
      whereFilters.push({
        path: ['publishedAt'],
        operator: 'GreaterThanEqual',
        valueDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      whereFilters.push({
        path: ['publishedAt'],
        operator: 'LessThanEqual',
        valueDate: filters.endDate,
      });
    }

    if (whereFilters.length > 0) {
      queryBuilder = queryBuilder.withWhere({
        operator: 'And',
        operands: whereFilters as Parameters<typeof queryBuilder.withWhere>[0]['operands'],
      });
    }
  }

  const result = await queryBuilder.do();
  return result.data.Get.Post;
}

/**
 * Find similar posts to a given post
 */
export async function findSimilarPosts(postId: string, limit: number = 5) {
  const client = getWeaviateClient();

  // First, find the post to get its vector
  const post = await client.data
    .getterById()
    .withClassName('Post')
    .withId(postId)
    .do();

  if (!post) {
    throw new Error(`Post ${postId} not found in Weaviate`);
  }

  // Find similar posts
  const result = await client.graphql
    .get()
    .withClassName('Post')
    .withNearObject({ id: postId })
    .withLimit(limit + 1) // +1 to exclude the original post
    .withFields('postId content authorName publishedAt likes comments shares engagementTotal _additional { certainty }')
    .do();

  // Filter out the original post
  interface SimilarPost {
    postId: string;
    content: string;
    authorName: string;
    publishedAt: string;
    likes: number;
    comments: number;
    shares: number;
    engagementTotal: number;
    _additional: { certainty: number };
  }
  const similarPosts = result.data.Get.Post.filter((p: SimilarPost) => p.postId !== postId);
  return similarPosts.slice(0, limit);
}

/**
 * Get trending topics from recent posts
 */
export async function getTrendingTopics(days: number = 7, limit: number = 10) {
  const client = getWeaviateClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await client.graphql
    .aggregate()
    .withClassName('Post')
    .withWhere({
      path: ['publishedAt'],
      operator: 'GreaterThanEqual',
      valueDate: startDate.toISOString(),
    })
    .withFields('hashtags { count topOccurrences(limit: 50) { value occurs } }')
    .do();

  return result.data.Aggregate.Post;
}

export default {
  getWeaviateClient,
  initializeWeaviateSchema,
  addPostToWeaviate,
  searchPosts,
  findSimilarPosts,
  getTrendingTopics,
};
