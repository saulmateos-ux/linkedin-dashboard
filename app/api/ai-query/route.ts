/**
 * AI Query API Route
 * Enables ChatGPT-powered analytics for LinkedIn data
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  getTrendingHashtags,
  getCompetitiveIntel,
  getTopicPerformance,
  getPostingPatterns,
  getRecentActivity,
  getStats,
  getTopPosts,
  getWorkspace,
  getWorkspaceProfiles,
  pool,
} from '@/lib/db';

// Configure route for longer timeout (AI queries can take time)
export const maxDuration = 60; // 1 minute
export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Type for function call results
interface FunctionResult {
  name: string;
  data: unknown;
}

/**
 * POST /api/ai-query
 * Process user questions about LinkedIn data using GPT
 */
export async function POST(request: Request) {
  try {
    const { question, conversationHistory = [], workspaceId } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    console.log('AI Query:', question);
    console.log('Workspace ID:', workspaceId);

    // Load workspace information for context
    let workspaceInfo = null;
    let workspaceProfiles = null;
    if (workspaceId) {
      try {
        workspaceInfo = await getWorkspace(workspaceId);
        if (workspaceInfo) {
          workspaceProfiles = await getWorkspaceProfiles(workspaceId);
          console.log(`Workspace: ${workspaceInfo.name} (${workspaceProfiles.length} profiles)`);
        }
      } catch (error) {
        console.error('Error loading workspace:', error);
        // Continue without workspace context if it fails
      }
    }

    // Define available functions for GPT to call
    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'get_trending_hashtags',
          description: 'Get the most popular and trending hashtags from the last 30 days with engagement metrics',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Number of hashtags to return (default: 10)',
                minimum: 1,
                maximum: 50,
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_competitive_intel',
          description: 'Compare performance metrics across all tracked profiles (yours and competitors)',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_topic_performance',
          description: 'Get engagement metrics for each hashtag/topic to see what performs best',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Number of topics to return (default: 20)',
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_posting_patterns',
          description: 'Analyze the best days and times to post based on historical engagement data',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_recent_activity',
          description: 'Get daily summary of posts and engagement from the last 7 days',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_overall_stats',
          description: 'Get overall statistics including total posts, likes, comments, shares, and averages',
          parameters: {
            type: 'object',
            properties: {
              profile_id: {
                type: 'number',
                description: 'Optional profile ID to filter stats for a specific profile',
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_top_posts',
          description: 'Get the highest performing posts by engagement. Can filter by profile_id. To filter by author name (e.g. "Saul Mateos"), use query_database instead with WHERE author_name = \'...\' clause.',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Number of posts to return (default: 10)',
              },
              profile_id: {
                type: 'number',
                description: 'Optional profile ID to filter for specific profile',
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'query_database',
          description: 'Execute a custom SQL query on the posts database. Use for complex analysis not covered by other functions. CRITICAL: Use "author_name" column (NOT "author"). Use "published_at" column (NOT "date_posted"). For partial name matching use ILIKE: WHERE author_name ILIKE \'%Saul%\'',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'SQL query to execute (SELECT only). MUST use correct columns: author_name, published_at. Example for "last 5 posts from saul": SELECT * FROM posts WHERE author_name ILIKE \'%Saul%\' ORDER BY published_at DESC LIMIT 5',
              },
            },
            required: ['query'],
          },
        },
      },
    ];

    // Build dynamic system prompt with workspace context
    let systemPrompt = `You are an AI assistant specialized in LinkedIn analytics and content strategy.`;

    // Add workspace-specific context if available
    if (workspaceInfo && workspaceProfiles && workspaceProfiles.length > 0) {
      systemPrompt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 IMPORTANT - YOU ARE ANALYZING A SPECIFIC WORKSPACE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Workspace: "${workspaceInfo.name}"
${workspaceInfo.description ? `Description: ${workspaceInfo.description}` : ''}

Profiles in this workspace (ONLY analyze data from these profiles):
${workspaceProfiles.map(p => `  • ${p.display_name || p.username} (@${p.username})${p.profile_type ? ` - ${p.profile_type}` : ''}`).join('\n')}

CRITICAL FILTERING RULES:
- ONLY consider posts from the ${workspaceProfiles.length} profile(s) listed above
- When referring to performance, speak as if you represent "${workspaceInfo.name}"
- Do NOT include data from other profiles in the database
- All insights, comparisons, and recommendations should be workspace-specific
- If comparing profiles, only compare within this workspace
- Be explicit that your analysis is limited to this workspace

Context: You are providing insights for the owner/manager of the "${workspaceInfo.name}" workspace.`;
    } else {
      systemPrompt += ` You have access to a database of LinkedIn posts from multiple profiles.`;
    }

    systemPrompt += `

Your capabilities:
- Analyze trending hashtags and topics
- Compare performance across profiles${workspaceInfo ? ' (within the workspace)' : ''}
- Identify the best times to post
- Provide content strategy recommendations
- Find top-performing posts
- Answer questions about engagement metrics

When providing insights:
- Be specific with numbers and percentages
- Compare metrics to provide context
- Offer actionable recommendations
- Highlight interesting patterns or anomalies
- Keep responses concise but informative
${workspaceInfo ? `- Always remember you are analyzing the "${workspaceInfo.name}" workspace specifically` : ''}

DATABASE SCHEMA (posts table):
- id: Post ID (primary key)
- post_url: LinkedIn post URL
- content: Full post text
- content_preview: First 100 chars
- author_name: Author's full name (e.g. "Saul Mateos", "Nicolas Boucher")
- author_username: LinkedIn username
- published_at: Post publication date
- likes: Number of likes
- comments: Number of comments
- shares: Number of shares
- views: Number of views
- engagement_total: Total engagement (likes + comments + shares)
- engagement_rate: Engagement rate percentage
- hashtags: JSON array of hashtags
- media_type: 'text' or 'image'
- profile_id: Foreign key to profiles table
- scraped_at: When data was scraped
- created_at: Record creation timestamp
- updated_at: Record update timestamp

IMPORTANT COLUMN NAMES:
- For author filtering: Use "author_name" column (NOT "author", NOT "name")
- For date filtering: Use "published_at" column (NOT "date_posted", NOT "date")
- For ordering: Use "ORDER BY published_at DESC" for recent posts

AUTHOR NAME EXAMPLES:
- Full names in database: "Saul Mateos", "Nicolas Boucher"
- When user asks about "saul" or "nicolas", use ILIKE for partial matching:
  WHERE author_name ILIKE '%Saul%'
  WHERE author_name ILIKE '%Nicolas%'

SQL QUERY EXAMPLES:
- Last 5 posts from Saul: SELECT * FROM posts WHERE author_name ILIKE '%Saul%' ORDER BY published_at DESC LIMIT 5
- Top posts from Nicolas: SELECT * FROM posts WHERE author_name ILIKE '%Nicolas%' ORDER BY engagement_total DESC LIMIT 10

Use the available functions to query the database and provide data-driven insights. For custom queries, use the query_database function with correct column names from the schema above.`;

    // Build conversation messages
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...conversationHistory,
      {
        role: 'user',
        content: question,
      },
    ];

    // First API call to GPT-5 Chat (non-reasoning version)
    // GPT-5 released August 2025 - significantly better reasoning, 45% less hallucination
    // Using gpt-5-chat-latest: same quality without visible reasoning tokens
    const response = await openai.chat.completions.create({
      model: 'gpt-5-chat-latest',
      messages,
      tools,
      tool_choice: 'auto',
    });

    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    // If GPT doesn't need to call any functions
    if (!toolCalls || toolCalls.length === 0) {
      return NextResponse.json({
        answer: responseMessage.content || 'I apologize, but I could not generate a response.',
        data: null,
      });
    }

    // Execute all function calls
    const functionResults: FunctionResult[] = [];

    for (const toolCall of toolCalls) {
      // Type guard for function tool calls
      if (toolCall.type !== 'function') continue;

      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      console.log(`Calling function: ${functionName}`, functionArgs);

      let functionResult: unknown;

      try {
        switch (functionName) {
          case 'get_trending_hashtags':
            functionResult = await getTrendingHashtags(functionArgs.limit || 10, workspaceId);
            break;

          case 'get_competitive_intel':
            functionResult = await getCompetitiveIntel(workspaceId);
            break;

          case 'get_topic_performance':
            functionResult = await getTopicPerformance(functionArgs.limit || 20, workspaceId);
            break;

          case 'get_posting_patterns':
            functionResult = await getPostingPatterns(workspaceId);
            break;

          case 'get_recent_activity':
            functionResult = await getRecentActivity(workspaceId);
            break;

          case 'get_overall_stats':
            functionResult = await getStats(functionArgs.profile_id || null, workspaceId);
            break;

          case 'get_top_posts':
            functionResult = await getTopPosts(
              functionArgs.limit || 10,
              functionArgs.profile_id || null,
              workspaceId
            );
            break;

          case 'query_database':
            // Validate it's a SELECT query only (security)
            const query = functionArgs.query.trim().toUpperCase();
            if (!query.startsWith('SELECT')) {
              throw new Error('Only SELECT queries are allowed');
            }
            // If workspace is selected, wrap query to filter by workspace profiles
            let finalQuery = functionArgs.query;
            if (workspaceId && workspaceProfiles && workspaceProfiles.length > 0) {
              const profileIds = workspaceProfiles.map(p => p.id).join(',');
              // Add workspace filter to query (inject WHERE clause if not exists, or AND if exists)
              if (finalQuery.toUpperCase().includes('WHERE')) {
                finalQuery = finalQuery.replace(/WHERE/i, `WHERE profile_id IN (${profileIds}) AND`);
              } else if (finalQuery.toUpperCase().includes('FROM posts')) {
                finalQuery = finalQuery.replace(/FROM posts/i, `FROM posts WHERE profile_id IN (${profileIds})`);
              }
            }
            const result = await pool.query(finalQuery);
            functionResult = result.rows;
            break;

          default:
            functionResult = { error: `Unknown function: ${functionName}` };
        }

        functionResults.push({
          name: functionName,
          data: functionResult,
        });
      } catch (error) {
        console.error(`Error executing ${functionName}:`, error);
        functionResults.push({
          name: functionName,
          data: { error: error instanceof Error ? error.message : 'Unknown error' },
        });
      }
    }

    // Build messages for second API call with function results
    const secondMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      ...messages,
      responseMessage,
      ...toolCalls.map((toolCall, index) => ({
        role: 'tool' as const,
        tool_call_id: toolCall.id,
        content: JSON.stringify(functionResults[index].data),
      })),
    ];

    // Second API call to get final answer
    const secondResponse = await openai.chat.completions.create({
      model: 'gpt-5-chat-latest',
      messages: secondMessages,
    });

    const finalAnswer = secondResponse.choices[0].message.content;

    return NextResponse.json({
      answer: finalAnswer || 'I analyzed the data but could not generate a response.',
      data: functionResults.length === 1 ? functionResults[0].data : functionResults,
      functionsCalled: functionResults.map((f) => f.name),
    });
  } catch (error) {
    console.error('AI Query error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check for OpenAI API errors
    if (errorMessage.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API key is invalid or missing' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to process your question',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai-query
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'AI Query API is operational',
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  });
}
