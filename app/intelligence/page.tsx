'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import AppHeader from '@/layout/AppHeader';
import AppSidebar from '@/layout/AppSidebar';
import DynamicMain from '@/components/DynamicMain';

interface SearchPost {
  authorName: string;
  authorUsername: string;
  publishedAt: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
}

interface IntelligenceResponse {
  query: string;
  optimizedQuery: string;
  answer: string;
  keyThemes: string[];
  results: SearchPost[];
  resultCount: number;
  metadata: {
    postsAnalyzed: number;
    totalRelevant: number;
    workspaceName?: string | null;
    timeRange?: string | null;
  };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  response?: IntelligenceResponse;
}

interface Workspace {
  id: number;
  name: string;
  description: string | null;
}

export default function IntelligencePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('month');

  useEffect(() => {
    // Fetch workspaces
    fetch('/api/workspaces')
      .then((res) => res.json())
      .then((data) => {
        if (data.workspaces) {
          setWorkspaces(data.workspaces);
        }
      })
      .catch((error) => console.error('Error fetching workspaces:', error));
  }, []);

  const exampleQuestions = [
    'What are the top trends in healthcare AI?',
    'How are companies using automation in RCM?',
    'What challenges are CFOs facing?',
    'What are people saying about legal technology?',
    'Summarize the main topics discussed in the last month',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const response = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          workspaceId: selectedWorkspace || null,
          timeRange: selectedTimeRange,
        }),
      });

      if (!response.ok) throw new Error('Query failed');

      const data: IntelligenceResponse = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        response: data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your query. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (question: string) => {
    setQuery(question);
  };

  return (
    <>
      <AppHeader />
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <DynamicMain>
          <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:to-gray-800">
            {/* Header */}
            <div className="bg-white dark:bg-boxdark border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
              <div className="max-w-5xl mx-auto px-8 py-4">
                <Link
                  href="/"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2 inline-block"
                >
                  ← Back to Dashboard
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    🤖 AI Intelligence Assistant
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    Ask questions, get insights - powered by Weaviate + GPT-4
                  </p>
                </div>
              </div>
            </div>

      <div className="max-w-5xl mx-auto px-8 py-6">
        {/* Messages */}
        {messages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              👋 Welcome to Your AI Intelligence Assistant
            </h2>
            <p className="text-gray-700 mb-6">
              I can analyze your LinkedIn posts and provide strategic insights. Ask me anything!
            </p>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                🎯 What I Can Do:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-sm text-gray-700">Identify industry trends and patterns</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-sm text-gray-700">Analyze competitor strategies</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-sm text-gray-700">Extract key themes and topics</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-sm text-gray-700">Provide actionable recommendations</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                💡 Try asking:
              </h3>
              <div className="space-y-2">
                {exampleQuestions.map((question) => (
                  <button
                    key={question}
                    onClick={() => handleExampleClick(question)}
                    className="block w-full text-left bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-gray-700 px-4 py-3 rounded-lg transition-colors text-sm border border-blue-200"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white ml-auto'
                    : 'bg-white border border-gray-200'
                } rounded-lg p-4 max-w-4xl ${
                  message.role === 'user' ? 'text-right' : ''
                }`}
              >
                {message.role === 'user' ? (
                  <p className="text-sm">{message.content}</p>
                ) : (
                  <div>
                    <div className="prose prose-sm max-w-none text-gray-800">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>

                    {message.response && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {/* Key Themes */}
                        {message.response.keyThemes && message.response.keyThemes.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-gray-600 mb-2">
                              Key Themes:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {message.response.keyThemes.map((theme, idx) => (
                                <span
                                  key={idx}
                                  className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium"
                                >
                                  {theme}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>
                            Analyzed {message.response.metadata.postsAnalyzed} of{' '}
                            {message.response.metadata.totalRelevant} relevant posts
                          </p>
                          {(message.response.metadata.workspaceName || message.response.metadata.timeRange) && (
                            <p className="text-blue-600">
                              Filters:{' '}
                              {message.response.metadata.workspaceName && (
                                <span>Workspace: {message.response.metadata.workspaceName}</span>
                              )}
                              {message.response.metadata.workspaceName && message.response.metadata.timeRange && ' • '}
                              {message.response.metadata.timeRange && (
                                <span>
                                  Time: {
                                    {
                                      week: 'Last Week',
                                      month: 'Last Month',
                                      '3months': 'Last 3 Months',
                                      '6months': 'Last 6 Months',
                                      year: 'Last Year',
                                    }[message.response.metadata.timeRange] || message.response.metadata.timeRange
                                  }
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-4xl">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600">
                    Analyzing posts and generating insights...
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input Box */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sticky bottom-4">
          {/* Filters */}
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Workspace
              </label>
              <select
                value={selectedWorkspace}
                onChange={(e) => setSelectedWorkspace(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">All Workspaces</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Time Range
              </label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="year">Last Year</option>
                <option value="">All Time</option>
              </select>
            </div>
          </div>

          {/* Query Input */}
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask me anything about your LinkedIn data..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Ask'}
            </button>
          </form>
        </div>
      </div>
          </div>
        </DynamicMain>
      </div>
    </>
  );
}
