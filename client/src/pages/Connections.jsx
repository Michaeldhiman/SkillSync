import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatPanel from "../components/ChatPanel";


function Connections() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    const fetchConnections = async () => {
      try {
        // Fetch user profile and connections
        const [userRes, sentRes, receivedRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/requests/sent`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/requests/received`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData);
        }

        const sentData = sentRes.ok ? await sentRes.json() : { requests: [] };
        const receivedData = receivedRes.ok ? await receivedRes.json() : { requests: [] };

        // Filter accepted connections and extract connected users
        const acceptedSent = sentData.requests?.filter(req => req.status === 'accepted') || [];
        const acceptedReceived = receivedData.requests?.filter(req => req.status === 'accepted') || [];

        // Combine and deduplicate connections
        const allConnections = [];
        const seenUsers = new Set();

        // Add users from sent requests (toUser) - these are users I sent requests to who accepted
        acceptedSent.forEach(req => {
          if (req.toUser && req.toUser._id && !seenUsers.has(req.toUser._id)) {
            allConnections.push({
              ...req.toUser,
              connectionDate: req.updatedAt || req.createdAt,
              connectionType: 'sent'
            });
            seenUsers.add(req.toUser._id);
          }
        });

        // Add users from received requests (fromUser) - these are users who sent me requests that I accepted
        acceptedReceived.forEach(req => {
          if (req.fromUser && req.fromUser._id && !seenUsers.has(req.fromUser._id)) {
            allConnections.push({
              ...req.fromUser,
              connectionDate: req.updatedAt || req.createdAt,
              connectionType: 'received'
            });
            seenUsers.add(req.fromUser._id);
          }
        });

        // Sort by connection date (most recent first)
        allConnections.sort((a, b) => new Date(b.connectionDate) - new Date(a.connectionDate));

        setConnections(allConnections);
      } catch (error) {
        console.error("Error fetching connections:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Filter connections based on search term
  const filteredConnections = connections.filter(connection =>
    connection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
    connection.goals?.some(goal => goal.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const startConversation = (connection) => {
    setSelectedConnection(connection);
    setIsChatOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">Loading connections...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">My Connections</h1>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {connections.length}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/profile")}
                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-200"
              >
                Back to Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search connections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Connections Grid */}
        {filteredConnections.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No matching connections" : "No connections yet"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? "Try adjusting your search terms" 
                : "Start connecting with other users to build your network!"
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate("/profile")}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Find Connections
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConnections.map((connection) => (
              <div key={connection._id} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-200">
                {/* User Header */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                    {connection.profilePicture ? (
                      <img
                        src={connection.profilePicture}
                        alt={connection.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl">
                        {connection.name?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{connection.name}</h3>
                    <p className="text-sm text-gray-500">{connection.email}</p>
                    <p className="text-xs text-gray-400">
                      Connected {new Date(connection.connectionDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Skills */}
                {connection.skills && connection.skills.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-2 font-medium">Skills</div>
                    <div className="flex flex-wrap gap-2">
                      {connection.skills.slice(0, 4).map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                      {connection.skills.length > 4 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{connection.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Goals */}
                {connection.goals && connection.goals.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-2 font-medium">Learning Goals</div>
                    <div className="flex flex-wrap gap-2">
                      {connection.goals.slice(0, 3).map((goal, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {goal}
                        </span>
                      ))}
                      {connection.goals.length > 3 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{connection.goals.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Actions */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.open(`mailto:${connection.email}`, '_blank')}
                      className="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-all duration-200 text-sm font-medium"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>Email</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => startConversation(connection)}
                      className="flex-1 bg-green-50 text-green-600 px-4 py-2 rounded-lg hover:bg-green-100 transition-all duration-200 text-sm font-medium"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Message</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Panel */}
      {isChatOpen && currentUser && (
        <ChatPanel 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)}
          currentUser={currentUser}
          selectedConnection={selectedConnection}
        />
      )}
    </div>
  );
}

export default Connections;
