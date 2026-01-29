import { getYouTubeVideos, getYouTubeChannels, getYouTubeStats, getWorkspace } from '@/lib/db';
import Link from 'next/link';
import AppHeader from '@/layout/AppHeader';
import AppSidebar from '@/layout/AppSidebar';
import DynamicMain from '@/components/DynamicMain';

export const revalidate = 3600;

interface PageProps {
  searchParams: Promise<{ search?: string; sort?: string; order?: string; page?: string; channel?: string; workspace?: string }>;
}

export default async function YouTubePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search || '';
  const sortBy = (params.sort as 'published_at' | 'views' | 'likes' | 'engagement_total') || 'published_at';
  const order = (params.order as 'asc' | 'desc') || 'desc';
  const page = parseInt(params.page || '1');
  const channelId = params.channel ? parseInt(params.channel) : null;
  const workspaceId = params.workspace ? parseInt(params.workspace) : null;
  const workspace = workspaceId ? await getWorkspace(workspaceId) : null;
  const limit = 50;
  const offset = (page - 1) * limit;

  const [{ videos, total }, channels, stats] = await Promise.all([
    getYouTubeVideos({ search, sortBy, order, limit, offset, channelId, workspaceId }),
    getYouTubeChannels(),
    getYouTubeStats(workspaceId),
  ]);

  const totalPages = Math.ceil(total / limit);

  function formatDuration(seconds: number | null) {
    if (!seconds) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const buildUrl = (overrides: Record<string, string>) => {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (sortBy !== 'published_at') p.set('sort', sortBy);
    if (order !== 'desc') p.set('order', order);
    if (channelId) p.set('channel', String(channelId));
    if (workspaceId) p.set('workspace', String(workspaceId));
    Object.entries(overrides).forEach(([k, v]) => { if (v) p.set(k, v); else p.delete(k); });
    const qs = p.toString();
    return `/youtube${qs ? `?${qs}` : ''}`;
  };

  return (
    <>
      <AppHeader />
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <DynamicMain>
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                  YouTube Videos
                </h2>
                {workspace && (
                  <span className="text-sm text-gray-500">Workspace: {workspace.name}</span>
                )}
              </div>
              <Link
                href={workspaceId ? `/youtube/channels?workspace=${workspaceId}` : '/youtube/channels'}
                className="rounded bg-primary px-4 py-2 text-sm text-white hover:bg-opacity-90"
              >
                View Channels
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5 mb-6">
              {[
                { label: 'Videos', value: stats.total_videos },
                { label: 'Channels', value: stats.total_channels },
                { label: 'With Transcripts', value: stats.with_transcripts },
                { label: 'Total Views', value: stats.total_views.toLocaleString() },
                { label: 'Total Likes', value: stats.total_likes.toLocaleString() },
              ].map((s) => (
                <div key={s.label} className="rounded-sm border border-stroke bg-white px-5 py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                  <h4 className="text-title-md font-bold text-black dark:text-white">{s.value}</h4>
                  <span className="text-sm font-medium">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-wrap gap-3">
              <form method="get" action="/youtube" className="flex gap-2">
                {workspaceId && <input type="hidden" name="workspace" value={workspaceId} />}
                {channelId && <input type="hidden" name="channel" value={channelId} />}
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="Search videos..."
                  className="rounded border border-stroke bg-transparent px-4 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
                />
                <button type="submit" className="rounded bg-primary px-4 py-2 text-sm text-white">Search</button>
              </form>

              <select
                onChange={`window.location.href='${buildUrl({})}'.replace('sort=${sortBy}','sort='+this.value)` as never}
                className="rounded border border-stroke bg-transparent px-3 py-2 text-sm dark:border-strokedark dark:bg-boxdark"
                defaultValue={sortBy}
              >
                <option value="published_at">Date</option>
                <option value="views">Views</option>
                <option value="likes">Likes</option>
                <option value="engagement_total">Engagement</option>
              </select>

              {channelId && (
                <Link href={buildUrl({ channel: '' })} className="rounded bg-gray-200 px-3 py-2 text-sm dark:bg-meta-4 dark:text-white">
                  Clear Channel Filter
                </Link>
              )}
            </div>

            {/* Videos Table */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-2 text-left dark:bg-meta-4">
                      <th className="px-4 py-4 font-medium text-black dark:text-white">Title</th>
                      <th className="px-4 py-4 font-medium text-black dark:text-white">Channel</th>
                      <th className="px-4 py-4 font-medium text-black dark:text-white">Duration</th>
                      <th className="px-4 py-4 font-medium text-black dark:text-white">Views</th>
                      <th className="px-4 py-4 font-medium text-black dark:text-white">Likes</th>
                      <th className="px-4 py-4 font-medium text-black dark:text-white">Comments</th>
                      <th className="px-4 py-4 font-medium text-black dark:text-white">Transcript</th>
                      <th className="px-4 py-4 font-medium text-black dark:text-white">Published</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.map((video) => (
                      <tr key={video.id} className="border-b border-[#eee] dark:border-strokedark">
                        <td className="px-4 py-4 max-w-xs">
                          <a
                            href={video.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline line-clamp-2"
                          >
                            {video.title || video.content?.substring(0, 80) || 'Untitled'}
                          </a>
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={buildUrl({ channel: String(video.profile_id) })}
                            className="text-sm text-black dark:text-white hover:text-primary"
                          >
                            {video.author_name}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-sm">{formatDuration(video.video_duration)}</td>
                        <td className="px-4 py-4 text-sm">{(video.views || 0).toLocaleString()}</td>
                        <td className="px-4 py-4 text-sm">{video.likes}</td>
                        <td className="px-4 py-4 text-sm">{video.comments}</td>
                        <td className="px-4 py-4 text-sm">
                          {video.transcript_language ? (
                            <span className="rounded bg-meta-3/10 px-2 py-1 text-xs text-meta-3">{video.transcript_language}</span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {new Date(video.published_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {videos.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          No videos found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4">
                  <span className="text-sm text-gray-500">
                    Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
                  </span>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <Link href={buildUrl({ page: String(page - 1) })} className="rounded bg-gray-200 px-3 py-1 text-sm dark:bg-meta-4 dark:text-white">
                        Previous
                      </Link>
                    )}
                    {page < totalPages && (
                      <Link href={buildUrl({ page: String(page + 1) })} className="rounded bg-gray-200 px-3 py-1 text-sm dark:bg-meta-4 dark:text-white">
                        Next
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DynamicMain>
      </div>
    </>
  );
}
