import { removeToken } from '../auth';

interface HeaderProps {
  onNavigate: (view: 'home' | 'profile' | 'add-credentials') => void;
  currentView: string;
  onLogout: () => void;
}

export default function Header({ onNavigate, currentView, onLogout }: HeaderProps) {
  const handleLogout = () => {
    removeToken();
    onLogout();
  };

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md relative z-20">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <button
          onClick={() => onNavigate('home')}
          className="text-2xl font-bold hover:text-blue-100 transition-colors"
        >
          Cloud Management System
        </button>
        
        <div className="flex items-center gap-4">
          {/* Add Credentials Icon */}
          <button
            onClick={() => onNavigate('add-credentials')}
            className={`p-2 rounded-full hover:bg-blue-700 transition-colors ${
              currentView === 'add-credentials' ? 'bg-blue-700' : ''
            }`}
            title="Add Credentials"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>

          {/* Profile Icon */}
          <button
            onClick={() => onNavigate('profile')}
            className={`p-2 rounded-full hover:bg-blue-700 transition-colors ${
              currentView === 'profile' ? 'bg-blue-700' : ''
            }`}
            title="Profile"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
