import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { getToken } from '../auth';
import CloudProviderCard from './CloudProviderCard';

export default function AddCredentialsPage() {
  const token = getToken();

  const { isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.getInventory(token!),
    enabled: !!token,
  });

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
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
    </div>
  );
}
