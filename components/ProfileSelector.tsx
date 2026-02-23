'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Profile } from '@/lib/db';

interface ProfileSelectorProps {
  profiles: Profile[];
  currentProfileId?: number | null;
}

export default function ProfileSelector({ profiles, currentProfileId }: ProfileSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const profileId = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (profileId === 'all') {
      params.delete('profile');
    } else {
      params.set('profile', profileId);
    }

    // Navigate to the same page with updated params
    router.push(`${pathname}?${params.toString()}`);
  };

  const selectedValue = currentProfileId?.toString() || 'all';

  return (
    <select
      value={selectedValue}
      onChange={handleChange}
      className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
    >
      <option value="all">All Profiles</option>
      {profiles.map((profile) => (
        <option key={profile.id} value={profile.id}>
          {profile.is_primary && '⭐ '}
          {profile.username?.startsWith('@') && '📺 '}
          {profile.display_name}
        </option>
      ))}
    </select>
  );
}
