import { getProfiles, getStats, getWorkspace, getWorkspaceProfiles } from '@/lib/db';
import ProfileCard from '@/components/ProfileCard';
import ProfilesHeader from '@/components/ProfilesHeader';
import ScrapeWorkspaceButton from '@/components/ScrapeWorkspaceButton';
import Link from 'next/link';

export const revalidate = 0; // Disable cache so new profiles show immediately

interface PageProps {
  searchParams: Promise<{ type?: string; workspace?: string }>;
}

export default async function ProfilesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const typeFilter = params.type;
  const workspaceIdParam = params.workspace;

  // Check if workspace is selected
  const workspaceId = workspaceIdParam ? parseInt(workspaceIdParam) : null;
  const workspace = workspaceId ? await getWorkspace(workspaceId) : null;

  // Get profiles (filtered by workspace if applicable)
  const allProfiles = workspace
    ? await getWorkspaceProfiles(workspace.id)
    : await getProfiles();

  // Filter by type if specified
  let profiles;
  if (typeFilter === 'competitor-employees') {
    // Special filter: competitor employees (has company_id and is competitor type)
    profiles = allProfiles.filter(p => p.profile_type === 'competitor' && p.company_id && !p.is_company);
  } else if (typeFilter === 'competitor') {
    // Regular competitor filter: only companies (no employees)
    profiles = allProfiles.filter(p => p.profile_type === 'competitor' && p.is_company);
  } else if (typeFilter) {
    profiles = allProfiles.filter(p => p.profile_type === typeFilter);
  } else {
    profiles = allProfiles;
  }

  // Get post counts for each profile
  const profilesWithStats = await Promise.all(
    profiles.map(async (profile) => {
      const stats = await getStats(profile.id);
      return {
        ...profile,
        postCount: stats.total_posts,
      };
    })
  );

  const types = [
    { value: '', label: 'All', count: allProfiles.length },
    { value: 'own', label: 'Own', count: allProfiles.filter(p => p.profile_type === 'own').length },
    { value: 'competitor', label: 'Competitors', count: allProfiles.filter(p => p.profile_type === 'competitor' && p.is_company).length },
    { value: 'competitor-employees', label: 'Competitor Employees', count: allProfiles.filter(p => p.profile_type === 'competitor' && p.company_id && !p.is_company).length },
    { value: 'inspiration', label: 'Inspiration', count: allProfiles.filter(p => p.profile_type === 'inspiration').length },
    { value: 'partner', label: 'Partners', count: allProfiles.filter(p => p.profile_type === 'partner').length },
    { value: 'other', label: 'Other', count: allProfiles.filter(p => p.profile_type === 'other').length },
  ];

  return (
    <div className="space-y-6">
      <ProfilesHeader
        workspaceId={workspace?.id}
        profiles={profiles}
        filterType={typeFilter}
      />

      {/* Workspace Context Banner */}
      {workspace && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing profiles from workspace: <span className="font-medium" style={{ color: workspace.color }}>{workspace.name}</span>
            {workspace.description && <span className="text-gray-600"> - {workspace.description}</span>}
          </p>
          <ScrapeWorkspaceButton
            workspaceName={workspace.name}
            workspaceId={workspace.id}
            profileCount={allProfiles.length}
          />
        </div>
      )}

      {/* Type Filter Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        {types.map((type) => {
          const isActive = typeFilter === type.value || (!typeFilter && type.value === '');
          // Build URL preserving workspace parameter
          const params = new URLSearchParams();
          if (type.value) params.set('type', type.value);
          if (workspaceIdParam) params.set('workspace', workspaceIdParam);
          const href = params.toString() ? `/profiles?${params.toString()}` : '/profiles';

          return (
            <Link
              key={type.value}
              href={href}
              className={`px-4 py-3 font-medium transition-colors ${
                isActive
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {type.label}
              <span className="ml-2 text-sm text-gray-500">({type.count})</span>
            </Link>
          );
        })}
      </div>

      {/* Profiles Grid */}
      {profilesWithStats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profilesWithStats.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} postCount={profile.postCount} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">
            No profiles found
            {typeFilter && ` of type "${typeFilter}"`}
          </p>
          <p className="text-gray-400 text-sm">
            Click the &quot;Add Profile&quot; button above to add your first profile
          </p>
        </div>
      )}
    </div>
  );
}
