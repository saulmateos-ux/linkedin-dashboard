import { ContentSource, NewsArticle } from '../intelligence';

interface NewsAPIResponse {
  status: string;
  results?: NewsAPIArticle[];
  totalResults?: number;
}

interface NewsAPIArticle {
  title: string;
  description?: string;
  content?: string;
  link: string;
  pubDate: string;
  creator?: string[];
  image_url?: string;
  source_id?: string;
}

export async function aggregateNewsAPI(source: ContentSource): Promise<NewsArticle[]> {
  const apiKey = source.config?.apiKey as string || process.env.NEWSDATA_API_KEY;

  if (!apiKey) {
    throw new Error('NewsAPI requires an API key');
  }

  const query = source.config?.query as string || '';
  const language = source.config?.language as string || 'en';

  try {
    const url = `https://newsdata.io/api/1/news?` +
      `apikey=${apiKey}&` +
      `q=${encodeURIComponent(query)}&` +
      `language=${language}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`NewsAPI returned ${response.status}: ${response.statusText}`);
    }

    const data: NewsAPIResponse = await response.json();

    if (data.status !== 'success' || !data.results) {
      throw new Error('NewsAPI returned no results');
    }

    const articles: NewsArticle[] = data.results.map((item) => ({
      title: item.title,
      description: item.description,
      content: item.content,
      url: item.link,
      source_id: source.id,
      published_at: new Date(item.pubDate),
      author: item.creator?.[0],
      image_url: item.image_url,
    }));

    return articles;
  } catch (error) {
    console.error(`Failed to aggregate NewsAPI from ${source.name}:`, error);
    throw error;
  }
}
