import AIChat from '@/components/AIChat';
import Link from 'next/link';
import { getWorkspace, getWorkspaceProfiles } from '@/lib/db';
import AppHeader from '@/layout/AppHeader';
import AppSidebar from '@/layout/AppSidebar';
import DynamicMain from '@/components/DynamicMain';

export const metadata = {
  title: 'AI Insights | LinkedIn Dashboard',
  description: 'Get AI-powered insights about your LinkedIn performance',
};

export const dynamic = 'force-dynamic';

interface InsightsPageProps {
  searchParams: Promise<{ workspace?: string }>;
}

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
  // Load workspace info if provided
  const params = await searchParams;
  let workspace = null;
  let workspaceProfiles = null;
  if (params.workspace) {
    try {
      const workspaceId = parseInt(params.workspace);
      workspace = await getWorkspace(workspaceId);
      if (workspace) {
        workspaceProfiles = await getWorkspaceProfiles(workspaceId);
      }
    } catch (error) {
      console.error('Error loading workspace:', error);
    }
  }

  return (
    <>
      <AppHeader />
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <DynamicMain>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
            <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={workspace ? `/?workspace=${workspace.id}` : '/'}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🤖 AI LinkedIn Insights
          </h1>
          <p className="text-lg text-gray-600">
            Ask questions about your LinkedIn performance and get instant AI-powered analysis
          </p>

          {/* Workspace Badge */}
          {workspace && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg border border-blue-300">
              <span className="font-semibold">📁 Analyzing:</span>
              <span>{workspace.name}</span>
              {workspaceProfiles && workspaceProfiles.length > 0 && (
                <span className="text-sm text-blue-600">
                  ({workspaceProfiles.length} profile{workspaceProfiles.length !== 1 ? 's' : ''})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Real-Time Analytics
            </h3>
            <p className="text-sm text-gray-600">
              Get instant insights from your latest LinkedIn data
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Smart Recommendations
            </h3>
            <p className="text-sm text-gray-600">
              AI-powered content strategy and posting advice
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Competitive Analysis
            </h3>
            <p className="text-sm text-gray-600">
              Compare your performance with competitors
            </p>
          </div>
        </div>

        {/* AI Chat Component */}
        <div className="mb-8">
          <AIChat />
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 What can the AI help you with?
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>Identify trending hashtags and topics</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>Analyze your best performing content</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>Compare your metrics with competitors</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>Find optimal posting times</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>Get content strategy recommendations</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>Understand engagement patterns</span>
            </li>
          </ul>
        </div>

        {/* Powered By */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Powered by GPT-4 • Analyzing {' '}
            <span className="font-semibold">300+ LinkedIn posts</span> •{' '}
            <span className="font-semibold">6 intelligence views</span>
          </p>
        </div>
            </div>
          </div>
        </DynamicMain>
      </div>
    </>
  );
}
