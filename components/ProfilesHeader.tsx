'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AddProfileModal from './AddProfileModal';
import ScrapeFilteredProfilesButton from './ScrapeFilteredProfilesButton';
import ScrapeBackgroundsButton from './ScrapeBackgroundsButton';
import { Profile } from '@/lib/db';

interface ProfilesHeaderProps {
  workspaceId?: number; // Optional: auto-add profiles to this workspace
  profiles?: Profile[]; // Filtered profiles from current view
  filterType?: string; // Current filter type
}

export default function ProfilesHeader({ workspaceId, profiles, filterType }: ProfilesHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleScrapeComplete = () => {
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profiles</h1>
          <p className="text-gray-600 mt-1">
            Manage and view all tracked LinkedIn profiles
          </p>
        </div>
        <div className="flex gap-3">
          {/* Show smart scrape button only when NOT in workspace view */}
          {!workspaceId && profiles && profiles.length > 0 && (
            <ScrapeFilteredProfilesButton
              profiles={profiles}
              filterType={filterType}
            />
          )}
          {/* Scrape Backgrounds button */}
          {profiles && profiles.length > 0 && (
            <ScrapeBackgroundsButton
              profileIds={profiles.map(p => p.id)}
              workspaceId={workspaceId}
              onComplete={handleScrapeComplete}
            />
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center gap-2"
          >
            <span className="text-xl leading-none">+</span>
            Add Profile
          </button>
          <Link
            href="/?profile=all"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            View Dashboard
          </Link>
        </div>
      </div>

      <AddProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaceId={workspaceId}
      />
    </>
  );
}
