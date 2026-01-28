import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../api';
import { getToken } from '../auth';
import { useState, useRef, useEffect } from 'react';

export default function HomePage() {
  const token = getToken();
  const queryClient = useQueryClient();
  const [expandedSubscriptions, setExpandedSubscriptions] = useState<Set<string>>(new Set());
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
  const [connections, setConnections] = useState<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]); 
  const [rgConnections, setRgConnections] = useState<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]); 
  
  const containerRef = useRef<HTMLDivElement>(null);
  const azureCardRef = useRef<HTMLDivElement>(null);
  const subscriptionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const selectedSubCardRef = useRef<HTMLDivElement | null>(null);
  const resourceGroupRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(token!),
    enabled: !!token,
  });

  // Calculate connection lines when layout changes
  useEffect(() => {
    if (!containerRef.current || !azureCardRef.current || !projectsData) return;

    const calculateConnections = () => {
      const containerRect = containerRef.current!.getBoundingClientRect();
      const azureRect = azureCardRef.current!.getBoundingClientRect();
      
      const newConnections: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
      
      const azureCenterY = azureRect.top + azureRect.height / 2 - containerRect.top;
      
      projectsData.projects.azure.forEach((project) => {
        const subCard = subscriptionRefs.current.get(project.project_id);
        if (subCard) {
          const subRect = subCard.getBoundingClientRect();
          
          // Start from right edge of Azure card, center height
          const x1 = azureRect.right - containerRect.left;
          const y1 = azureCenterY;
          
          // End at left edge of subscription card, middle height
          const x2 = subRect.left - containerRect.left;
          const y2 = subRect.top + subRect.height / 2 - containerRect.top;
          
          newConnections.push({ x1, y1, x2, y2 });
        }
      });
      
      setConnections(newConnections);

      // Calculate resource group connections if a subscription is selected
      if (selectedSubscription && selectedSubCardRef.current) {
        const newRgConnections: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
        const subRect = selectedSubCardRef.current.getBoundingClientRect();
        const subCenterY = subRect.top + subRect.height / 2 - containerRect.top;
        
        resourceGroupRefs.current.forEach((rgCard) => {
          const rgRect = rgCard.getBoundingClientRect();
          
          // Start from right edge of subscription card, center height
          const x1 = subRect.right - containerRect.left;
          const y1 = subCenterY;
          
          // End at left edge of resource group card, middle height
          const x2 = rgRect.left - containerRect.left;
          const y2 = rgRect.top + rgRect.height / 2 - containerRect.top;
          
          newRgConnections.push({ x1, y1, x2, y2 });
        });
        
        setRgConnections(newRgConnections);
      } else {
        setRgConnections([]);
      }
    };

    calculateConnections();
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateConnections);
    // Small delay to ensure DOM is settled
    const timer = setTimeout(calculateConnections, 100);
    
    return () => {
      window.removeEventListener('resize', calculateConnections);
      clearTimeout(timer);
    };
  }, [projectsData, expandedSubscriptions, selectedSubscription]);

  const refreshSubscriptionsMutation = useMutation({
    mutationFn: async () => {
      const inventory = await api.getInventory(token!);
      const azureCredentials = inventory.inventories.azure;

      if (azureCredentials.length === 0) {
        throw new Error('No Azure credentials found');
      }

      const existingProjects = projectsData?.projects.azure || [];
      const existingProjectIds = new Set(existingProjects.map(p => p.project_id));

      let newSubscriptionsCount = 0;

      for (const cred of azureCredentials) {
        try {
          const validation = await api.validateAzureCredentials(token!, {
            cloud_id: cred.cloud_id,
            client_id: cred.client_id,
            client_secret: cred.client_secret,
          });

          if (validation.valid && validation.subscriptions) {
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
      const result = await api.getAzureResourceGroups(token!, subscription_id);
      
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
        }
      }
      
      return { savedCount, totalCount: result.count, subscription_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resourceGroups', data.subscription_id] });
      setExpandedSubscriptions(prev => new Set(prev).add(data.subscription_id));
      alert(`Saved ${data.savedCount} of ${data.totalCount} resource group(s)`);
    },
    onError: (error: Error) => {
      alert(`Failed to fetch resource groups: ${error.message}`);
    },
  });

  return (
    <div className="max-w-7xl mx-auto mt-8 p-6">
      {/* Azure Subscriptions Section */}
      {projectsData && projectsData.projects.azure.length > 0 && (
        <div ref={containerRef} className="relative">
          {/* SVG Connection Lines */}
          <svg 
            className="absolute inset-0 pointer-events-none" 
            style={{ width: '100%', height: '100%', zIndex: 0 }}
          >
            {/* Subscription connections */}
            {connections.map((conn, index) => {
              const midX = (conn.x1 + conn.x2) / 2;
              const path = `M ${conn.x1} ${conn.y1} C ${midX} ${conn.y1}, ${midX} ${conn.y2}, ${conn.x2} ${conn.y2}`;
              
              return (
                <path
                  key={index}
                  d={path}
                  fill="none"
                  stroke="#0078d4"
                  strokeWidth="2"
                  opacity="0.6"
                />
              );
            })}
            {/* Resource group connections */}
            {rgConnections.map((conn, index) => {
              const midX = (conn.x1 + conn.x2) / 2;
              const path = `M ${conn.x1} ${conn.y1} C ${midX} ${conn.y1}, ${midX} ${conn.y2}, ${conn.x2} ${conn.y2}`;
              
              return (
                <path
                  key={`rg-${index}`}
                  d={path}
                  fill="none"
                  stroke="#10a37f"
                  strokeWidth="2"
                  opacity="0.6"
                />
              );
            })}
          </svg>

          {projectsLoading && <p>Loading Azure subscriptions...</p>}
          {projectsData.projects.azure.length > 0 && (
            <div className="flex gap-6 relative items-center" style={{ zIndex: 1 }}>
              {/* Left Column - Azure Provider Card */}
              <div ref={azureCardRef} className="bg-white rounded-lg shadow-md p-6 relative flex-shrink-0">
                <button
                  onClick={() => refreshSubscriptionsMutation.mutate()}
                  disabled={refreshSubscriptionsMutation.isPending}
                  className="absolute top-4 right-4 text-gray-600 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
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
                </button>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-14 h-14" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="azure-original-a" x1="60.919" y1="9.602" x2="18.667" y2="134.423" gradientUnits="userSpaceOnUse"><stop stopColor="#114A8B"/><stop offset="1" stopColor="#0669BC"/></linearGradient><linearGradient id="azure-original-b" x1="74.117" y1="67.772" x2="64.344" y2="71.076" gradientUnits="userSpaceOnUse"><stop stopOpacity=".3"/><stop offset=".071" stopOpacity=".2"/><stop offset=".321" stopOpacity=".1"/><stop offset=".623" stopOpacity=".05"/><stop offset="1" stopOpacity="0"/></linearGradient><linearGradient id="azure-original-c" x1="68.742" y1="5.961" x2="115.122" y2="129.525" gradientUnits="userSpaceOnUse"><stop stopColor="#3CCBF4"/><stop offset="1" stopColor="#2892DF"/></linearGradient></defs><path d="M46.09.002h40.685L44.541 125.137a6.485 6.485 0 01-6.146 4.413H6.733a6.482 6.482 0 01-5.262-2.699 6.474 6.474 0 01-.876-5.848L39.944 4.414A6.488 6.488 0 0146.09 0z" fill="url(#azure-original-a)" transform="translate(.587 4.468) scale(.91904)"/><path d="M97.28 81.607H37.987a2.743 2.743 0 00-1.874 4.751l38.1 35.562a5.991 5.991 0 004.087 1.61h33.574z" fill="#0078d4"/><path d="M46.09.002A6.434 6.434 0 0039.93 4.5L.644 120.897a6.469 6.469 0 006.106 8.653h32.48a6.942 6.942 0 005.328-4.531l7.834-23.089 27.985 26.101a6.618 6.618 0 004.165 1.519h36.396l-15.963-45.616-46.533.011L86.922.002z" fill="url(#azure-original-b)" transform="translate(.587 4.468) scale(.91904)"/><path d="M98.055 4.408A6.476 6.476 0 0091.917.002H46.575a6.478 6.478 0 016.137 4.406l39.35 116.594a6.476 6.476 0 01-6.137 8.55h45.344a6.48 6.48 0 006.136-8.55z" fill="url(#azure-original-c)" transform="translate(.587 4.468) scale(.91904)"/></svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">Azure</h4>
                  <p className="text-sm text-gray-600 mt-2 text-center">Cloud Provider</p>
                </div>
              </div>

              {/* Right Column - Subscription Cards */}
              <div className="flex flex-col gap-4">
                {projectsData.projects.azure.map((project, index) => {
                  const isExpanded = expandedSubscriptions.has(project.project_id);
                  const isSelected = selectedSubscription === project.project_id;
                  
                  return (
                    <div 
                      key={project._id} 
                      ref={(el) => {
                        if (el) {
                          subscriptionRefs.current.set(project.project_id, el);
                          if (isSelected) selectedSubCardRef.current = el;
                        }
                      }}
                      className="bg-white rounded-lg shadow-md overflow-hidden w-[300px]"
                    >
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-5 h-5 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
                              <defs>
                                <radialGradient id="subscription-gradient" cx="-36.63" cy="17.12" r="11.18" gradientTransform="translate(41.88 -7.4) scale(0.94 0.94)" gradientUnits="userSpaceOnUse">
                                  <stop offset="0.27" stopColor="#ffd70f"/>
                                  <stop offset="0.49" stopColor="#ffcb12"/>
                                  <stop offset="0.88" stopColor="#feac19"/>
                                  <stop offset="1" stopColor="#fea11b"/>
                                </radialGradient>
                              </defs>
                              <path d="M13.56,7.19a2.07,2.07,0,0,0,0-2.93h0L10,.69a2.06,2.06,0,0,0-2.92,0h0L3.52,4.26a2.09,2.09,0,0,0,0,2.93l3,3a.61.61,0,0,1,.17.41v5.52a.7.7,0,0,0,.2.5l1.35,1.35a.45.45,0,0,0,.66,0l1.31-1.31h0l.77-.77a.26.26,0,0,0,0-.38l-.55-.56a.29.29,0,0,1,0-.42l.55-.56a.26.26,0,0,0,0-.38L10.4,13a.28.28,0,0,1,0-.41L11,12a.26.26,0,0,0,0-.38l-.77-.78v-.28Zm-5-5.64A1.18,1.18,0,1,1,7.37,2.73,1.17,1.17,0,0,1,8.54,1.55Z" fill="url(#subscription-gradient)"/>
                              <path d="M7.62,16.21h0A.25.25,0,0,0,8,16V11.55a.27.27,0,0,0-.11-.22h0a.25.25,0,0,0-.39.22V16A.27.27,0,0,0,7.62,16.21Z" fill="#ff9300" opacity="0.75"/>
                              <rect x="5.69" y="5.45" width="5.86" height="0.69" rx="0.32" fill="#ff9300" opacity="0.75"/>
                              <rect x="5.69" y="6.57" width="5.86" height="0.69" rx="0.32" fill="#ff9300" opacity="0.75"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{project.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ResourceGroupButton 
                            token={token!}
                            subscriptionId={project.project_id}
                            onFetch={() => fetchResourceGroupsMutation.mutate(project.project_id)}
                            isPending={fetchResourceGroupsMutation.isPending}
                          />
                          <ResourceGroupArrow
                            token={token!}
                            subscriptionId={project.project_id}
                            isSelected={isSelected}
                            onToggle={() => setSelectedSubscription(isSelected ? null : project.project_id)}
                          />
                        </div>
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

              {/* Resource Group Cards - shown when a subscription is selected */}
              {selectedSubscription && (
                <ResourceGroupCards
                  token={token!}
                  subscriptionId={selectedSubscription}
                  resourceGroupRefs={resourceGroupRefs}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {projectsData && projectsData.projects.azure.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Cloud Resources Yet</h3>
          <p className="text-gray-600 mb-4">Add your cloud provider credentials to get started</p>
          <p className="text-sm text-gray-500">Click the + icon in the header to add credentials</p>
        </div>
      )}
    </div>
  );
}

interface ResourceGroupButtonProps {
  token: string;
  subscriptionId: string;
  onFetch: () => void;
  isPending: boolean;
}

function ResourceGroupButton({ token, subscriptionId, onFetch, isPending }: ResourceGroupButtonProps) {
  const { data } = useQuery({
    queryKey: ['resourceGroups', subscriptionId],
    queryFn: () => api.getResourceGroups(token, subscriptionId),
    enabled: !!token && !!subscriptionId,
  });

  const hasResourceGroups = data && data.resourceGroups.length > 0;

  return (
    <button
      onClick={onFetch}
      disabled={isPending}
      className="text-gray-600 hover:text-green-600 disabled:text-gray-400 disabled:cursor-not-allowed"
      title={hasResourceGroups ? 'Refresh Resource Groups' : 'Get Resource Groups'}
    >
      {hasResourceGroups ? (
        <svg
          className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`}
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
      ) : (
        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      )}
    </button>
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

interface ResourceGroupArrowProps {
  token: string;
  subscriptionId: string;
  isSelected: boolean;
  onToggle: () => void;
}

function ResourceGroupArrow({ token, subscriptionId, isSelected, onToggle }: ResourceGroupArrowProps) {
  const { data } = useQuery({
    queryKey: ['resourceGroups', subscriptionId],
    queryFn: () => api.getResourceGroups(token, subscriptionId),
    enabled: !!token && !!subscriptionId,
  });

  const hasResourceGroups = data && data.resourceGroups.length > 0;

  if (!hasResourceGroups) return null;

  return (
    <button
      onClick={onToggle}
      className="text-gray-600 hover:text-blue-600"
      title={isSelected ? 'Hide Resource Groups' : 'Show Resource Groups'}
    >
      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  );
}

interface ResourceGroupCardsProps {
  token: string;
  subscriptionId: string;
  resourceGroupRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
}

function ResourceGroupCards({ token, subscriptionId, resourceGroupRefs }: ResourceGroupCardsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['resourceGroups', subscriptionId],
    queryFn: () => api.getResourceGroups(token, subscriptionId),
    enabled: !!token && !!subscriptionId,
  });

  if (isLoading) return <div className="text-gray-600">Loading...</div>;
  if (!data || data.resourceGroups.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {data.resourceGroups.map((rg) => (
        <div
          key={rg._id}
          ref={(el) => {
            if (el) resourceGroupRefs.current.set(rg._id, el);
          }}
          className="bg-white rounded-lg shadow-md p-4 w-[300px]"
        >
          <p className="font-semibold text-gray-800">{rg.name}</p>
          <p className="text-sm text-gray-600 mt-1">{rg.location}</p>
        </div>
      ))}
    </div>
  );
}
