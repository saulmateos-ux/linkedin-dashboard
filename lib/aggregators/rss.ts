import Parser from 'rss-parser';
import { ContentSource, NewsArticle } from '../intelligence';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['enclosure', 'enclosure'],
    ]
  }
});

export async function aggregateRSS(source: ContentSource): Promise<NewsArticle[]> {
  if (!source.url) {
    throw new Error('RSS source must have a URL');
  }

  try {
    const feed = await parser.parseURL(source.url);

    const articles: NewsArticle[] = [];

    for (const item of feed.items) {
      // Skip items without links
      if (!item.link) continue;

      // Extract image URL from various sources
      let imageUrl: string | undefined;

      // Try media:content
      if (item.media && Array.isArray(item.media)) {
        imageUrl = item.media[0]?.$ ?.url;
      }

      // Try enclosure
      if (!imageUrl && item.enclosure?.url) {
        imageUrl = item.enclosure.url;
      }

      // Try content snippet for images
      if (!imageUrl && item.content) {
        const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) {
          imageUrl = imgMatch[1];
        }
      }

      articles.push({
        title: item.title || 'Untitled',
        description: item.contentSnippet || item.summary || undefined,
        content: item.content || undefined,
        url: item.link,
        source_id: source.id,
        published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
        author: item.creator || (item as { author?: string }).author || undefined,
        image_url: imageUrl,
      });
    }

    return articles;
  } catch (error) {
    console.error(`Failed to aggregate RSS from ${source.name}:`, error);
    throw error;
  }
}
