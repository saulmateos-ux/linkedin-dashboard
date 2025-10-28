'use client';

import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Menu,
  MenuItem,
  Box,
  Typography,
  Divider,
  CircularProgress,
} from '@mui/material';
import { KeyboardArrowDown, Settings, FolderOpen } from '@mui/icons-material';

export default function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, setCurrentWorkspace, isLoading } = useWorkspace();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle workspace selection
  const handleWorkspaceChange = (workspace: typeof currentWorkspace) => {
    setCurrentWorkspace(workspace);
    handleClose();

    // Update URL params
    const params = new URLSearchParams(searchParams.toString());

    if (workspace) {
      params.set('workspace', workspace.id.toString());
      // Remove profile filter when switching to workspace view
      params.delete('profile');
    } else {
      params.delete('workspace');
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <Button
        variant="outlined"
        disabled
        startIcon={<CircularProgress size={16} />}
        sx={{
          borderRadius: 1.5,
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.9375rem',
          px: 2,
          py: 1,
        }}
      >
        Loading...
      </Button>
    );
  }

  return (
    <Box>
      <Button
        onClick={handleClick}
        variant="outlined"
        endIcon={<KeyboardArrowDown sx={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />}
        sx={{
          borderRadius: 1.5,
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.9375rem',
          px: 2,
          py: 1,
          color: 'text.primary',
          borderColor: 'divider',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: currentWorkspace?.color || '#9155FD',
            }}
          />
          <Typography variant="body2" fontWeight={500} fontSize="0.9375rem">
            {currentWorkspace ? currentWorkspace.name : 'All Profiles'}
          </Typography>
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 280,
            maxWidth: 320,
            borderRadius: 1.5,
            boxShadow: '0px 4px 14px 0px rgba(76, 78, 100, 0.25)',
          },
        }}
      >
        {/* All Profiles Option */}
        <MenuItem
          onClick={() => handleWorkspaceChange(null)}
          selected={!currentWorkspace}
          sx={{
            py: 1.5,
            px: 2,
            '&.Mui-selected': {
              bgcolor: 'action.selected',
            },
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5} width="100%">
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: 'text.disabled',
              }}
            />
            <Box flex={1}>
              <Typography variant="body2" fontWeight={600} fontSize="0.875rem">
                All Profiles
              </Typography>
              {!currentWorkspace && (
                <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
                  Currently viewing all data
                </Typography>
              )}
            </Box>
          </Box>
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        {/* Workspace Options */}
        {workspaces.length > 0 ? (
          workspaces.map((workspace) => (
            <MenuItem
              key={workspace.id}
              onClick={() => handleWorkspaceChange(workspace)}
              selected={currentWorkspace?.id === workspace.id}
              sx={{
                py: 1.5,
                px: 2,
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                },
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                <Box display="flex" alignItems="center" gap={1.5} flex={1}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: workspace.color,
                    }}
                  />
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={600} fontSize="0.875rem">
                      {workspace.name}
                    </Typography>
                    {workspace.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontSize="0.75rem"
                        sx={{
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 180,
                        }}
                      >
                        {workspace.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" fontSize="0.75rem" sx={{ ml: 1 }}>
                  {workspace.post_count || 0} posts
                </Typography>
              </Box>
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled sx={{ py: 2, justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
              No workspaces yet
            </Typography>
          </MenuItem>
        )}

        <Divider sx={{ my: 0.5 }} />

        {/* Manage Workspaces Link */}
        <MenuItem
          component={Link}
          href="/workspaces"
          onClick={handleClose}
          sx={{
            py: 1.5,
            px: 2,
            color: 'primary.main',
            fontWeight: 600,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Settings sx={{ fontSize: 18 }} />
            <Typography variant="body2" fontWeight={600} fontSize="0.875rem">
              Manage Workspaces
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
}
