import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, User, Users, MessageSquare, LogOut, Zap, Bell } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/connections', icon: Users, label: 'Connections' },
    { path: '/connection-requests', icon: MessageSquare, label: 'Requests' },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-4 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:rotate-3">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse shadow-sm"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                SkillSync
              </h1>
              <p className="text-xs text-gray-500 -mt-1 font-medium">Learn • Grow • Connect</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center space-x-3 px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 group ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/25'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 hover:shadow-md'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'} transition-colors duration-200`} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-sm"></div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <div className="relative">
              <button className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-2xl transition-all duration-200 group">
                <Bell className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
              </button>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-xs font-bold text-white">3</span>
              </div>
            </div>

            {/* User Avatar */}
            <div className="relative">
              <button className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center hover:shadow-lg transition-all duration-200 group">
                <User className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
              </button>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-3 text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-200 group border border-transparent hover:border-red-200"
            >
              <LogOut className="w-5 h-5 group-hover:text-red-600 transition-colors duration-200" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200/60 py-3">
          <div className="flex justify-around items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center space-y-2 p-3 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'text-blue-600 bg-blue-50/80 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/80'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform duration-200`} />
                  <span className="text-xs font-semibold">{item.label}</span>
                  {isActive && (
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
