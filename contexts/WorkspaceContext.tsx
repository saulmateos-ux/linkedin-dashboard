'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';

export interface Workspace {
  id: number;
  name: string;
  description: string | null;
  color: string;
  profile_count?: number;
  post_count?: number;
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  refreshWorkspaces: () => Promise<void>;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load workspaces from API
  const refreshWorkspaces = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/workspaces');

      if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
      }

      const data = await response.json();
      setWorkspaces(data.workspaces || []);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load workspaces on mount
  useEffect(() => {
    refreshWorkspaces();
  }, []);

  // Sync workspace from URL params (takes precedence over localStorage)
  useEffect(() => {
    if (workspaces.length === 0) return; // Wait for workspaces to load

    const workspaceParam = searchParams.get('workspace');

    if (workspaceParam) {
      // URL has workspace param - use it
      const workspaceId = parseInt(workspaceParam, 10);
      const urlWorkspace = workspaces.find((w) => w.id === workspaceId);

      if (urlWorkspace) {
        setCurrentWorkspaceState(urlWorkspace);
        localStorage.setItem('selectedWorkspaceId', workspaceId.toString());
      }
    } else {
      // No workspace param in URL - clear selection
      setCurrentWorkspaceState(null);
      localStorage.removeItem('selectedWorkspaceId');
    }
  }, [searchParams, workspaces]);

  // Set current workspace and save to localStorage
  const setCurrentWorkspace = (workspace: Workspace | null) => {
    setCurrentWorkspaceState(workspace);

    if (workspace) {
      localStorage.setItem('selectedWorkspaceId', workspace.id.toString());
    } else {
      localStorage.removeItem('selectedWorkspaceId');
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        setCurrentWorkspace,
        refreshWorkspaces,
        isLoading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
