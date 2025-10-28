'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SearchResult {
  postId: string;
  content: string;
  authorName: string;
  authorUsername: string;
  publishedAt: string;
  likes: number;
  comments: number;
  shares: number;
  engagementTotal: number;
  hashtags: string[];
  postUrl: string;
  _additional?: {
    certainty?: number;
    distance?: number;
  };
}

export default function SemanticSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTime, setSearchTime] = useState<number | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const response = await fetch('/api/search/semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 20 }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);
      setSearchTime(performance.now() - startTime);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries = [
    'AI automation in healthcare',
    'revenue cycle management trends',
    'CFO challenges and solutions',
    'digital transformation in finance',
    'legal technology innovations',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🧠 Semantic Search
              </h1>
              <p className="text-gray-600 mt-2">
                Search by meaning, not just keywords - powered by Weaviate + OpenAI
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Search Box */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <form onSubmit={handleSearch}>
            <div className="flex gap-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What are you looking for? (e.g., 'AI automation in healthcare')"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Example Queries */}
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-3">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((example) => (
                <button
                  key={example}
                  onClick={() => setQuery(example)}
                  className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Search Stats */}
          {searchTime !== null && (
            <div className="mt-4 text-sm text-gray-600">
              Found {results.length} results in {searchTime.toFixed(0)}ms
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h3 className="text-red-900 font-bold mb-2">Search Error</h3>
            <p className="text-red-700">{error}</p>
            <p className="text-red-600 text-sm mt-2">
              Make sure Weaviate is configured and the sync script has been run.
            </p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Search Results
            </h2>
            {results.map((result, index) => (
              <div
                key={result.postId}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-blue-600">
                        #{index + 1}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {result.authorName}
                      </span>
                      <span className="text-gray-500 text-sm">
                        @{result.authorUsername}
                      </span>
                      {result._additional?.certainty && (
                        <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {(result._additional.certainty * 100).toFixed(1)}% match
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                      {result.content}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>❤️ {result.likes} likes</span>
                      <span>💬 {result.comments} comments</span>
                      <span>🔁 {result.shares} shares</span>
                      <span>📊 {result.engagementTotal} total</span>
                      <span className="ml-auto">
                        {new Date(result.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {result.hashtags && result.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {result.hashtags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <a
                  href={result.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View on LinkedIn →
                </a>
              </div>
            ))}
          </div>
        ) : !loading && query && (
          <div className="bg-gray-50 rounded-lg p-12 text-center">
            <p className="text-gray-600 text-lg">No results found for &ldquo;{query}&rdquo;</p>
            <p className="text-gray-500 text-sm mt-2">
              Try rephrasing your query or using different keywords
            </p>
          </div>
        )}

        {/* How It Works */}
        {!query && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 border border-blue-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              🎯 How Semantic Search Works
            </h3>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🧠</span>
                <div>
                  <p className="font-semibold">Meaning-based, not keyword-based</p>
                  <p className="text-sm text-gray-600">
                    Searches by understanding what you mean, not just matching words
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="font-semibold">Lightning fast</p>
                  <p className="text-sm text-gray-600">
                    Returns results in milliseconds using vector similarity
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎨</span>
                <div>
                  <p className="font-semibold">Context-aware</p>
                  <p className="text-sm text-gray-600">
                    Understands synonyms, related concepts, and industry jargon
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
