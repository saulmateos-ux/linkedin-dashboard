import { getYouTubeChannels, getWorkspace } from '@/lib/db';
import Link from 'next/link';
import AppHeader from '@/layout/AppHeader';
import AppSidebar from '@/layout/AppSidebar';
import DynamicMain from '@/components/DynamicMain';

export const revalidate = 3600;

interface PageProps {
  searchParams: Promise<{ workspace?: string }>;
}

export default async function YouTubeChannelsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const workspaceId = params.workspace ? parseInt(params.workspace) : null;
  const workspace = workspaceId ? await getWorkspace(workspaceId) : null;
  const channels = await getYouTubeChannels();

  return (
    <>
      <AppHeader />
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <DynamicMain>
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                  YouTube Channels
                </h2>
                {workspace && (
                  <span className="text-sm text-gray-500">Workspace: {workspace.name}</span>
                )}
              </div>
              <Link
                href={workspaceId ? `/youtube?workspace=${workspaceId}` : '/youtube'}
                className="rounded bg-primary px-4 py-2 text-sm text-white hover:bg-opacity-90"
              >
                View All Videos
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {channels.map((channel) => (
                <Link
                  key={channel.id}
                  href={`/youtube/channels/${channel.id}`}
                  className="rounded-sm border border-stroke bg-white p-6 shadow-default hover:shadow-lg transition-shadow dark:border-strokedark dark:bg-boxdark"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-meta-1/10 text-meta-1 font-bold text-lg">
                      {channel.display_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-black dark:text-white">{channel.display_name}</h3>
                      <p className="text-sm text-gray-500">{channel.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span><strong>{channel.video_count}</strong> videos</span>
                    <span className="text-gray-400">|</span>
                    <span className="capitalize">{channel.profile_type}</span>
                    {channel.follower_count && (
                      <>
                        <span className="text-gray-400">|</span>
                        <span>{channel.follower_count.toLocaleString()} subs</span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
              {channels.length === 0 && (
                <p className="text-gray-500 col-span-full text-center py-8">No YouTube channels found.</p>
              )}
            </div>
          </div>
        </DynamicMain>
      </div>
    </>
  );
}
