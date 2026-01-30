import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, CreateInventoryRequest } from '../api';
import { getToken } from '../auth';

export default function AzureCredentialsPage() {
  const navigate = useNavigate();
  const token = getToken();
  const queryClient = useQueryClient();
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateInventoryRequest>({
    cloud_provider: 'azure',
    cloud_id: '',
    client_id: '',
    client_secret: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate Azure credentials before saving
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

      // Fetch and save app registration name
      try {
        await api.getAppRegistrationName(token!);
        console.log('App registration name fetched and saved');
      } catch (appNameError) {
        console.error('Error fetching app registration name:', appNameError);
        // Don't fail the whole process if app name fetch fails
      }

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
      
      if (validation.subscriptionCount === 0) {
        alert('Azure credentials saved successfully! No subscriptions found. Please check the instructions on the home page.');
      } else {
        alert(`Azure credentials saved successfully! Found ${validation.subscriptionCount} subscription(s).`);
      }
      
      // Navigate to home page
      navigate('/');
      return;
    } catch (error) {
      setValidationError('Unable to validate credentials. Please check your credentials and try again.');
      setIsValidating(false);
      return;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="mr-4 text-gray-600 hover:text-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="text-3xl font-bold text-blue-800">Azure Credentials</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tenant ID (Cloud ID)
            </label>
            <input
              type="text"
              name="cloud_id"
              value={formData.cloud_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Azure Tenant ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application (Client) ID
            </label>
            <input
              type="text"
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Application (Client) ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Secret
            </label>
            <input
              type="password"
              name="client_secret"
              value={formData.client_secret}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Client Secret"
            />
          </div>

          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="text-sm">{validationError}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isValidating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-medium disabled:bg-gray-400 transition-colors"
            >
              {isValidating ? 'Validating...' : 'Save Credentials'}
            </button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions:</h3>
          <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
            <li>Register an application in Azure Active Directory</li>
            <li>Copy the Tenant ID and Application (Client) ID</li>
            <li>Create a client secret and copy its value</li>
            <li>Assign appropriate permissions to the application</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
