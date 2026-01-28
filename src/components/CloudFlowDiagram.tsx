import { useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Project } from '../api';

interface CloudFlowDiagramProps {
  projects: Project[];
  onSubscriptionExpand: (projectId: string) => void;
  expandedSubscriptions: Set<string>;
  onFetchResourceGroups: (projectId: string) => void;
  resourceGroupsPending: boolean;
  token: string;
}

export default function CloudFlowDiagram({ 
  projects,
  onSubscriptionExpand,
  expandedSubscriptions,
  onFetchResourceGroups,
  resourceGroupsPending,
  token
}: CloudFlowDiagramProps) {
  // Azure Provider Node
  const providerNode: Node = {
    id: 'azure-provider',
    type: 'azureProvider',
    position: { x: 50, y: 100 },
    data: { label: 'Azure' },
  };

  // Subscription Nodes
  const subscriptionNodes: Node[] = projects.map((project, index) => ({
    id: project.project_id,
    type: 'subscription',
    position: { x: 450, y: index * 120 + 50 },
    data: { 
      project,
      isExpanded: expandedSubscriptions.has(project.project_id),
      onExpand: onSubscriptionExpand,
      onFetchResourceGroups,
      resourceGroupsPending,
      token
    },
  }));

  // Edges connecting Azure to Subscriptions
  const edges: Edge[] = projects.map((project) => ({
    id: `e-azure-${project.project_id}`,
    source: 'azure-provider',
    target: project.project_id,
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#0078d4', strokeWidth: 2 },
  }));

  const [nodes] = useNodesState([providerNode, ...subscriptionNodes]);
  const [flowEdges] = useEdgesState(edges);

  const nodeTypes = {
    azureProvider: AzureProviderNode,
    subscription: SubscriptionNode,
  };

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

function AzureProviderNode() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-[300px] border-2 border-blue-500">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-4">
          <svg className="w-14 h-14" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="azure-flow-a" x1="60.919" y1="9.602" x2="18.667" y2="134.423" gradientUnits="userSpaceOnUse">
                <stop stopColor="#114A8B"/>
                <stop offset="1" stopColor="#0669BC"/>
              </linearGradient>
              <linearGradient id="azure-flow-b" x1="74.117" y1="67.772" x2="64.344" y2="71.076" gradientUnits="userSpaceOnUse">
                <stop stopOpacity=".3"/>
                <stop offset=".071" stopOpacity=".2"/>
                <stop offset=".321" stopOpacity=".1"/>
                <stop offset=".623" stopOpacity=".05"/>
                <stop offset="1" stopOpacity="0"/>
              </linearGradient>
              <linearGradient id="azure-flow-c" x1="68.742" y1="5.961" x2="115.122" y2="129.525" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3CCBF4"/>
                <stop offset="1" stopColor="#2892DF"/>
              </linearGradient>
            </defs>
            <path d="M46.09.002h40.685L44.541 125.137a6.485 6.485 0 01-6.146 4.413H6.733a6.482 6.482 0 01-5.262-2.699 6.474 6.474 0 01-.876-5.848L39.944 4.414A6.488 6.488 0 0146.09 0z" fill="url(#azure-flow-a)" transform="translate(.587 4.468) scale(.91904)"/>
            <path d="M97.28 81.607H37.987a2.743 2.743 0 00-1.874 4.751l38.1 35.562a5.991 5.991 0 004.087 1.61h33.574z" fill="#0078d4"/>
            <path d="M46.09.002A6.434 6.434 0 0039.93 4.5L.644 120.897a6.469 6.469 0 006.106 8.653h32.48a6.942 6.942 0 005.328-4.531l7.834-23.089 27.985 26.101a6.618 6.618 0 004.165 1.519h36.396l-15.963-45.616-46.533.011L86.922.002z" fill="url(#azure-flow-b)" transform="translate(.587 4.468) scale(.91904)"/>
            <path d="M98.055 4.408A6.476 6.476 0 0091.917.002H46.575a6.478 6.478 0 016.137 4.406l39.35 116.594a6.476 6.476 0 01-6.137 8.55h45.344a6.48 6.48 0 006.136-8.55z" fill="url(#azure-flow-c)" transform="translate(.587 4.468) scale(.91904)"/>
          </svg>
        </div>
        <h4 className="text-xl font-bold text-gray-800">Azure</h4>
        <p className="text-sm text-gray-600 mt-2 text-center">Cloud Provider</p>
      </div>
    </div>
  );
}

interface SubscriptionNodeData {
  project: Project;
  isExpanded: boolean;
  onExpand: (projectId: string) => void;
  onFetchResourceGroups: (projectId: string) => void;
  resourceGroupsPending: boolean;
  token: string;
}

function SubscriptionNode({ data }: { data: SubscriptionNodeData }) {
  const { project, isExpanded, onExpand, onFetchResourceGroups, resourceGroupsPending, token } = data;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-[300px] border-2 border-gray-300 hover:border-blue-400 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => onExpand(project.project_id)}
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
          <div className="flex-1">
            <p className="font-semibold text-gray-800 text-sm">{project.name}</p>
          </div>
        </div>
        <button
          onClick={() => onFetchResourceGroups(project.project_id)}
          disabled={resourceGroupsPending}
          className="text-gray-600 hover:text-green-600 disabled:text-gray-400 disabled:cursor-not-allowed"
          title="Get/Refresh Resource Groups"
        >
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
