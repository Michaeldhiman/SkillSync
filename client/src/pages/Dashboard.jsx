import React, { useState, useEffect } from 'react';
import { MessageCircle, BookOpen, Flame, TrendingUp, Clock, Target, Sparkles, Zap, Award, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import ChatPanel from '../components/ChatPanel';
import StudyTracker from '../components/StudyTracker';
import StreakCounter from '../components/StreakCounter';
import ActivityGraph from '../components/ActivityGraph';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(() => {
    // Restore chat state from localStorage on page load
    const savedChatState = localStorage.getItem('isChatOpen');
    return savedChatState === 'true';
  });
  const [studyData, setStudyData] = useState(null);
  const [streakData, setStreakData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for token first
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Try to get user from localStorage first
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        // If user data is corrupted, fetch from API
        fetchUserProfile(token);
      }
    } else {
      // If no user data in localStorage, fetch from API
      fetchUserProfile(token);
    }
  }, []);

  // Save chat state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('isChatOpen', isChatOpen.toString());
  }, [isChatOpen]);

  const handleChatClose = () => {
    setIsChatOpen(false);
    localStorage.setItem('isChatOpen', 'false');
  };

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        // If profile fetch fails, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const fetchStudyData = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/study/logs/${user._id}?period=week`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudyData(data);
      }
    } catch (error) {
      console.error('Error fetching study data:', error);
    }
  };

  const fetchStreakData = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/study/streak/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStreakData(data);
      }
    } catch (error) {
      console.error('Error fetching streak data:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStudyData();
      fetchStreakData();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Loading your dashboard...
          </h2>
          <p className="text-gray-600 mt-2">Preparing your learning journey ✨</p>
        </div>
      </div>
    );
  }

  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return "Good morning";
    if (currentHour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Ready to conquer your goals today? 🚀",
      "Every step forward is progress! 💪",
      "Your learning journey continues! 📚",
      "Time to unlock new knowledge! 🔓",
      "Let's make today productive! ⭐"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation />
      
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-purple-400/20 rounded-full blur-lg animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-indigo-400/20 rounded-full blur-2xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    {getGreeting()}, {user.name}!
                  </h1>
                  <p className="text-lg text-gray-600 mt-1 font-medium">{getMotivationalMessage()}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setIsChatOpen(true)}
                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">Start Chat</span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </button>
              
              <button className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 px-6 py-3 rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl border border-white/50">
                <Calendar className="w-5 h-5" />
                <span className="font-semibold">Schedule</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Study Tracker */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-xl p-6 border border-white/50 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">This Week</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">
                      {studyData?.summary?.totalHours?.toFixed(1) || '0'}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">hours studied</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Clock className="text-white w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-xl p-6 border border-white/50 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Sessions</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">
                      {studyData?.summary?.totalSessions || '0'}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">completed</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="text-white w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-xl p-6 border border-white/50 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Subjects</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">
                      {studyData?.summary?.subjects?.length || '0'}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">in progress</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Target className="text-white w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Study Tracker */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  Study Tracker
                  <Zap className="w-5 h-5 text-yellow-500" />
                </h2>
                <p className="text-gray-600 mt-1">Log your study sessions and track progress</p>
              </div>
              <StudyTracker onStudyLogged={fetchStudyData} />
            </div>

            {/* Activity Graph */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="bg-gradient-to-br from-emerald-500 to-blue-600 p-2 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  Weekly Activity
                  <Award className="w-5 h-5 text-orange-500" />
                </h2>
                <p className="text-gray-600 mt-1">Visualize your learning journey</p>
              </div>
              <ActivityGraph studyData={studyData} />
            </div>
          </div>

          {/* Right Column - Streak & Quick Actions */}
          <div className="space-y-8">
            
            {/* Streak Counter */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-xl">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  Study Streak
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse delay-100"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse delay-200"></div>
                  </div>
                </h2>
                <p className="text-gray-600 mt-1">Keep the momentum going!</p>
              </div>
              <StreakCounter streakData={streakData} />
            </div>

            {/* Recent Activity */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  Recent Sessions
                </h2>
                <p className="text-gray-600 mt-1">Your latest study activities</p>
              </div>
              <div className="p-6">
                {studyData?.studyLogs?.length > 0 ? (
                  <div className="space-y-4">
                    {studyData.studyLogs.slice(0, 5).map((log, index) => (
                      <div key={log._id} className="group flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{log.subject}</p>
                            <p className="text-sm text-gray-500 font-medium">
                              {new Date(log.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-blue-600 text-lg">{log.hours}h</p>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{log.difficulty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-500 font-medium">No study sessions yet</p>
                    <p className="text-sm text-gray-400 mt-1">Start tracking your progress! 🚀</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      {isChatOpen && (
        <ChatPanel 
          isOpen={isChatOpen} 
          onClose={handleChatClose}
          currentUser={user}
        />
      )}
    </div>
  );
};

export default Dashboard;
