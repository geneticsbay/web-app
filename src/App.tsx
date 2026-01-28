import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Header from './components/Header';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import AddCredentialsPage from './components/AddCredentialsPage';
import { isAuthenticated } from './auth';

type View = 'login' | 'register' | 'home' | 'profile' | 'add-credentials';

function App() {
  const [currentView, setCurrentView] = useState<View>('login');

  useEffect(() => {
    if (isAuthenticated()) {
      setCurrentView('home');
    }
  }, []);

  const handleLoginSuccess = () => {
    setCurrentView('home');
  };

  const handleRegisterSuccess = () => {
    setCurrentView('login');
  };

  const handleLogout = () => {
    setCurrentView('login');
  };

  const handleNavigate = (view: 'home' | 'profile' | 'add-credentials') => {
    setCurrentView(view);
  };

  const showHeader = currentView !== 'login' && currentView !== 'register';

  return (
    <div className="min-h-screen bg-gray-100">
      {showHeader && (
        <Header 
          onNavigate={handleNavigate} 
          currentView={currentView}
          onLogout={handleLogout}
        />
      )}

      {!showHeader && (
        <header className="bg-blue-600 text-white p-4 shadow-md">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold">Cloud Management System</h1>
          </div>
        </header>
      )}

      <main className="container mx-auto px-4 py-8">
        {currentView === 'login' && (
          <Login
            onSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setCurrentView('register')}
          />
        )}

        {currentView === 'register' && (
          <Register
            onSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )}

        {currentView === 'home' && <HomePage />}

        {currentView === 'profile' && <ProfilePage />}

        {currentView === 'add-credentials' && <AddCredentialsPage />}
      </main>
    </div>
  );
}

export default App;
