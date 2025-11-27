import { getTopics } from '@/lib/intelligence';
import TopicsList from '@/components/TopicsList';
import AddTopicButton from '@/components/AddTopicButton';
import AppHeader from '@/layout/AppHeader';
import AppSidebar from '@/layout/AppSidebar';
import DynamicMain from '@/components/DynamicMain';

export default async function TopicsPage() {
  const topics = await getTopics();

  return (
    <>
      <AppHeader />
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <DynamicMain>
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Topics & Industries</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage topics to track across your intelligence feed
                </p>
              </div>
              <AddTopicButton />
            </div>

            <TopicsList topics={topics} />
          </div>
        </DynamicMain>
      </div>
    </>
  );
}
