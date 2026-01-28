const API_BASE_URL = 'http://localhost:3000';
const INVENTORY_API_BASE_URL = 'http://localhost:3001';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
interface AzureSubscription {
  subscriptionId: string;
  displayName: string;
  state: string;
  tenantId: string;
}

export interface AzureInventoryResult {
  inventoryId: string;
  cloud_id: string;
  subscriptions: AzureSubscription[];
  error?: string;
}

export interface Inventory {
  _id: string;
  cloud_provider: 'azure' | 'aws' | 'gcp';
  cloud_id: string;
  client_id: string;
  client_secret: string;
  subscription_id?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryResponse {
  inventories: {
    azure: Inventory[];
    aws: Inventory[];
    gcp: Inventory[];
  };
  summary: {
    total: number;
    byProvider: {
      azure: number;
      aws: number;
      gcp: number;
    };
  };
}

export interface CreateInventoryRequest {
  cloud_provider: 'azure' | 'aws' | 'gcp';
  cloud_id: string;
  client_id: string;
  client_secret: string;
  subscription_id?: string;
}

export interface ValidateCredentialsRequest {
  cloud_id: string;
  client_id: string;
  client_secret: string;
}

export interface Project {
  _id: string;
  cloud_provider: 'azure' | 'aws' | 'gcp';
  project_id: string;
  name: string;
  state: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectResponse {
  projects: {
    azure: Project[];
    aws: Project[];
    gcp: Project[];
  };
  summary: {
    total: number;
    byProvider: {
      azure: number;
      aws: number;
      gcp: number;
    };
  };
}

export interface CreateProjectRequest {
  cloud_provider: 'azure' | 'aws' | 'gcp';
  project_id: string;
  name: string;
  state: string;
}

export interface ResourceGroup {
  _id: string;
  name: string;
  location: string;
  type: string;
  tags: Record<string, string>;
  subscription_id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceGroupResponse {
  subscription_id: string;
  resourceGroups: ResourceGroup[];
  count: number;
}

export interface CreateResourceGroupRequest {
  name: string;
  location: string;
  type: string;
  tags: Record<string, string>;
  subscription_id: string;
}

export const api = {
  login: async (credentials: LoginRequest): Promise<{ user: User; token: string }> => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const result: ApiResponse<{ user: User; token: string }> = await response.json();
    return result.data!;
  },

  register: async (userData: RegisterRequest): Promise<{ user: User }> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const result: ApiResponse<{ user: User }> = await response.json();
    return result.data!;
  },

  getMe: async (token: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user');
    }

    const result: ApiResponse<{ user: User }> = await response.json();
    return result.data!.user;
  },

  getAzureSubscriptions: async (token: string): Promise<AzureInventoryResult[]> => {
    const response = await fetch(`${INVENTORY_API_BASE_URL}/me/azure/subscriptions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch Azure subscriptions');
    }

    const result: ApiResponse<{ azure: AzureInventoryResult[] }> = await response.json();
    return result.data!.azure;
  },

  getInventory: async (token: string): Promise<InventoryResponse> => {
    const response = await fetch(`${INVENTORY_API_BASE_URL}/me/cloud-credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch inventory');
    }

    const result: ApiResponse<InventoryResponse> = await response.json();
    return result.data!;
  },

  createInventory: async (token: string, inventory: CreateInventoryRequest): Promise<Inventory> => {
    const response = await fetch(`${INVENTORY_API_BASE_URL}/me/cloud-credentials`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inventory),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create inventory');
    }

    const result: ApiResponse<{ inventory: Inventory }> = await response.json();
    return result.data!.inventory;
  },

  validateAzureCredentials: async (token: string, credentials: ValidateCredentialsRequest): Promise<{ 
    valid: boolean; 
    error?: string; 
    subscriptionCount?: number;
    subscriptions?: Array<{ subscriptionId: string; displayName: string }>;
  }> => {
    const response = await fetch(`${INVENTORY_API_BASE_URL}/me/azure/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        valid: false,
        error: error.error || 'Failed to validate credentials',
      };
    }

    const result: ApiResponse<{ valid: boolean; subscriptionCount?: number; error?: string; subscriptions?: Array<{ subscriptionId: string; displayName: string; state: string }> }> = await response.json();
    return result.data!;
  },

  getProjects: async (token: string): Promise<ProjectResponse> => {
    const response = await fetch(`${INVENTORY_API_BASE_URL}/me/projects`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch projects');
    }

    const result: ApiResponse<ProjectResponse> = await response.json();
    return result.data!;
  },

  createProject: async (token: string, project: CreateProjectRequest): Promise<Project> => {
    const response = await fetch(`${INVENTORY_API_BASE_URL}/me/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create project');
    }

    const result: ApiResponse<{ project: Project }> = await response.json();
    return result.data!.project;
  },

  getAzureResourceGroups: async (token: string, subscription_id: string): Promise<{ subscription_id: string; resourceGroups: Array<{ name: string; location: string; type: string; tags: Record<string, string> }>; count: number }> => {
    const response = await fetch(`${INVENTORY_API_BASE_URL}/me/azure/resource-groups`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscription_id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch resource groups');
    }

    const result: ApiResponse<{ subscription_id: string; resourceGroups: Array<{ name: string; location: string; type: string; tags: Record<string, string> }>; count: number }> = await response.json();
    return result.data!;
  },

  createResourceGroup: async (token: string, resourceGroup: CreateResourceGroupRequest): Promise<ResourceGroup> => {
    const response = await fetch(`${INVENTORY_API_BASE_URL}/me/resource-groups`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resourceGroup),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create resource group');
    }

    const result: ApiResponse<{ resourceGroup: ResourceGroup }> = await response.json();
    return result.data!.resourceGroup;
  },

  getResourceGroups: async (token: string, subscription_id: string): Promise<ResourceGroupResponse> => {
    const response = await fetch(`${INVENTORY_API_BASE_URL}/me/resource-groups?subscription_id=${subscription_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch resource groups');
    }

    const result: ApiResponse<ResourceGroupResponse> = await response.json();
    return result.data!;
  },
};
