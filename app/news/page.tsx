import { getArticles, getSignals, getTopic } from '@/lib/intelligence';
import { getWorkspace } from '@/lib/db';
import NewsFeed from '@/components/NewsFeed';
import SignalsPanel from '@/components/SignalsPanel';
import Link from 'next/link';

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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Market Intelligence</h1>
        {workspace && (
          <p className="text-gray-600">
            Viewing workspace:{' '}
            <span style={{ color: workspace.color }} className="font-semibold">
              {workspace.name}
            </span>
          </p>
        )}
        {topic && (
          <div className="mt-2 flex items-center gap-2">
            <p className="text-gray-600">
              Filtering by topic:{' '}
              <span style={{ color: topic.color }} className="font-semibold">
                {topic.name}
              </span>
            </p>
            <Link
              href="/news"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear filter
            </Link>
          </div>
        )}
        <p className="text-sm text-gray-500 mt-1">
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
  );
}
