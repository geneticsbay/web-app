import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { getToken } from '../auth';

export default function ProfilePage() {
  const token = getToken();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.getMe(token!),
    enabled: !!token,
  });

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
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">User Profile</h2>

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
    </div>
  );
}
