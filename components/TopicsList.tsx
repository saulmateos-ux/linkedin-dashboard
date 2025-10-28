'use client';

import { Topic } from '@/lib/intelligence';
import { useState } from 'react';
import Link from 'next/link';

export default function TopicsList({ topics }: { topics: Topic[] }) {
  const [localTopics, setLocalTopics] = useState(topics);

  // Group topics by type
  const topicsByType = localTopics.reduce((acc, topic) => {
    if (!acc[topic.type]) acc[topic.type] = [];
    acc[topic.type].push(topic);
    return acc;
  }, {} as Record<string, Topic[]>);

  const typeLabels: Record<string, string> = {
    industry: '🏭 Industries',
    technology: '💻 Technologies',
    event_type: '📅 Event Types',
    keyword: '🔑 Keywords',
  };

  const handleDelete = async (topicId: number) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;

    try {
      const response = await fetch(`/api/topics/${topicId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLocalTopics((prev) => prev.filter((t) => t.id !== topicId));
      } else {
        alert('Failed to delete topic');
      }
    } catch (error) {
      console.error('Failed to delete topic:', error);
      alert('Failed to delete topic');
    }
  };

  if (localTopics.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-gray-500">
        <p className="text-lg mb-2">No topics yet</p>
        <p className="text-sm">
          Create your first topic to start tracking industry news and trends.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(topicsByType).map(([type, topicsInType]) => (
        <div key={type}>
          <h2 className="text-xl font-semibold mb-4">
            {typeLabels[type] || type}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topicsInType.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TopicCard({
  topic,
  onDelete,
}: {
  topic: Topic;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="border rounded-lg bg-white hover:shadow-md transition-shadow overflow-hidden">
      <Link href={`/news?topic=${topic.id}`} className="block p-4">
        <div className="flex items-start justify-between mb-2">
          <h3
            className="font-semibold text-lg hover:underline"
            style={{ color: topic.color }}
          >
            {topic.name}
          </h3>
        </div>

        {topic.description && (
          <p className="text-sm text-gray-600 mb-3">{topic.description}</p>
        )}

        <div className="flex flex-wrap gap-1">
          {topic.keywords.slice(0, 6).map((keyword) => (
            <span
              key={keyword}
              className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
            >
              {keyword}
            </span>
          ))}
          {topic.keywords.length > 6 && (
            <span className="px-2 py-1 text-xs text-gray-500">
              +{topic.keywords.length - 6} more
            </span>
          )}
        </div>
      </Link>

      <div className="border-t px-4 py-2 bg-gray-50">
        <button
          onClick={() => onDelete(topic.id)}
          className="text-sm text-red-600 hover:text-red-800 hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
