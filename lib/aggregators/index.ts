import { getActiveContentSources, getTopics, saveArticle, updateContentSource, ContentSource, NewsArticle, Topic, getAllWorkspacesForSource, linkArticleToWorkspace } from '../intelligence';
import { aggregateRSS } from './rss';
import { aggregateNewsAPI } from './newsapi';
import { analyzeArticleWithAI } from '../ai/article-analyzer';
import { detectSignals } from '../ai/signal-detector';
import { getProfiles, Profile } from '../db';

// Main aggregation function - called by cron job
export async function aggregateContent(): Promise<{
  success: boolean;
  articlesProcessed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let articlesProcessed = 0;

  try {
    const sources = await getActiveContentSources();

    console.log(`Starting content aggregation from ${sources.length} sources`);

    for (const source of sources) {
      try {
        const articles = await fetchFromSource(source);

        console.log(`Fetched ${articles.length} articles from ${source.name}`);

        // Process each article
        for (const article of articles) {
          try {
            await processArticle(article);
            articlesProcessed++;
          } catch (error) {
            const errorMsg = `Failed to process article "${article.title}": ${error}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          }
        }

        // Update last fetched timestamp
        await updateLastFetched(source.id);

      } catch (error) {
        const errorMsg = `Failed to aggregate from ${source.name}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log(`Content aggregation completed: ${articlesProcessed} articles processed`);

    return {
      success: errors.length === 0,
      articlesProcessed,
      errors,
    };

  } catch (error) {
    const errorMsg = `Fatal error in content aggregation: ${error}`;
    console.error(errorMsg);
    return {
      success: false,
      articlesProcessed,
      errors: [errorMsg, ...errors],
    };
  }
}

// Fetch articles from a specific source
async function fetchFromSource(source: ContentSource): Promise<NewsArticle[]> {
  switch (source.type) {
    case 'rss':
      return await aggregateRSS(source);

    case 'newsapi':
      return await aggregateNewsAPI(source);

    case 'reddit':
      // TODO: Implement Reddit aggregation
      return [];

    case 'twitter':
      // TODO: Implement Twitter aggregation
      return [];

    default:
      throw new Error(`Unknown source type: ${source.type}`);
  }
}

// Process a single article: match to profiles/topics, analyze with AI, save
async function processArticle(article: NewsArticle): Promise<void> {
  // Get all profiles and topics for matching
  const profiles = await getProfiles();
  const topics = await getTopics();

  // Match article to profiles (companies/people mentioned)
  const matchedProfiles = matchProfilesToArticle(article, profiles);

  // Match article to topics
  const matchedTopics = matchTopicsToArticle(article, topics);

  // Get ALL workspaces for this source (many-to-many)
  const workspaceIds = article.source_id
    ? await getAllWorkspacesForSource(article.source_id)
    : [];

  // AI analysis (relevance, sentiment, entities, key points)
  const analysis = await analyzeArticleWithAI(
    article,
    matchedProfiles,
    matchedTopics
  );

  // Build enriched article (workspace_id = undefined, will use junction table)
  const enrichedArticle: NewsArticle = {
    ...article,
    profile_id: matchedProfiles[0]?.id,  // Primary profile
    workspace_id: undefined,  // Don't store workspace on article
    topic_ids: matchedTopics.map(t => t.id),
    relevance_score: analysis.relevance_score,
    sentiment_score: analysis.sentiment_score,
    category: analysis.category,
    entities: analysis.entities,
    key_points: analysis.key_points,
  };

  // Save article to database
  const savedArticle = await saveArticle(enrichedArticle);

  // Link article to all relevant workspaces
  if (savedArticle.id) {
    for (const workspaceId of workspaceIds) {
      await linkArticleToWorkspace(savedArticle.id, workspaceId);
    }

    // Detect intelligence signals for each workspace
    for (const workspaceId of workspaceIds) {
      await detectSignals({ ...savedArticle, workspace_id: workspaceId }, analysis);
    }
  }
}

// Match article to profiles based on company/person names
function matchProfilesToArticle(
  article: NewsArticle,
  profiles: Profile[]
): Profile[] {
  const text = `${article.title} ${article.description || ''}`.toLowerCase();

  return profiles.filter(profile => {
    const name = profile.display_name.toLowerCase();
    const username = profile.username.toLowerCase();

    // Check if profile name or username is mentioned
    return text.includes(name) || text.includes(username);
  });
}

// Match article to topics based on keywords
function matchTopicsToArticle(
  article: NewsArticle,
  topics: Topic[]
): Topic[] {
  const text = `${article.title} ${article.description || ''}`.toLowerCase();

  return topics.filter(topic => {
    // Check if any keyword from topic appears in article
    return topic.keywords.some(keyword =>
      text.includes(keyword.toLowerCase())
    );
  });
}

// Update last fetched timestamp for a source
async function updateLastFetched(sourceId: number): Promise<void> {
  await updateContentSource(sourceId, {
    last_fetched_at: new Date(),
  });
}
