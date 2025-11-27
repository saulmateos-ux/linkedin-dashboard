import { getArticles, getSignals, getTopic } from '@/lib/intelligence';
import { getWorkspace } from '@/lib/db';
import NewsFeed from '@/components/NewsFeed';
import SignalsPanel from '@/components/SignalsPanel';
import RefreshNewsButton from '@/components/RefreshNewsButton';
import Link from 'next/link';
import AppHeader from '@/layout/AppHeader';
import AppSidebar from '@/layout/AppSidebar';
import DynamicMain from '@/components/DynamicMain';

interface PageProps {
  searchParams: Promise<{
    workspace?: string;
    category?: string;
    topic?: string;
  }>;
}

export default async function NewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const workspaceId = params.workspace ? parseInt(params.workspace) : null;
  const category = params.category;
  const topicId = params.topic ? parseInt(params.topic) : null;

  // Fetch workspace if specified
  const workspace = workspaceId ? await getWorkspace(workspaceId) : null;

  // Fetch topic if specified
  const topic = topicId ? await getTopic(topicId) : null;

  // Fetch articles
  const { articles, total } = await getArticles({
    workspaceId: workspaceId || undefined,
    category: category || undefined,
    topicIds: topicId ? [topicId] : undefined,
    limit: 50,
    minRelevanceScore: 0.6,
  });

  // Fetch signals
  const signals = await getSignals(workspaceId || undefined, false);

  return (
    <>
      <AppHeader />
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <DynamicMain>
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Market Intelligence</h1>
                <RefreshNewsButton />
              </div>
              {workspace && (
                <p className="text-gray-600 dark:text-gray-400">
                  Viewing workspace:{' '}
                  <span style={{ color: workspace.color }} className="font-semibold">
                    {workspace.name}
                  </span>
                </p>
              )}
              {topic && (
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-gray-600 dark:text-gray-400">
                    Filtering by topic:{' '}
                    <span style={{ color: topic.color }} className="font-semibold">
                      {topic.name}
                    </span>
                  </p>
                  <Link
                    href="/news"
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    Clear filter
                  </Link>
                </div>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {total} relevant articles {category && `in ${category}`}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main feed (2/3 width on large screens) */}
              <div className="lg:col-span-2">
                <NewsFeed articles={articles} />
              </div>

              {/* Signals sidebar (1/3 width on large screens) */}
              <div>
                <SignalsPanel signals={signals} />
              </div>
            </div>
          </div>
        </DynamicMain>
      </div>
    </>
  );
}
