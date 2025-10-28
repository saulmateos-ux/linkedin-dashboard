import { getPosts, getProfiles, getWorkspace, getWorkspaceProfiles, getWorkspacePosts } from '@/lib/db';
import SortablePostsTable from '@/components/SortablePostsTable';
import SearchBar from '@/components/SearchBar';
import ExportButton from '@/components/ExportButton';
import ProfileSelector from '@/components/ProfileSelector';
import PostsFilterPanel from '@/components/PostsFilterPanel';

export const revalidate = 3600; // Revalidate every hour

interface PageProps {
  searchParams: Promise<{
    search?: string;
    sortBy?: 'published_at' | 'likes' | 'comments' | 'shares' | 'engagement_total';
    order?: 'asc' | 'desc';
    page?: string;
    profile?: string;
    workspace?: string;
    dateFrom?: string;
    dateTo?: string;
    minLikes?: string;
    minComments?: string;
    minShares?: string;
    minEngagement?: string;
    mediaType?: string;
    hashtag?: string;
  }>;
}

export default async function PostsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search || '';
  const sortBy = params.sortBy || 'published_at';
  const order = params.order || 'desc';
  const page = parseInt(params.page || '1');
  const profileIdParam = params.profile;
  const workspaceIdParam = params.workspace;
  const limit = 25;
  const offset = (page - 1) * limit;

  // Filter parameters
  const filters = {
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    minLikes: params.minLikes ? parseInt(params.minLikes) : undefined,
    minComments: params.minComments ? parseInt(params.minComments) : undefined,
    minShares: params.minShares ? parseInt(params.minShares) : undefined,
    minEngagement: params.minEngagement ? parseInt(params.minEngagement) : undefined,
    mediaType: params.mediaType,
    hashtag: params.hashtag,
  };

  // Check if workspace is selected
  const workspaceId = workspaceIdParam ? parseInt(workspaceIdParam) : null;
  const workspace = workspaceId ? await getWorkspace(workspaceId) : null;

  // Get profiles (filtered by workspace if applicable)
  const profiles = workspace
    ? await getWorkspaceProfiles(workspace.id)
    : await getProfiles();

  // Parse profileId
  const profileId = profileIdParam && profileIdParam !== 'all' ? parseInt(profileIdParam) : undefined;

  // Fetch posts based on workspace or profile
  let posts, total;
  if (workspace) {
    const result = await getWorkspacePosts(workspace.id, {
      search,
      sortBy,
      order,
      limit,
      offset,
      ...filters,
    });
    posts = result.posts;
    total = result.total;
  } else {
    const result = await getPosts({
      search,
      sortBy,
      order,
      limit,
      offset,
      profileId,
      ...filters,
    });
    posts = result.posts;
    total = result.total;
  }

  const totalPages = Math.ceil(total / limit);
  const currentProfile = profileId ? profiles.find(p => p.id === profileId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Posts</h1>
          <p className="text-gray-600 mt-1">
            {total.toLocaleString()} total posts
            {workspace ? (
              <span> from workspace: <span className="font-medium" style={{ color: workspace.color }}>{workspace.name}</span></span>
            ) : currentProfile ? (
              ` from ${currentProfile.display_name}`
            ) : null}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {!workspace && <ProfileSelector profiles={profiles} currentProfileId={profileId} />}
          <ExportButton search={search} sortBy={sortBy} order={order} />
        </div>
      </div>

      {/* Search and Filters */}
      <SearchBar currentSort={sortBy} currentOrder={order} currentSearch={search} />

      {/* Advanced Filter Panel */}
      <PostsFilterPanel />

      {/* Posts Table */}
      {posts.length > 0 ? (
        <>
          <SortablePostsTable posts={posts} showAll />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4">
              <a
                href={`/posts?search=${search}&sortBy=${sortBy}&order=${order}&page=${page - 1}${workspace ? `&workspace=${workspace.id}` : profileIdParam ? `&profile=${profileIdParam}` : ''}`}
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
                href={`/posts?search=${search}&sortBy=${sortBy}&order=${order}&page=${page + 1}${workspace ? `&workspace=${workspace.id}` : profileIdParam ? `&profile=${profileIdParam}` : ''}`}
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
