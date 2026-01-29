'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Profile } from '@/lib/db';
import EditProfileModal from './EditProfileModal';
import ScrapeProfileButton from './ScrapeProfileButton';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Divider,
  Link as MuiLink,
} from '@mui/material';
import { Edit, Star, Business } from '@mui/icons-material';

interface ProfileCardProps {
  profile: Profile;
  postCount?: number;
}

const typeColors: Record<string, 'success' | 'error' | 'info' | 'warning' | 'secondary' | 'primary'> = {
  own: 'success',
  team: 'primary',
  competitor: 'error',
  inspiration: 'info',
  partner: 'warning',
  other: 'secondary',
};

const typeIcons = {
  own: '👤',
  team: '👥',
  competitor: '⚔️',
  inspiration: '💡',
  partner: '🤝',
  other: '📌',
};

// Helper function to format relative time
function getRelativeTime(date: Date | null): string {
  if (!date) return 'Never';

  const now = new Date();
  const scraped = new Date(date);
  const diffMs = now.getTime() - scraped.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export default function ProfileCard({ profile, postCount }: ProfileCardProps) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const chipColor = typeColors[profile.profile_type] || 'secondary';
  const icon = typeIcons[profile.profile_type] || typeIcons.other;

  const handleScrapeComplete = () => {
    // Refresh the page to show updated post counts
    router.refresh();
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          transition: 'all 200ms',
          '&:hover': {
            boxShadow: '0px 8px 28px 0px rgba(76, 78, 100, 0.28)',
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header with Profile Info and Edit Button */}
          <Box display="flex" alignItems="start" justifyContent="space-between" mb={2}>
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <Typography variant="h6" fontWeight={700} fontSize="1.125rem">
                  {profile.display_name}
                </Typography>
                {profile.is_primary && (
                  <Star sx={{ fontSize: 20, color: 'warning.main' }} titleAccess="Primary Profile" />
                )}
                {profile.is_company && (
                  <Business sx={{ fontSize: 20, color: 'primary.main' }} titleAccess="Company Page" />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                @{profile.username}
              </Typography>
              {profile.company_name && (
                <Typography variant="body2" color="text.disabled" fontSize="0.875rem" sx={{ mt: 0.5 }}>
                  🏢 {profile.company_name}
                </Typography>
              )}
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton
                size="small"
                onClick={() => setIsEditModalOpen(true)}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    color: 'text.primary',
                  },
                }}
                title="Edit profile"
              >
                <Edit sx={{ fontSize: 18 }} />
              </IconButton>
              <Chip
                label={`${icon} ${profile.profile_type.toUpperCase()}`}
                size="small"
                color={chipColor}
                variant="outlined"
                sx={{
                  height: 24,
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  borderWidth: 1.5,
                }}
              />
            </Box>
          </Box>

          {/* Headline */}
          {profile.headline && (
            <Typography
              variant="body2"
              color="text.secondary"
              fontSize="0.875rem"
              sx={{
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {profile.headline}
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Stats and Actions */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              {profile.follower_count && (
                <Typography variant="body2" color="text.secondary" fontSize="0.875rem" sx={{ mb: 0.5 }}>
                  <Box
                    component="span"
                    fontWeight={600}
                    color="text.primary"
                    sx={{ fontFeatureSettings: '"tnum" 1' }}
                  >
                    {profile.follower_count.toLocaleString()}
                  </Box>{' '}
                  followers
                </Typography>
              )}
              {postCount !== undefined && (
                <Typography variant="body2" color="text.secondary" fontSize="0.875rem" sx={{ mb: 0.5 }}>
                  <Box
                    component="span"
                    fontWeight={600}
                    color="text.primary"
                    sx={{ fontFeatureSettings: '"tnum" 1' }}
                  >
                    {postCount}
                  </Box>{' '}
                  posts
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                Last scraped:{' '}
                <Box
                  component="span"
                  fontWeight={600}
                  color="text.primary"
                >
                  {getRelativeTime(profile.last_scraped_at)}
                </Box>
              </Typography>
            </Box>
            <Box display="flex" flexDirection="column" gap={0.5} alignItems="flex-end">
              <MuiLink
                component={Link}
                href={`/profiles/${profile.id}`}
                underline="hover"
                fontSize="0.875rem"
                fontWeight={500}
                sx={{
                  color: 'info.main',
                  transition: 'opacity 200ms',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                View Details →
              </MuiLink>
              <MuiLink
                component={Link}
                href={`/profiles/${profile.id}/background`}
                underline="hover"
                fontSize="0.875rem"
                fontWeight={500}
                sx={{
                  color: 'primary.main',
                  transition: 'opacity 200ms',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                View Background →
              </MuiLink>
            </Box>
          </Box>

          {/* Scrape Button */}
          <Box mt={2}>
            <ScrapeProfileButton
              profileId={profile.id}
              profileName={profile.display_name}
              onScrapeComplete={handleScrapeComplete}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
      />
    </>
  );
}
