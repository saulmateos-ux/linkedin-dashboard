'use client';

import { NewsArticle } from '@/lib/intelligence';
import { formatDistanceToNow } from 'date-fns';

export default function NewsFeed({ articles }: { articles: NewsArticle[] }) {
  if (articles.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-gray-500">
        <p className="text-lg mb-2">No articles found</p>
        <p className="text-sm">
          Try adjusting your filters or check back later for new content.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}

function ArticleCard({ article }: { article: NewsArticle }) {
  const sentimentColor = article.sentiment_score
    ? article.sentiment_score > 0.3
      ? 'bg-green-100 text-green-800'
      : article.sentiment_score < -0.3
      ? 'bg-red-100 text-red-800'
      : 'bg-gray-100 text-gray-800'
    : 'bg-gray-100 text-gray-800';

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start gap-4">
        {article.image_url && (
          <img
            src={article.image_url}
            alt=""
            className="w-32 h-32 object-cover rounded flex-shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600"
            >
              {article.title}
            </a>
          </h3>

          {article.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">
              {article.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
            <span className="font-medium">Source: {article.source_id}</span>
            <span>•</span>
            <span>
              {formatDistanceToNow(new Date(article.published_at))} ago
            </span>
            {article.author && (
              <>
                <span>•</span>
                <span>by {article.author}</span>
              </>
            )}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {article.category && (
              <span className={`px-2 py-1 rounded text-xs ${sentimentColor}`}>
                {article.category.replace('_', ' ')}
              </span>
            )}

            {article.relevance_score && article.relevance_score >= 0.7 && (
              <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                {Math.round(article.relevance_score * 100)}% relevant
              </span>
            )}

            {article.entities?.companies?.slice(0, 3).map((company) => (
              <span
                key={company}
                className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800"
              >
                {company}
              </span>
            ))}

            {article.entities?.people?.slice(0, 2).map((person) => (
              <span
                key={person}
                className="px-2 py-1 rounded text-xs bg-indigo-100 text-indigo-800"
              >
                👤 {person}
              </span>
            ))}
          </div>

          {/* Key points */}
          {article.key_points && article.key_points.length > 0 && (
            <ul className="mt-3 text-sm space-y-1">
              {article.key_points.slice(0, 3).map((point, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-600 flex-shrink-0">→</span>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
