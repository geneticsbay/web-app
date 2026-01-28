import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../api';
import { getToken, removeToken } from '../auth';
import CloudProviderCard from './CloudProviderCard';
import { useState } from 'react';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const token = getToken();
  const queryClient = useQueryClient();
  const [expandedSubscriptions, setExpandedSubscriptions] = useState<Set<string>>(new Set());

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.getMe(token!),
    enabled: !!token,
  });

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.getInventory(token!),
    enabled: !!token,
  });

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(token!),
    enabled: !!token,
  });

  const refreshSubscriptionsMutation = useMutation({
    mutationFn: async () => {
      // Get all Azure credentials
      const inventory = await api.getInventory(token!);
      const azureCredentials = inventory.inventories.azure;

      if (azureCredentials.length === 0) {
        throw new Error('No Azure credentials found');
      }

      // Get existing projects to avoid duplicates
      const existingProjects = projectsData?.projects.azure || [];
      const existingProjectIds = new Set(existingProjects.map(p => p.project_id));

      let newSubscriptionsCount = 0;

      // Validate each credential and get subscriptions
      for (const cred of azureCredentials) {
        try {
          const validation = await api.validateAzureCredentials(token!, {
            cloud_id: cred.cloud_id,
            client_id: cred.client_id,
            client_secret: cred.client_secret,
          });

          if (validation.valid && validation.subscriptions) {
            // Save only new subscriptions
            for (const sub of validation.subscriptions) {
              if (!existingProjectIds.has(sub.subscriptionId)) {
                await api.createProject(token!, {
                  cloud_provider: 'azure',
                  project_id: sub.subscriptionId,
                  name: sub.displayName,
                  state: sub.state,
                });
                newSubscriptionsCount++;
              }
            }
          }
        } catch (error) {
          console.error('Error validating credential:', error);
          // Continue with next credential
        }
      }

      return newSubscriptionsCount;
    },
    onSuccess: (newCount) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (newCount > 0) {
        alert(`Added ${newCount} new subscription(s)`);
      } else {
        alert('No new subscriptions found');
      }
    },
    onError: (error: Error) => {
      alert(`Failed to refresh subscriptions: ${error.message}`);
    },
  });

  const fetchResourceGroupsMutation = useMutation({
    mutationFn: async (subscription_id: string) => {
      // Fetch resource groups from Azure
      const result = await api.getAzureResourceGroups(token!, subscription_id);
      
      // Save each resource group to database
      let savedCount = 0;
      for (const rg of result.resourceGroups) {
        try {
          await api.createResourceGroup(token!, {
            name: rg.name,
            location: rg.location,
            type: rg.type,
            tags: rg.tags,
            subscription_id,
          });
          savedCount++;
        } catch (error) {
          console.error('Error saving resource group:', error);
          // Continue with next resource group
        }
      }
      
      return { savedCount, totalCount: result.count, subscription_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resourceGroups', data.subscription_id] });
      // Expand the subscription to show resource groups
      setExpandedSubscriptions(prev => new Set(prev).add(data.subscription_id));
      alert(`Saved ${data.savedCount} of ${data.totalCount} resource group(s)`);
    },
    onError: (error: Error) => {
      alert(`Failed to fetch resource groups: ${error.message}`);
    },
  });

  const handleLogout = () => {
    removeToken();
    queryClient.clear();
    onLogout();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6">
        <p>Loading user information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6">
        <p className="text-red-600">Error loading user: {(error as Error).message}</p>
        <button
          onClick={handleLogout}
          className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">User Dashboard</h2>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {user && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Name</p>
                <p className="text-lg">{user.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-lg">{user.email}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Role</p>
                <p className="text-lg capitalize">{user.role}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-lg">
                  <span className={`px-2 py-1 rounded ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded">
              <p className="text-sm font-medium text-gray-600 mb-2">User ID</p>
              <p className="text-sm font-mono">{user.id}</p>
            </div>
          </div>
        )}
      </div>

      {/* Cloud Provider Credentials Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-2xl font-bold mb-6">Cloud Provider Credentials</h2>
        
        {inventoryLoading ? (
          <p>Loading inventory...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CloudProviderCard provider="azure" />
            <CloudProviderCard provider="aws" />
            <CloudProviderCard provider="gcp" />
          </div>
        )}
      </div>

      {/* Azure Subscriptions Section */}
      {projectsData && projectsData.projects.azure.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Azure Subscriptions</h3>
            <button
              onClick={() => refreshSubscriptionsMutation.mutate()}
              disabled={refreshSubscriptionsMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              title="Refresh subscriptions from Azure"
            >
              <svg
                className={`w-5 h-5 ${refreshSubscriptionsMutation.isPending ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {refreshSubscriptionsMutation.isPending ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          {projectsLoading && <p>Loading Azure subscriptions...</p>}
          {projectsData.projects.azure.length > 0 ? (
            <div className="space-y-4">
              {projectsData.projects.azure.map((project) => {
                const isExpanded = expandedSubscriptions.has(project.project_id);
                
                return (
                  <div key={project._id} className="bg-blue-50 rounded-lg overflow-hidden">
                    <div className="p-3 flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedSubscriptions);
                              if (isExpanded) {
                                newExpanded.delete(project.project_id);
                              } else {
                                newExpanded.add(project.project_id);
                              }
                              setExpandedSubscriptions(newExpanded);
                            }}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <svg
                              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <div>
                            <p className="font-medium">{project.name}</p>
                            <p className="text-sm text-gray-600">ID: {project.project_id}</p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => fetchResourceGroupsMutation.mutate(project.project_id)}
                        disabled={fetchResourceGroupsMutation.isPending}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {fetchResourceGroupsMutation.isPending ? 'Loading...' : 'Get Resource Groups'}
                      </button>
                    </div>
                    
                    {isExpanded && (
                      <ResourceGroupsList 
                        token={token!} 
                        subscriptionId={project.project_id}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            !projectsLoading && <p className="text-gray-600">No Azure subscriptions found</p>
          )}
        </div>
      )}
    </div>
  );
}

interface ResourceGroupsListProps {
  token: string;
  subscriptionId: string;
}

function ResourceGroupsList({ token, subscriptionId }: ResourceGroupsListProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['resourceGroups', subscriptionId],
    queryFn: () => api.getResourceGroups(token, subscriptionId),
    enabled: !!token && !!subscriptionId,
  });

  if (isLoading) {
    return (
      <div className="px-3 pb-3 pl-12">
        <p className="text-sm text-gray-600">Loading resource groups...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 pb-3 pl-12">
        <p className="text-sm text-red-600">Error: {(error as Error).message}</p>
      </div>
    );
  }

  if (!data || data.resourceGroups.length === 0) {
    return (
      <div className="px-3 pb-3 pl-12">
        <p className="text-sm text-gray-600">No resource groups found</p>
      </div>
    );
  }

  return (
    <div className="px-3 pb-3 pl-12 space-y-2">
      <p className="text-sm font-medium text-gray-700">Resource Groups ({data.count})</p>
      {data.resourceGroups.map((rg) => (
        <div key={rg._id} className="bg-white p-2 rounded text-sm">
          <p className="font-medium">{rg.name}</p>
          <p className="text-gray-600">{rg.location}</p>
        </div>
      ))}
    </div>
  );
}
