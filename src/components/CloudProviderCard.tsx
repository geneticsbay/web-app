import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, CreateInventoryRequest } from '../api';
import { getToken } from '../auth';

interface CloudProviderCardProps {
  provider: 'azure' | 'aws' | 'gcp';
}

export default function CloudProviderCard({ provider }: CloudProviderCardProps) {
  const token = getToken();
  const queryClient = useQueryClient();
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateInventoryRequest>({
    cloud_provider: provider,
    cloud_id: '',
    client_id: '',
    client_secret: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateInventoryRequest) => api.createInventory(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['azureSubscriptions'] });
      setValidationError(null);
      // Reset form to allow adding another tenant
      setFormData({
        cloud_provider: provider,
        cloud_id: '',
        client_id: '',
        client_secret: '',
      });
      alert(`${provider.toUpperCase()} credentials saved successfully!`);
    },
    onError: (error: Error) => {
      alert(`Failed to save credentials: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate Azure credentials before saving
    if (provider === 'azure') {
      setIsValidating(true);
      try {
        const validation = await api.validateAzureCredentials(token!, {
          cloud_id: formData.cloud_id,
          client_id: formData.client_id,
          client_secret: formData.client_secret,
        });

        if (!validation.valid) {
          setValidationError('Unable to get subscription ID. Please check your credentials.');
          setIsValidating(false);
          return;
        }

        setIsValidating(false);

        // Save credentials first
        await api.createInventory(token!, formData);

        // Save each subscription as a project
        if (validation.subscriptions && validation.subscriptions.length > 0) {
          console.log('Saving subscriptions as projects:', validation.subscriptions);
          try {
            await Promise.all(
              validation.subscriptions.map(sub => {
                console.log('Creating project:', {
                  cloud_provider: 'azure',
                  project_id: sub.subscriptionId,
                  name: sub.displayName,
                  state: sub.state,
                });
                return api.createProject(token!, {
                  cloud_provider: 'azure',
                  project_id: sub.subscriptionId,
                  name: sub.displayName,
                  state: sub.state,
                });
              })
            );
            console.log('All projects created successfully');
          } catch (projectError) {
            console.error('Error creating projects:', projectError);
            throw projectError;
          }
        }

        // Refresh queries
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        
        setValidationError(null);
        // Reset form to allow adding another tenant
        setFormData({
          cloud_provider: provider,
          cloud_id: '',
          client_id: '',
          client_secret: '',
        });
        alert(`${provider.toUpperCase()} credentials saved successfully! Found ${validation.subscriptionCount} subscription(s).`);
        return;
      } catch (error) {
        setValidationError('Unable to validate credentials. Please check your credentials and try again.');
        setIsValidating(false);
        return;
      }
    }

    // For AWS/GCP (no validation yet), just save credentials
    createMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const providerColors = {
    azure: { bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-800', button: 'bg-blue-600 hover:bg-blue-700' },
    aws: { bg: 'bg-orange-50', border: 'border-orange-200', title: 'text-orange-800', button: 'bg-orange-600 hover:bg-orange-700' },
    gcp: { bg: 'bg-red-50', border: 'border-red-200', title: 'text-red-800', button: 'bg-red-600 hover:bg-red-700' },
  };

  const colors = providerColors[provider];

  return (
    <div className={`${colors.bg} border-2 ${colors.border} rounded-lg p-6`}>
      <h3 className={`text-2xl font-bold ${colors.title} mb-4`}>
        {provider.toUpperCase()}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Cloud ID</label>
          <input
            type="text"
            name="cloud_id"
            value={formData.cloud_id}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Cloud ID (Tenant/Account/Project ID)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Client ID</label>
          <input
            type="text"
            name="client_id"
            value={formData.client_id}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Client ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Client Secret</label>
          <input
            type="password"
            name="client_secret"
            value={formData.client_secret}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Client Secret"
          />
        </div>

        {validationError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="text-sm">{validationError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={createMutation.isPending || isValidating}
          className={`w-full ${colors.button} text-white py-2 rounded-md disabled:bg-gray-400`}
        >
          {isValidating ? 'Validating...' : createMutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}
