import OpenAI from 'openai';
import { NewsArticle, Topic } from '../intelligence';
import { Profile } from '../db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AnalysisResult {
  relevance_score: number;
  sentiment_score: number;
  category: string;
  entities: {
    companies: string[];
    people: string[];
    products: string[];
  };
  key_points: string[];
}

export async function analyzeArticleWithAI(
  article: NewsArticle,
  profiles: Profile[],
  topics: Topic[]
): Promise<AnalysisResult> {
  try {
    const prompt = buildAnalysisPrompt(article, profiles, topics);

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    const analysis: AnalysisResult = JSON.parse(content);

    // Validate and normalize scores
    analysis.relevance_score = Math.max(0, Math.min(1, analysis.relevance_score));
    analysis.sentiment_score = Math.max(-1, Math.min(1, analysis.sentiment_score));

    return analysis;

  } catch (error) {
    console.error('AI analysis failed:', error);

    // Return default analysis on error
    return {
      relevance_score: 0.5,
      sentiment_score: 0,
      category: 'other',
      entities: {
        companies: [],
        people: [],
        products: [],
      },
      key_points: [],
    };
  }
}

function buildAnalysisPrompt(
  article: NewsArticle,
  profiles: Profile[],
  topics: Topic[]
): string {
  const profileNames = profiles.map(p => p.display_name).join(', ') || 'None';
  const topicNames = topics.map(t => t.name).join(', ') || 'None';

  return `Analyze this news article and extract intelligence:

**Article Details:**
Title: ${article.title}
Description: ${article.description || 'N/A'}
${article.content ? `Content Preview: ${article.content.substring(0, 500)}...` : ''}

**Context:**
Tracked Companies: ${profileNames}
Tracked Topics: ${topicNames}

**Instructions:**
Extract the following information and return it as JSON:

{
  "relevance_score": 0.85,  // 0.00-1.00: How relevant is this to tracked companies/topics?
  "sentiment_score": 0.3,   // -1.00 to 1.00: Negative to positive sentiment
  "category": "funding",    // Options: funding, product_launch, partnership, hiring, regulation, acquisition, leadership_change, other
  "entities": {
    "companies": ["Company A", "Company B"],  // Companies explicitly mentioned
    "people": ["Person Name"],                // People explicitly mentioned
    "products": ["Product Name"]              // Products explicitly mentioned
  },
  "key_points": [
    "First key point summarizing the article",
    "Second key point",
    "Third key point"
  ]  // 2-4 bullet points summarizing the most important information
}

**Scoring Guidelines:**
- relevance_score:
  - 0.9-1.0: Directly about a tracked company/topic
  - 0.7-0.9: Mentions tracked company/topic significantly
  - 0.5-0.7: Related to tracked topics but indirect
  - 0.3-0.5: Loosely related
  - 0.0-0.3: Not relevant

- sentiment_score:
  - 0.7-1.0: Very positive (major achievement, success)
  - 0.3-0.7: Somewhat positive (good news, progress)
  - -0.3-0.3: Neutral (factual reporting)
  - -0.7--0.3: Somewhat negative (challenges, concerns)
  - -1.0--0.7: Very negative (major setback, crisis)

**Important:**
- Only include entities explicitly mentioned in the article
- key_points should be concise (max 15 words each)
- Choose the most specific category that fits
- Be conservative with relevance scores (avoid inflating)

Return only the JSON object, no additional text.`;
}
