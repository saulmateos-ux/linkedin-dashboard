import Link from 'next/link';
import { Post } from '@/lib/db';

interface PostsTableProps {
  posts: Post[];
  title?: string;
  showAll?: boolean;
}

export default function PostsTable({ posts, title = "Top Posts", showAll = false }: PostsTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {!showAll && (
          <Link
            href="/posts"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </Link>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Content</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Published</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">👍 Likes</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">💬 Comments</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">🔄 Shares</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <a
                    href={post.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-900 hover:text-blue-600 line-clamp-2"
                  >
                    {post.content_preview || post.content?.substring(0, 100) || '(No content)'}
                  </a>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                  {new Date(post.published_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </td>
                <td className="py-3 px-4 text-center text-sm font-medium text-green-600">
                  {post.likes.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-center text-sm font-medium text-blue-600">
                  {post.comments.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-center text-sm font-medium text-yellow-600">
                  {post.shares.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-sm font-bold text-gray-900">
                  {post.engagement_total.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
