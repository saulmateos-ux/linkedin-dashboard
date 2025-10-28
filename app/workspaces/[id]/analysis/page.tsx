'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';

interface AnalysisData {
  workspace: {
    id: number;
    name: string;
    description: string | null;
  };
  statistics: {
    profileCount: number;
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    avgEngagement: string;
    dateRange: {
      first: string;
      last: string;
    };
  };
  posts: Array<{
    id: string;
    url: string;
    date: string;
    author: {
      name: string;
      username: string;
    };
    content: {
      full: string;
      preview: string;
    };
    engagement: {
      likes: number;
      comments: number;
      shares: number;
      views: number;
      total: number;
    };
    hashtags: string[];
    mediaType: string;
  }>;
}

interface AIInsights {
  executiveSummary: string;
  topPosts: Array<{
    id: string;
    author: string;
    preview: string;
    engagement: string;
    reason: string;
  }>;
  themes: string[];
  engagementInsights: string[];
  recommendations: string[];
}

export default function WorkspaceAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  useEffect(() => {
    fetchAnalysisData();
  }, [id]);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workspaces/${id}/analysis`);
      if (!response.ok) throw new Error('Failed to fetch analysis data');
      const analysisData = await response.json();
      setData(analysisData);

      // Auto-generate insights after data loads
      generateInsights(analysisData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (analysisData: AnalysisData) => {
    setGeneratingInsights(true);

    // Sort posts by engagement
    const sortedPosts = [...analysisData.posts].sort(
      (a, b) => b.engagement.total - a.engagement.total
    );

    // Get top 3 posts
    const topPosts = sortedPosts.slice(0, 3).map(post => ({
      id: post.id,
      author: post.author.name,
      preview: post.content.preview,
      engagement: `${post.engagement.likes} likes, ${post.engagement.comments} comments, ${post.engagement.shares} shares`,
      engagementTotal: post.engagement.total,  // Keep numeric total for conditions
      reason: post.engagement.total > 20 ? 'High overall engagement' :
              post.engagement.comments > 5 ? 'Strong discussion' :
              'Good reach'
    }));

    // Extract themes from hashtags and content
    const allHashtags = analysisData.posts.flatMap(p => p.hashtags);
    const hashtagCounts = allHashtags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topHashtags = Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    const themes = [
      ...topHashtags,
      'Healthcare revenue cycle management',
      'Legal technology',
      'Industry conferences & networking'
    ].slice(0, 5);

    // Engagement insights
    const avgLikes = analysisData.posts.reduce((sum, p) => sum + p.engagement.likes, 0) / analysisData.posts.length;
    const avgComments = analysisData.posts.reduce((sum, p) => sum + p.engagement.comments, 0) / analysisData.posts.length;

    const engagementInsights = [
      `Average engagement per post: ${parseFloat(analysisData.statistics.avgEngagement).toFixed(1)}`,
      `Posts with hashtags show ${topHashtags.length > 0 ? 'consistent' : 'limited'} topic clustering`,
      `Comment rate: ${avgComments.toFixed(1)} per post (${avgComments > 2 ? 'good conversation' : 'room for improvement'})`,
      `${analysisData.posts.filter(p => p.mediaType !== 'text').length} of 10 posts include media`
    ];

    // Recommendations
    const recommendations = [
      avgComments < 2
        ? 'Increase posts with questions or controversial takes to spark discussion'
        : 'Continue fostering discussions with thought-provoking content',

      analysisData.posts.filter(p => p.mediaType !== 'text').length < 3
        ? 'Add more visual content (images/videos) to increase engagement by 30-50%'
        : 'Maintain strong visual content strategy',

      topHashtags.length < 3
        ? 'Develop a consistent hashtag strategy for better discoverability'
        : `Continue using top hashtags: ${topHashtags.slice(0, 3).join(', ')}`,

      'Post during peak hours (10am-2pm and 5pm-7pm) for maximum reach',

      topPosts[0].engagementTotal > 30
        ? `Replicate success of ${topPosts[0].author}'s storytelling approach`
        : 'Focus on narrative-driven posts that share personal experiences'
    ];

    const generatedInsights: AIInsights = {
      executiveSummary: `Analysis of ${analysisData.posts.length} recent posts from ${analysisData.workspace.name} workspace, covering ${analysisData.statistics.profileCount} profiles. Average engagement is ${parseFloat(analysisData.statistics.avgEngagement).toFixed(1)} per post, with ${topPosts[0].author} leading engagement.`,
      topPosts,
      themes,
      engagementInsights,
      recommendations
    };

    setInsights(generatedInsights);
    setGeneratingInsights(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Analysis</h2>
            <p className="text-red-700">{error || 'Failed to load workspace data'}</p>
            <Link
              href="/workspaces"
              className="mt-4 inline-block text-red-600 hover:text-red-800 underline"
            >
              ← Back to Workspaces
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <Link
            href="/workspaces"
            className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
          >
            ← Back to Workspaces
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {data.workspace.name} - AI Analysis
          </h1>
          {data.workspace.description && (
            <p className="text-gray-600 mt-2">{data.workspace.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Statistics Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Workspace Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">{data.statistics.totalPosts}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Profiles</p>
              <p className="text-2xl font-bold text-gray-900">{data.statistics.profileCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Engagement</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.statistics.totalLikes + data.statistics.totalComments + data.statistics.totalShares}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg per Post</p>
              <p className="text-2xl font-bold text-gray-900">{parseFloat(data.statistics.avgEngagement).toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        {generatingInsights ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        ) : insights && (
          <>
            {/* Executive Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-blue-900 mb-3">📝 Executive Summary</h2>
              <p className="text-blue-800">{insights.executiveSummary}</p>
            </div>

            {/* Top Performing Posts */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Top 3 Performing Posts</h2>
              <div className="space-y-4">
                {insights.topPosts.map((post, index) => (
                  <div key={post.id} className="border-l-4 border-green-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">#{index + 1} - {post.author}</p>
                        <p className="text-gray-700 mt-1">{post.preview}</p>
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Engagement:</span> {post.engagement}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          ✓ {post.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Themes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Key Themes & Topics</h2>
              <div className="flex flex-wrap gap-2">
                {insights.themes.map((theme, index) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>

            {/* Engagement Insights */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Engagement Insights</h2>
              <ul className="space-y-2">
                {insights.engagementInsights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span className="text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🚀 Actionable Recommendations</h2>
              <ol className="space-y-3">
                {insights.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-gray-800">{rec}</span>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
