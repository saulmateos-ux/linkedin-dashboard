import { getTopics } from '@/lib/intelligence';
import TopicsList from '@/components/TopicsList';
import AddTopicButton from '@/components/AddTopicButton';

export default async function TopicsPage() {
  const topics = await getTopics();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Topics & Industries</h1>
          <p className="text-gray-600">
            Manage topics to track across your intelligence feed
          </p>
        </div>
        <AddTopicButton />
      </div>

      <TopicsList topics={topics} />
    </div>
  );
}
