import { getProfile, getYouTubeVideos } from '@/lib/db';
import Link from 'next/link';
import AppHeader from '@/layout/AppHeader';
import AppSidebar from '@/layout/AppSidebar';
import DynamicMain from '@/components/DynamicMain';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function ChannelDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const channelId = parseInt(id);
  const page = parseInt(sp.page || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  const channel = await getProfile(channelId);
  if (!channel) return notFound();

  const { videos, total } = await getYouTubeVideos({ channelId, limit, offset });
  const totalPages = Math.ceil(total / limit);

  function formatDuration(seconds: number | null) {
    if (!seconds) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <>
      <AppHeader />
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <DynamicMain>
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {/* Channel Header */}
            <div className="mb-6">
              <Link href="/youtube/channels" className="text-sm text-primary hover:underline mb-2 inline-block">
                &larr; Back to Channels
              </Link>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-meta-1/10 text-meta-1 font-bold text-2xl">
                  {channel.display_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                    {channel.display_name}
                  </h2>
                  <p className="text-sm text-gray-500">{channel.username}</p>
                  <div className="flex gap-3 mt-1 text-sm text-gray-500">
                    <span>{total} videos</span>
                    <span className="capitalize">{channel.profile_type}</span>
                    {channel.follower_count && <span>{channel.follower_count.toLocaleString()} subscribers</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Videos Table */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-2 text-left dark:bg-meta-4">
                      <th className="px-4 py-4 font-medium text-black dark:text-white">Title</th>
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
                        <td className="px-4 py-4 max-w-sm">
                          <a
                            href={video.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline line-clamp-2"
                          >
                            {video.title || 'Untitled'}
                          </a>
                          {video.content && (
                            <details className="mt-1">
                              <summary className="text-xs text-gray-400 cursor-pointer">Transcript preview</summary>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-4">{video.content.substring(0, 300)}</p>
                            </details>
                          )}
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
                        <td className="px-4 py-4 text-sm">{new Date(video.published_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {videos.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No videos found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4">
                  <span className="text-sm text-gray-500">
                    Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
                  </span>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <Link href={`/youtube/channels/${channelId}?page=${page - 1}`} className="rounded bg-gray-200 px-3 py-1 text-sm dark:bg-meta-4 dark:text-white">Previous</Link>
                    )}
                    {page < totalPages && (
                      <Link href={`/youtube/channels/${channelId}?page=${page + 1}`} className="rounded bg-gray-200 px-3 py-1 text-sm dark:bg-meta-4 dark:text-white">Next</Link>
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
