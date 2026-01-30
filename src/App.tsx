import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Login from './components/Login';
import Register from './components/Register';
import Header from './components/Header';
import BlankHome from './components/BlankHome';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import AddCredentialsPage from './components/AddCredentialsPage';
import AzureCredentialsPage from './components/AzureCredentialsPage';
import { isAuthenticated, getToken } from './auth';
import { api } from './api';

function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = getToken();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const { data: inventoryData } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.getInventory(token!),
    enabled: !!token,
  });

  const hasAzureCredentials = inventoryData?.inventories?.azure?.length > 0;

  const handleLogout = () => {
    navigate('/login');
  };

  const handleNavigate = (view: string) => {
    navigate(`/${view === 'home' ? '' : view}`);
  };

  const currentView = location.pathname === '/' ? 'home' : location.pathname.slice(1);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        onNavigate={handleNavigate} 
        currentView={currentView}
        onLogout={handleLogout}
      />
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-20 bg-white shadow-md flex flex-col items-center py-6 gap-4">
          {/* Azure Section - Show if credentials exist */}
          {hasAzureCredentials && (
            <div className="flex flex-col items-center gap-2">
              {/* Azure Logo */}
              <div className="w-14 border-b border-gray-200 pb-2">
                <svg className="w-10 h-10 mx-auto" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="azure-nav-a" x1="60.919" y1="9.602" x2="18.667" y2="134.423" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#114A8B"/>
                      <stop offset="1" stopColor="#0669BC"/>
                    </linearGradient>
                    <linearGradient id="azure-nav-b" x1="74.117" y1="67.772" x2="64.344" y2="71.076" gradientUnits="userSpaceOnUse">
                      <stop stopOpacity=".3"/>
                      <stop offset=".071" stopOpacity=".2"/>
                      <stop offset=".321" stopOpacity=".1"/>
                      <stop offset=".623" stopOpacity=".05"/>
                      <stop offset="1" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="azure-nav-c" x1="68.742" y1="5.961" x2="115.122" y2="129.525" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#3CCBF4"/>
                      <stop offset="1" stopColor="#2892DF"/>
                    </linearGradient>
                  </defs>
                  <path d="M46.09.002h40.685L44.541 125.137a6.485 6.485 0 01-6.146 4.413H6.733a6.482 6.482 0 01-5.262-2.699 6.474 6.474 0 01-.876-5.848L39.944 4.414A6.488 6.488 0 0146.09 0z" fill="url(#azure-nav-a)" transform="translate(.587 4.468) scale(.91904)"/>
                  <path d="M97.28 81.607H37.987a2.743 2.743 0 00-1.874 4.751l38.1 35.562a5.991 5.991 0 004.087 1.61h33.574z" fill="#0078d4"/>
                  <path d="M46.09.002A6.434 6.434 0 0039.93 4.5L.644 120.897a6.469 6.469 0 006.106 8.653h32.48a6.942 6.942 0 005.328-4.531l7.834-23.089 27.985 26.101a6.618 6.618 0 004.165 1.519h36.396l-15.963-45.616-46.533.011L86.922.002z" fill="url(#azure-nav-b)" transform="translate(.587 4.468) scale(.91904)"/>
                  <path d="M98.055 4.408A6.476 6.476 0 0091.917.002H46.575a6.478 6.478 0 016.137 4.406l39.35 116.594a6.476 6.476 0 01-6.137 8.55h45.344a6.48 6.48 0 006.136-8.55z" fill="url(#azure-nav-c)" transform="translate(.587 4.468) scale(.91904)"/>
                </svg>
              </div>
              
              {/* Subscription Icons - One per credential */}
              {inventoryData?.inventories?.azure?.map((credential) => (
                <button
                  key={credential._id}
                  onClick={() => navigate(`/azure/${credential._id}`)}
                  className="w-12 h-12 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
                  title={credential.app_name || 'Azure Subscription'}
                >
                  <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
                    <defs>
                      <linearGradient id={`azure-sub-gradient-${credential._id}`} x1="-6518.78" y1="1118.86" x2="-6518.78" y2="1090.06" gradientTransform="matrix(0.5, 0, 0, -0.5, 3267.42, 559.99)" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#5ea0ef"/>
                        <stop offset="0.18" stopColor="#589eed"/>
                        <stop offset="0.41" stopColor="#4897e9"/>
                        <stop offset="0.66" stopColor="#2e8ce1"/>
                        <stop offset="0.94" stopColor="#0a7cd7"/>
                        <stop offset="1" stopColor="#0078d4"/>
                      </linearGradient>
                    </defs>
                    <path d="M5.67,10.61H10v4.32H5.67Zm-5-5.76H5V.53H1.23a.6.6,0,0,0-.6.6Zm.6,10.08H5V10.61H.63v3.72A.6.6,0,0,0,1.23,14.93Zm-.6-5H5V5.57H.63Zm10.08,5h3.72a.6.6,0,0,0,.6-.6V10.61H10.71Zm-5-5H10V5.57H5.67Zm5,0H15V5.57H10.71Zm0-9.36V4.85H15V1.13a.6.6,0,0,0-.6-.6Zm-5,4.32H10V.53H5.67Z" fill={`url(#azure-sub-gradient-${credential._id})`}/>
                    <polygon points="17.37 10.7 17.37 15.21 13.5 17.47 13.5 12.96 17.37 10.7" fill="#32bedd"/>
                    <polygon points="17.37 10.7 13.5 12.97 9.63 10.7 13.5 8.44 17.37 10.7" fill="#9cebff"/>
                    <polygon points="13.5 12.97 13.5 17.47 9.63 15.21 9.63 10.7 13.5 12.97" fill="#50e6ff"/>
                    <polygon points="9.63 15.21 13.5 12.96 13.5 17.47 9.63 15.21" fill="#9cebff"/>
                    <polygon points="17.37 15.21 13.5 12.96 13.5 17.47 17.37 15.21" fill="#50e6ff"/>
                  </svg>
                </button>
              ))}
              
              {/* Add Azure Credentials Button */}
              <button
                onClick={() => navigate('/azure-app-credentials')}
                className="w-12 h-12 border-2 border-dashed border-blue-400 rounded flex items-center justify-center hover:bg-blue-50 transition-colors"
                title="Add Azure Credentials"
              >
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#3b82f6">
                  <path d="M440-440H240q-17 0-28.5-11.5T200-480q0-17 11.5-28.5T240-520h200v-200q0-17 11.5-28.5T480-760q17 0 28.5 11.5T520-720v200h200q17 0 28.5 11.5T760-480q0 17-11.5 28.5T720-440H520v200q0 17-11.5 28.5T480-200q-17 0-28.5-11.5T440-240v-200Z"/>
                </svg>
              </button>
            </div>
          )}
          
          {/* Add Azure Button - Only show if no credentials */}
          {!hasAzureCredentials && (
            <button
              onClick={() => navigate('/azure-app-credentials')}
              className="w-14 h-14 border-2 border-dashed border-blue-400 rounded-md flex items-center justify-center hover:bg-blue-50 transition-colors"
              title="Add Azure Credentials"
            >
              <svg className="w-10 h-10" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="azure-nav-a-empty" x1="60.919" y1="9.602" x2="18.667" y2="134.423" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#114A8B"/>
                    <stop offset="1" stopColor="#0669BC"/>
                  </linearGradient>
                  <linearGradient id="azure-nav-b-empty" x1="74.117" y1="67.772" x2="64.344" y2="71.076" gradientUnits="userSpaceOnUse">
                    <stop stopOpacity=".3"/>
                    <stop offset=".071" stopOpacity=".2"/>
                    <stop offset=".321" stopOpacity=".1"/>
                    <stop offset=".623" stopOpacity=".05"/>
                    <stop offset="1" stopOpacity="0"/>
                  </linearGradient>
                  <linearGradient id="azure-nav-c-empty" x1="68.742" y1="5.961" x2="115.122" y2="129.525" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3CCBF4"/>
                    <stop offset="1" stopColor="#2892DF"/>
                  </linearGradient>
                </defs>
                <path d="M46.09.002h40.685L44.541 125.137a6.485 6.485 0 01-6.146 4.413H6.733a6.482 6.482 0 01-5.262-2.699 6.474 6.474 0 01-.876-5.848L39.944 4.414A6.488 6.488 0 0146.09 0z" fill="url(#azure-nav-a-empty)" transform="translate(.587 4.468) scale(.91904)"/>
                <path d="M97.28 81.607H37.987a2.743 2.743 0 00-1.874 4.751l38.1 35.562a5.991 5.991 0 004.087 1.61h33.574z" fill="#0078d4"/>
                <path d="M46.09.002A6.434 6.434 0 0039.93 4.5L.644 120.897a6.469 6.469 0 006.106 8.653h32.48a6.942 6.942 0 005.328-4.531l7.834-23.089 27.985 26.101a6.618 6.618 0 004.165 1.519h36.396l-15.963-45.616-46.533.011L86.922.002z" fill="url(#azure-nav-b-empty)" transform="translate(.587 4.468) scale(.91904)"/>
                <path d="M98.055 4.408A6.476 6.476 0 0091.917.002H46.575a6.478 6.478 0 016.137 4.406l39.35 116.594a6.476 6.476 0 01-6.137 8.55h45.344a6.48 6.48 0 006.136-8.55z" fill="url(#azure-nav-c-empty)" transform="translate(.587 4.468) scale(.91904)"/>
              </svg>
            </button>
          )}

          {/* AWS Button */}
              <button
                className="w-14 h-24 border border-gray-300 rounded-md flex flex-col items-center justify-center hover:bg-gray-50 transition-colors gap-3 py-2"
                title="AWS"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-10 h-10">
                  <path fill="#252f3e" d="M13.527,21.529c0,0.597,0.064,1.08,0.176,1.435c0.128,0.355,0.287,0.742,0.511,1.161 c0.08,0.129,0.112,0.258,0.112,0.371c0,0.161-0.096,0.322-0.303,0.484l-1.006,0.677c-0.144,0.097-0.287,0.145-0.415,0.145 c-0.16,0-0.319-0.081-0.479-0.226c-0.224-0.242-0.415-0.5-0.575-0.758c-0.16-0.274-0.319-0.58-0.495-0.951 c-1.245,1.483-2.81,2.225-4.694,2.225c-1.341,0-2.411-0.387-3.193-1.161s-1.181-1.806-1.181-3.096c0-1.37,0.479-2.483,1.453-3.321 s2.267-1.258,3.911-1.258c0.543,0,1.102,0.048,1.692,0.129s1.197,0.21,1.836,0.355v-1.177c0-1.225-0.255-2.08-0.75-2.58 c-0.511-0.5-1.373-0.742-2.602-0.742c-0.559,0-1.133,0.064-1.724,0.21c-0.591,0.145-1.165,0.322-1.724,0.548 c-0.255,0.113-0.447,0.177-0.559,0.21c-0.112,0.032-0.192,0.048-0.255,0.048c-0.224,0-0.335-0.161-0.335-0.5v-0.79 c0-0.258,0.032-0.451,0.112-0.564c0.08-0.113,0.224-0.226,0.447-0.339c0.559-0.29,1.229-0.532,2.012-0.726 c0.782-0.21,1.612-0.306,2.49-0.306c1.9,0,3.289,0.435,4.183,1.306c0.878,0.871,1.325,2.193,1.325,3.966v5.224H13.527z M7.045,23.979c0.527,0,1.07-0.097,1.644-0.29c0.575-0.193,1.086-0.548,1.517-1.032c0.255-0.306,0.447-0.645,0.543-1.032 c0.096-0.387,0.16-0.855,0.16-1.403v-0.677c-0.463-0.113-0.958-0.21-1.469-0.274c-0.511-0.064-1.006-0.097-1.501-0.097 c-1.07,0-1.852,0.21-2.379,0.645s-0.782,1.048-0.782,1.854c0,0.758,0.192,1.322,0.591,1.709 C5.752,23.786,6.311,23.979,7.045,23.979z M19.865,25.721c-0.287,0-0.479-0.048-0.607-0.161c-0.128-0.097-0.239-0.322-0.335-0.629 l-3.752-12.463c-0.096-0.322-0.144-0.532-0.144-0.645c0-0.258,0.128-0.403,0.383-0.403h1.565c0.303,0,0.511,0.048,0.623,0.161 c0.128,0.097,0.223,0.322,0.319,0.629l2.682,10.674l2.49-10.674c0.08-0.322,0.176-0.532,0.303-0.629 c0.128-0.097,0.351-0.161,0.639-0.161h1.277c0.303,0,0.511,0.048,0.639,0.161c0.128,0.097,0.239,0.322,0.303,0.629l2.522,10.803 l2.762-10.803c0.096-0.322,0.208-0.532,0.319-0.629c0.128-0.097,0.335-0.161,0.623-0.161h1.485c0.255,0,0.399,0.129,0.399,0.403 c0,0.081-0.016,0.161-0.032,0.258s-0.048,0.226-0.112,0.403l-3.847,12.463c-0.096,0.322-0.208,0.532-0.335,0.629 s-0.335,0.161-0.607,0.161h-1.373c-0.303,0-0.511-0.048-0.639-0.161c-0.128-0.113-0.239-0.322-0.303-0.645l-2.474-10.4 L22.18,24.915c-0.08,0.322-0.176,0.532-0.303,0.645c-0.128,0.113-0.351,0.161-0.639,0.161H19.865z M40.379,26.156 c-0.83,0-1.66-0.097-2.458-0.29c-0.798-0.193-1.421-0.403-1.836-0.645c-0.255-0.145-0.431-0.306-0.495-0.451 c-0.064-0.145-0.096-0.306-0.096-0.451v-0.822c0-0.339,0.128-0.5,0.367-0.5c0.096,0,0.192,0.016,0.287,0.048 c0.096,0.032,0.239,0.097,0.399,0.161c0.543,0.242,1.133,0.435,1.756,0.564c0.639,0.129,1.261,0.193,1.9,0.193 c1.006,0,1.788-0.177,2.331-0.532c0.543-0.355,0.83-0.871,0.83-1.532c0-0.451-0.144-0.822-0.431-1.129 c-0.287-0.306-0.83-0.58-1.612-0.838l-2.315-0.726c-1.165-0.371-2.027-0.919-2.554-1.645c-0.527-0.709-0.798-1.499-0.798-2.338 c0-0.677,0.144-1.274,0.431-1.79s0.671-0.967,1.149-1.322c0.479-0.371,1.022-0.645,1.66-0.838C39.533,11.081,40.203,11,40.906,11 c0.351,0,0.718,0.016,1.07,0.064c0.367,0.048,0.702,0.113,1.038,0.177c0.319,0.081,0.623,0.161,0.91,0.258s0.511,0.193,0.671,0.29 c0.224,0.129,0.383,0.258,0.479,0.403c0.096,0.129,0.144,0.306,0.144,0.532v0.758c0,0.339-0.128,0.516-0.367,0.516 c-0.128,0-0.335-0.064-0.607-0.193c-0.91-0.419-1.932-0.629-3.065-0.629c-0.91,0-1.628,0.145-2.123,0.451 c-0.495,0.306-0.75,0.774-0.75,1.435c0,0.451,0.16,0.838,0.479,1.145c0.319,0.306,0.91,0.613,1.756,0.887l2.267,0.726 c1.149,0.371,1.98,0.887,2.474,1.548s0.734,1.419,0.734,2.257c0,0.693-0.144,1.322-0.415,1.87 c-0.287,0.548-0.671,1.032-1.165,1.419c-0.495,0.403-1.086,0.693-1.772,0.903C41.943,26.043,41.193,26.156,40.379,26.156z"/>
                  <path fill="#f90" d="M43.396,33.992c-5.252,3.918-12.883,5.998-19.445,5.998c-9.195,0-17.481-3.434-23.739-9.142 c-0.495-0.451-0.048-1.064,0.543-0.709c6.769,3.966,15.118,6.369,23.755,6.369c5.827,0,12.229-1.225,18.119-3.741 C43.508,32.364,44.258,33.347,43.396,33.992z M45.583,31.477c-0.671-0.871-4.438-0.419-6.146-0.21 c-0.511,0.064-0.591-0.387-0.128-0.726c3.001-2.128,7.934-1.516,8.509-0.806c0.575,0.726-0.16,5.708-2.969,8.094 c-0.431,0.371-0.846,0.177-0.655-0.306C44.833,35.927,46.254,32.331,45.583,31.477z"/>
                </svg>
                <div 
                  className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center cursor-pointer hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/add-credentials');
                  }}
                  title="Add AWS Credentials"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#666666">
                    <path d="M440-440H240q-17 0-28.5-11.5T200-480q0-17 11.5-28.5T240-520h200v-200q0-17 11.5-28.5T480-760q17 0 28.5 11.5T520-720v200h200q17 0 28.5 11.5T760-480q0 17-11.5 28.5T720-440H520v200q0 17-11.5 28.5T480-200q-17 0-28.5-11.5T440-240v-200Z"/>
                  </svg>
                </div>
              </button>

              {/* GCP Button */}
              <button
                className="w-14 h-24 border border-gray-300 rounded-md flex flex-col items-center justify-center hover:bg-gray-50 transition-colors gap-3 py-2"
                title="GCP"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-10 h-10">
                  <path fill="#1976d2" d="M38.193,18.359c-0.771-2.753-2.319-5.177-4.397-7.03l-4.598,4.598	c1.677,1.365,2.808,3.374,3.014,5.648v1.508c0.026,0,0.05-0.008,0.076-0.008c2.322,0,4.212,1.89,4.212,4.212S34.61,31.5,32.288,31.5	c-0.026,0-0.05-0.007-0.076-0.008V31.5h-6.666H24V38h8.212v-0.004c0.026,0,0.05,0.004,0.076,0.004C38.195,38,43,33.194,43,27.288	C43,23.563,41.086,20.279,38.193,18.359z"/>
                  <path fill="#ffe082" d="M19.56,25.59l4.72-4.72c-0.004-0.005-0.008-0.009-0.011-0.013l-4.717,4.717	C19.554,25.579,19.557,25.584,19.56,25.59z" opacity=".5"/>
                  <path fill="#90caf9" d="M19.56,25.59l4.72-4.72c-0.004-0.005-0.008-0.009-0.011-0.013l-4.717,4.717	C19.554,25.579,19.557,25.584,19.56,25.59z" opacity=".5"/>
                  <path fill="#ff3d00" d="M24,7.576c-8.133,0-14.75,6.617-14.75,14.75c0,0.233,0.024,0.46,0.035,0.69h6.5	c-0.019-0.228-0.035-0.457-0.035-0.69c0-4.549,3.701-8.25,8.25-8.25c1.969,0,3.778,0.696,5.198,1.851l4.598-4.598	C31.188,9.003,27.761,7.576,24,7.576z"/>
                  <path fill="#90caf9" d="M15.712,31.5L15.712,31.5c-0.001,0-0.001,0-0.002,0c-0.611,0-1.188-0.137-1.712-0.373	l-4.71,4.71C11.081,37.188,13.301,38,15.71,38c0.001,0,0.001,0,0.002,0v0H24v-6.5H15.712z" opacity=".5"/>
                  <path fill="#4caf50" d="M15.712,31.5L15.712,31.5c-0.001,0-0.001,0-0.002,0c-0.611,0-1.188-0.137-1.712-0.373l-4.71,4.71	C11.081,37.188,13.301,38,15.71,38c0.001,0,0.001,0,0.002,0v0H24v-6.5H15.712z"/>
                  <path fill="#ffc107" d="M11.5,27.29c0-2.32,1.89-4.21,4.21-4.21c1.703,0,3.178,1.023,3.841,2.494l4.717-4.717	c-1.961-2.602-5.065-4.277-8.559-4.277C9.81,16.58,5,21.38,5,27.29c0,3.491,1.691,6.59,4.288,8.547l4.71-4.71	C12.53,30.469,11.5,28.999,11.5,27.29z"/>
                </svg>
                <div 
                  className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center cursor-pointer hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/add-credentials');
                  }}
                  title="Add GCP Credentials"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#666666">
                    <path d="M440-440H240q-17 0-28.5-11.5T200-480q0-17 11.5-28.5T240-520h200v-200q0-17 11.5-28.5T480-760q17 0 28.5 11.5T520-720v200h200q17 0 28.5 11.5T760-480q0 17-11.5 28.5T720-440H520v200q0 17-11.5 28.5T480-200q-17 0-28.5-11.5T440-240v-200Z"/>
                  </svg>
                </div>
              </button>
            </aside>
            
            <main className="container px-4 py-8 flex-1">
              <Routes>
                <Route path="/" element={<BlankHome />} />
                <Route path="/azure/:inventoryId" element={<HomePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/add-credentials" element={<AddCredentialsPage />} />
                <Route path="/azure-app-credentials" element={<AzureCredentialsPage />} />
              </Routes>
            </main>
          </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </Router>
  );
}

function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Cloud Management System</h1>
        </div>
      </header>
      <main className="container px-4 py-8">
        <Login
          onSuccess={() => navigate('/')}
          onSwitchToRegister={() => navigate('/register')}
        />
      </main>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Cloud Management System</h1>
        </div>
      </header>
      <main className="container px-4 py-8">
        <Register
          onSuccess={() => navigate('/login')}
          onSwitchToLogin={() => navigate('/login')}
        />
      </main>
    </div>
  );
}

export default App;
