import { NextResponse } from 'next/server';
import { searchPosts } from '@/lib/weaviate';
import OpenAI from 'openai';

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/intelligence
 * AI-powered intelligence queries using Weaviate + OpenAI
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, workspaceId, limit = 20, timeRange = null } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log('Intelligence Query:', query);
    console.log('Workspace ID:', workspaceId);
    console.log('Time Range:', timeRange);

    // Step 1: Use AI to enhance the search query
    const enhancedQuery = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a search query optimizer for LinkedIn posts.
Extract key concepts and expand synonyms to improve semantic search results.
Return ONLY the optimized search query, nothing else.`,
        },
        {
          role: 'user',
          content: `Original query: "${query}"\n\nOptimize this for semantic search:`,
        },
      ],
      temperature: 0.3,
    });

    const optimizedQuery = enhancedQuery.choices[0].message.content || query;
    console.log('Optimized Query:', optimizedQuery);

    // Step 2: Semantic search in Weaviate
    const filters: { workspaceIds?: number[]; startDate?: string } = {};
    if (workspaceId) {
      filters.workspaceIds = [parseInt(workspaceId)];
    }

    // Add time filtering
    if (timeRange) {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case '3months':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case '6months':
          startDate = new Date(now.setMonth(now.getMonth() - 6));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(now.setMonth(now.getMonth() - 1)); // Default to 1 month
      }

      filters.startDate = startDate.toISOString();
    }

    const searchResults = await searchPosts(optimizedQuery, limit, filters);
    console.log(`Found ${searchResults.length} results with filters:`, filters);

    if (searchResults.length === 0) {
      return NextResponse.json({
        success: true,
        query,
        optimizedQuery,
        answer: "I couldn't find any relevant posts for your query. Try rephrasing or broadening your search.",
        results: [],
        resultCount: 0,
      });
    }

    // Step 3: Prepare context for AI analysis
    interface SearchResult {
      authorName: string;
      authorUsername: string;
      publishedAt: string;
      likes: number;
      comments: number;
      shares: number;
      content: string;
      hashtags?: string[];
    }

    const postsContext = searchResults
      .slice(0, 10) // Use top 10 for context
      .map((post: SearchResult, idx: number) => {
        return `
Post ${idx + 1}:
Author: ${post.authorName} (@${post.authorUsername})
Date: ${new Date(post.publishedAt).toLocaleDateString()}
Engagement: ${post.likes} likes, ${post.comments} comments, ${post.shares} shares
Content: ${post.content.substring(0, 500)}${post.content.length > 500 ? '...' : ''}
Hashtags: ${post.hashtags?.join(', ') || 'None'}
---`;
      })
      .join('\n');

    // Step 4: Build context-aware system prompt
    let contextInfo = '';
    let workspaceName = '';

    if (workspaceId) {
      // Fetch workspace name for better context
      try {
        const { pool } = await import('@/lib/db');
        const workspaceResult = await pool.query(
          'SELECT name, description FROM workspaces WHERE id = $1',
          [workspaceId]
        );
        if (workspaceResult.rows.length > 0) {
          workspaceName = workspaceResult.rows[0].name;
          const desc = workspaceResult.rows[0].description;
          contextInfo += `\n- Workspace: "${workspaceName}"${desc ? ` (${desc})` : ''}`;
        } else {
          contextInfo += `\n- Workspace filter: Posts from workspace ID ${workspaceId}`;
        }
      } catch (error) {
        console.error('Error fetching workspace name:', error);
        contextInfo += `\n- Workspace filter: Posts from workspace ID ${workspaceId}`;
      }
    }

    if (timeRange) {
      const timeRangeLabels: Record<string, string> = {
        week: 'last 7 days',
        month: 'last 30 days',
        '3months': 'last 3 months',
        '6months': 'last 6 months',
        year: 'last year',
      };
      contextInfo += `\n- Time filter: Posts from ${timeRangeLabels[timeRange] || 'recent period'}`;
    }

    // Step 5: AI Analysis with improved prompt
    const analysis = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert industry intelligence analyst specializing in LinkedIn content analysis.

**Your analysis approach:**
1. **Context-aware**: Consider the filters applied (workspace, time range) when analyzing
2. **Trend identification**: Look for patterns across multiple posts, not just individual examples
3. **Strategic insights**: Focus on "why" things matter, not just "what" is happening
4. **Actionable recommendations**: Provide specific, implementable next steps
5. **Evidence-based**: Reference specific posts when making claims
6. **Concise clarity**: Use bullet points and markdown for readability

**Quality standards:**
- If posts are from a specific workspace, focus analysis on that context
- If posts are time-filtered, identify temporal trends and recent changes
- Always cite engagement metrics when relevant (likes, comments, shares)
- Avoid generic observations - be specific to the data provided
- If data is insufficient for the query, say so clearly

**Response format:**
- Use markdown headings (##) to organize sections
- Use bullet points (-) for lists
- Bold key insights (**text**)
- Keep paragraphs short (2-3 sentences max)

**Filters applied to this query:**${contextInfo || '\n- None (analyzing all available posts)'}`,
        },
        {
          role: 'user',
          content: `**User Query:** "${query}"

**Dataset:** ${searchResults.length} semantically relevant posts (analyzing top 10 in detail)

**Posts for analysis:**

${postsContext}

**Instructions:** Answer the user's question based on these posts. Focus your analysis on the specific context provided by the filters. If the query asks about trends or topics, identify patterns across multiple posts. If it asks about a specific workspace or time period, ensure your insights reflect that scope.`,
        },
      ],
      temperature: 0.7,
    });

    const answer = analysis.choices[0].message.content;

    // Step 5: Extract key entities and themes
    const themes = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Extract 3-5 key themes from the posts. Return as JSON array of strings.',
        },
        {
          role: 'user',
          content: postsContext,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    let keyThemes: string[] = [];
    try {
      const themesData = JSON.parse(themes.choices[0].message.content || '{}');
      keyThemes = themesData.themes || [];
    } catch {
      keyThemes = [];
    }

    return NextResponse.json({
      success: true,
      query,
      optimizedQuery,
      answer,
      keyThemes,
      results: searchResults.slice(0, 5), // Return top 5 full results
      resultCount: searchResults.length,
      metadata: {
        postsAnalyzed: Math.min(10, searchResults.length),
        totalRelevant: searchResults.length,
        workspaceName: workspaceName || null,
        timeRange: timeRange || null,
      },
    });
  } catch (error) {
    console.error('Error in intelligence query:', error);
    return NextResponse.json(
      {
        error: 'Intelligence query failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
