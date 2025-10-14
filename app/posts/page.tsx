import { getPosts } from '@/lib/db';
import PostsTable from '@/components/PostsTable';
import SearchBar from '@/components/SearchBar';
import ExportButton from '@/components/ExportButton';

export const revalidate = 3600; // Revalidate every hour

interface PageProps {
  searchParams: Promise<{
    search?: string;
    sortBy?: 'published_at' | 'likes' | 'comments' | 'shares' | 'engagement_total';
    order?: 'asc' | 'desc';
    page?: string;
  }>;
}

export default async function PostsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search || '';
  const sortBy = params.sortBy || 'published_at';
  const order = params.order || 'desc';
  const page = parseInt(params.page || '1');
  const limit = 25;
  const offset = (page - 1) * limit;

  const { posts, total } = await getPosts({
    search,
    sortBy,
    order,
    limit,
    offset,
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Posts</h1>
          <p className="text-gray-600 mt-1">
            {total.toLocaleString()} total posts
          </p>
        </div>
        <ExportButton search={search} sortBy={sortBy} order={order} />
      </div>

      {/* Search and Filters */}
      <SearchBar currentSort={sortBy} currentOrder={order} currentSearch={search} />

      {/* Posts Table */}
      {posts.length > 0 ? (
        <>
          <PostsTable posts={posts} showAll />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4">
              <a
                href={`/posts?search=${search}&sortBy=${sortBy}&order=${order}&page=${page - 1}`}
                className={`px-4 py-2 rounded-lg font-medium ${
                  page <= 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
                aria-disabled={page <= 1}
              >
                ← Previous
              </a>
              <span className="text-gray-700">
                Page {page} of {totalPages}
              </span>
              <a
                href={`/posts?search=${search}&sortBy=${sortBy}&order=${order}&page=${page + 1}`}
                className={`px-4 py-2 rounded-lg font-medium ${
                  page >= totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
                aria-disabled={page >= totalPages}
              >
                Next →
              </a>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg">No posts found</p>
          {search && (
            <a href="/posts" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
              Clear search
            </a>
          )}
        </div>
      )}
    </div>
  );
}
