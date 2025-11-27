'use client';

import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import Link from 'next/link';
import AppHeader from '@/layout/AppHeader';
import AppSidebar from '@/layout/AppSidebar';
import DynamicMain from '@/components/DynamicMain';

interface Workspace {
  id: number;
  name: string;
  description: string | null;
  color: string;
  profile_count?: number;
  post_count?: number;
}

interface Profile {
  id: number;
  display_name: string;
  username: string;
  profile_type: string;
}

interface ContentSource {
  id: number;
  name: string;
  type: string;
  url: string;
  enabled: boolean;
}

export default function WorkspacesPage() {
  const { workspaces, refreshWorkspaces } = useWorkspace();
  const [isCreating, setIsCreating] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [managingProfiles, setManagingProfiles] = useState<Workspace | null>(null);
  const [managingSources, setManagingSources] = useState<Workspace | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [workspaceProfiles, setWorkspaceProfiles] = useState<Profile[]>([]);
  const [allSources, setAllSources] = useState<ContentSource[]>([]);
  const [workspaceSources, setWorkspaceSources] = useState<ContentSource[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
  });

  useEffect(() => {
    // Load all profiles
    fetch('/api/profiles')
      .then(res => res.json())
      .then(data => {
        console.log('Loaded all profiles:', data.profiles);
        setAllProfiles(data.profiles || []);
      })
      .catch(error => {
        console.error('Error loading profiles:', error);
        setAllProfiles([]);
      });

    // Load all content sources
    fetch('/api/intelligence/sources')
      .then(res => res.json())
      .then(data => {
        console.log('Loaded all sources:', data);
        setAllSources(Array.isArray(data) ? data : []);
      })
      .catch(error => {
        console.error('Error loading sources:', error);
        setAllSources([]);
      });
  }, []);

  useEffect(() => {
    // Load profiles for the workspace being managed
    if (managingProfiles) {
      // Reload all profiles when modal opens
      fetch('/api/profiles')
        .then(res => res.json())
        .then(data => {
          console.log('Reloaded all profiles:', data.profiles);
          setAllProfiles(data.profiles || []);
        })
        .catch(error => console.error('Error reloading profiles:', error));

      // Load workspace profiles
      fetch(`/api/workspaces/${managingProfiles.id}/profiles`)
        .then(res => res.json())
        .then(data => {
          console.log('Loaded workspace profiles:', data.profiles);
          setWorkspaceProfiles(data.profiles || []);
        })
        .catch(error => console.error('Error loading workspace profiles:', error));
    }
  }, [managingProfiles]);

  useEffect(() => {
    // Load sources for the workspace being managed
    if (managingSources) {
      fetch(`/api/workspaces/${managingSources.id}/sources`)
        .then(res => res.json())
        .then(data => {
          console.log('Loaded workspace sources:', data);
          setWorkspaceSources(Array.isArray(data) ? data : []);
        })
        .catch(error => console.error('Error loading workspace sources:', error));
    }
  }, [managingSources]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create workspace');

      setIsCreating(false);
      setFormData({ name: '', description: '', color: '#6366f1' });
      refreshWorkspaces();
    } catch (error) {
      console.error('Error creating workspace:', error);
      alert('Failed to create workspace');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkspace) return;

    try {
      const response = await fetch(`/api/workspaces/${editingWorkspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update workspace');

      setEditingWorkspace(null);
      setFormData({ name: '', description: '', color: '#6366f1' });
      refreshWorkspaces();
    } catch (error) {
      console.error('Error updating workspace:', error);
      alert('Failed to update workspace');
    }
  };

  const handleDelete = async (workspace: Workspace) => {
    if (!confirm(`Are you sure you want to delete "${workspace.name}"?`)) return;

    try {
      const response = await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete workspace');

      refreshWorkspaces();
    } catch (error) {
      console.error('Error deleting workspace:', error);
      alert('Failed to delete workspace');
    }
  };

  const handleAddProfile = async (profileId: number) => {
    if (!managingProfiles) return;

    try {
      const response = await fetch(`/api/workspaces/${managingProfiles.id}/profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      });

      if (!response.ok) throw new Error('Failed to add profile');

      // Refresh workspace profiles
      const profilesRes = await fetch(`/api/workspaces/${managingProfiles.id}/profiles`);
      const profilesData = await profilesRes.json();
      setWorkspaceProfiles(profilesData.profiles || []);
      refreshWorkspaces();
    } catch (error) {
      console.error('Error adding profile:', error);
      alert('Failed to add profile to workspace');
    }
  };

  const handleRemoveProfile = async (profileId: number) => {
    if (!managingProfiles) return;

    try {
      const response = await fetch(
        `/api/workspaces/${managingProfiles.id}/profiles?profileId=${profileId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to remove profile');

      // Refresh workspace profiles
      const profilesRes = await fetch(`/api/workspaces/${managingProfiles.id}/profiles`);
      const profilesData = await profilesRes.json();
      setWorkspaceProfiles(profilesData.profiles || []);
      refreshWorkspaces();
    } catch (error) {
      console.error('Error removing profile:', error);
      alert('Failed to remove profile from workspace');
    }
  };

  const openEditModal = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setFormData({
      name: workspace.name,
      description: workspace.description || '',
      color: workspace.color,
    });
  };

  const openManageProfiles = (workspace: Workspace) => {
    setManagingProfiles(workspace);
  };

  const openManageSources = (workspace: Workspace) => {
    setManagingSources(workspace);
  };

  const handleAddSource = async (sourceId: number) => {
    if (!managingSources) return;

    try {
      const response = await fetch(`/api/workspaces/${managingSources.id}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId }),
      });

      if (!response.ok) throw new Error('Failed to add source');

      // Refresh workspace sources
      const sourcesRes = await fetch(`/api/workspaces/${managingSources.id}/sources`);
      const sourcesData = await sourcesRes.json();
      setWorkspaceSources(Array.isArray(sourcesData) ? sourcesData : []);
      refreshWorkspaces();
    } catch (error) {
      console.error('Error adding source:', error);
      alert('Failed to add source to workspace');
    }
  };

  const handleRemoveSource = async (sourceId: number) => {
    if (!managingSources) return;

    try {
      const response = await fetch(
        `/api/workspaces/${managingSources.id}/sources?sourceId=${sourceId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to remove source');

      // Refresh workspace sources
      const sourcesRes = await fetch(`/api/workspaces/${managingSources.id}/sources`);
      const sourcesData = await sourcesRes.json();
      setWorkspaceSources(Array.isArray(sourcesData) ? sourcesData : []);
      refreshWorkspaces();
    } catch (error) {
      console.error('Error removing source:', error);
      alert('Failed to remove source from workspace');
    }
  };

  return (
    <>
      <AppHeader />
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <DynamicMain>
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Workspaces</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Organize your profiles into workspaces for better tracking
                  </p>
                </div>
                <button
                  onClick={() => setIsCreating(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  + Create Workspace
                </button>
              </div>

      {/* Workspaces Grid */}
      {workspaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: workspace.color }}
                  ></div>
                  <h3 className="text-lg font-bold text-gray-900">{workspace.name}</h3>
                </div>
              </div>

              {workspace.description && (
                <p className="text-sm text-gray-600 mb-4">{workspace.description}</p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{workspace.profile_count || 0} profiles</span>
                <span>{workspace.post_count || 0} posts</span>
              </div>

              <div className="space-y-2">
                <Link
                  href={`/workspaces/${workspace.id}/analysis`}
                  className="block w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium text-center"
                >
                  📊 AI Analysis
                </Link>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openManageProfiles(workspace)}
                    className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    👥 Profiles
                  </button>
                  <button
                    onClick={() => openManageSources(workspace)}
                    className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    📰 News
                  </button>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(workspace)}
                    className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(workspace)}
                    className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">No workspaces yet</p>
          <p className="text-gray-400 text-sm">
            Create your first workspace to organize your profiles
          </p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isCreating || editingWorkspace) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isCreating ? 'Create Workspace' : 'Edit Workspace'}
            </h2>

            <form onSubmit={isCreating ? handleCreate : handleUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Personal, Competitors, etc."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Track my personal profile and competitors"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">{formData.color}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingWorkspace(null);
                    setFormData({ name: '', description: '', color: '#6366f1' });
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {isCreating ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Profiles Modal */}
      {managingProfiles && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Manage Profiles in {managingProfiles.name}
            </h2>

            {/* Profiles in workspace */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Profiles in this workspace ({workspaceProfiles.length})
              </h3>
              {workspaceProfiles.length > 0 ? (
                <div className="space-y-2">
                  {workspaceProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{profile.display_name}</p>
                        <p className="text-sm text-gray-500">@{profile.username}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveProfile(profile.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No profiles in this workspace yet</p>
              )}
            </div>

            {/* Available profiles */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Add profiles</h3>
              {allProfiles.length === 0 ? (
                <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                  Loading available profiles...
                </p>
              ) : (
                <div className="space-y-2">
                  {allProfiles
                    .filter(
                      (profile) => !workspaceProfiles.find((wp) => wp.id === profile.id)
                    )
                    .length === 0 ? (
                    <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                      All profiles are already in this workspace
                    </p>
                  ) : (
                    allProfiles
                      .filter(
                        (profile) => !workspaceProfiles.find((wp) => wp.id === profile.id)
                      )
                      .map((profile) => (
                        <div
                          key={profile.id}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{profile.display_name}</p>
                            <p className="text-sm text-gray-500">@{profile.username}</p>
                          </div>
                          <button
                            onClick={() => handleAddProfile(profile.id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Add
                          </button>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setManagingProfiles(null);
                  setWorkspaceProfiles([]);
                }}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage News Sources Modal */}
      {managingSources && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Manage News Sources in {managingSources.name}
            </h2>

            {/* Sources in workspace */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                News sources in this workspace ({workspaceSources.length})
              </h3>
              {workspaceSources.length > 0 ? (
                <div className="space-y-2">
                  {workspaceSources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{source.name}</p>
                        <p className="text-sm text-gray-500">{source.type.toUpperCase()} • {source.enabled ? '✓ Enabled' : '✗ Disabled'}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveSource(source.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No news sources in this workspace yet</p>
              )}
            </div>

            {/* Available sources */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Add news sources</h3>
              {allSources.length === 0 ? (
                <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                  Loading available sources...
                </p>
              ) : (
                <div className="space-y-2">
                  {allSources
                    .filter(
                      (source) => !workspaceSources.find((ws) => ws.id === source.id)
                    )
                    .length === 0 ? (
                    <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                      All news sources are already in this workspace
                    </p>
                  ) : (
                    allSources
                      .filter(
                        (source) => !workspaceSources.find((ws) => ws.id === source.id)
                      )
                      .map((source) => (
                        <div
                          key={source.id}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{source.name}</p>
                            <p className="text-sm text-gray-500">{source.type.toUpperCase()} • {source.enabled ? '✓ Enabled' : '✗ Disabled'}</p>
                          </div>
                          <button
                            onClick={() => handleAddSource(source.id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Add
                          </button>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setManagingSources(null);
                  setWorkspaceSources([]);
                }}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
            </div>
          </div>
        </DynamicMain>
      </div>
    </>
  );
}
