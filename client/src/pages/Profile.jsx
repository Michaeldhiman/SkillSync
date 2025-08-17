import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileForm from "../components/ProfileForm";
import Navigation from '../components/Navigation';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [goalFilter, setGoalFilter] = useState("");
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [sendingRequests, setSendingRequests] = useState(new Set());
  const [requestStatus, setRequestStatus] = useState({});
  const navigate = useNavigate();

  // Simple normalization + synonyms for matching goal filter
  const normalize = (s) => (s ? String(s).toLowerCase().replace(/[^a-z0-9+#]/g, "") : "");
  const GOAL_SYNONYMS = {
    golang: ["go"],
    go: ["golang"],
    javascript: ["js"],
    js: ["javascript"],
    typescript: ["ts"],
    ts: ["typescript"],
  };

  const selectedGoalTokens = useMemo(() => {
    if (!goalFilter) return null;
    const token = normalize(goalFilter);
    const set = new Set([token]);
    const syns = GOAL_SYNONYMS[token];
    if (syns) syns.forEach((t) => set.add(t));
    return set;
  }, [goalFilter]);

  const filteredSuggestions = useMemo(() => {
    if (!selectedGoalTokens) return suggestions;
    return suggestions.filter((s) =>
      Array.isArray(s.goals) &&
      s.goals.some((g) => selectedGoalTokens.has(normalize(g)))
    );
  }, [suggestions, selectedGoalTokens]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          localStorage.removeItem("token");
          navigate("/");
          return;
        }

        const data = await response.json();
        const userData = data.user || data;
        setUser(userData);

        if (!userData.skills || userData.skills.length === 0) {
          if (!userData.goals || userData.goals.length === 0) {
            navigate("/profile-setup");
            return;
          }
        }
        try {
          const sugRes = await fetch(
            `${import.meta.env.VITE_API_URL}/api/users/match-suggestions`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (sugRes.ok) {
            const sugData = await sugRes.json();
            setSuggestions(
              Array.isArray(sugData.suggestions) ? sugData.suggestions : []
            );
          } else {
            setSuggestions([]);
          }
        } catch {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        localStorage.removeItem("token");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    setShowProfileForm(false);
  };

  // Send connection request
  const sendConnectionRequest = async (toUserId, toUserName) => {
    const token = localStorage.getItem("token");
    if (!token || !user || !user._id || !toUserId) {
      console.error('Missing required data:', { token: !!token, user: !!user, userId: user?._id, toUserId });
      return;
    }

    setSendingRequests(prev => new Set(prev).add(toUserId));
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/connect-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromUserId: user._id,
          toUserId: toUserId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRequestStatus(prev => ({
          ...prev,
          [toUserId]: { type: 'success', message: `Connection request sent to ${toUserName}!` }
        }));
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setRequestStatus(prev => {
            const newStatus = { ...prev };
            delete newStatus[toUserId];
            return newStatus;
          });
        }, 3000);
      } else {
        setRequestStatus(prev => ({
          ...prev,
          [toUserId]: { type: 'error', message: data.message || 'Failed to send request' }
        }));
      }
    } catch (error) {
      console.error("Error sending connection request:", error);
      setRequestStatus(prev => ({
        ...prev,
        [toUserId]: { type: 'error', message: 'Network error. Please try again.' }
      }));
    } finally {
      setSendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(toUserId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg animate-pulse">
            <svg
              className="w-8 h-8 text-white"
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
          </div>
          <h2 className="text-xl font-semibold text-gray-700">
            Loading your profile...
          </h2>
          <p className="text-gray-500 mt-2">
            Please wait while we fetch your information
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">
            Profile Not Found
          </h2>
          <p className="text-gray-500 mt-2">
            Unable to load your profile information
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
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
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
              </div>
            </div>
          </div>
        </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-12 text-white">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <svg
                    className="w-12 h-12 text-white"
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
                )}
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Welcome back, {user.name}!
                </h1>
                <p className="text-blue-100 text-lg">
                  We're glad to see you again
                </p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {user.skills?.length || 0}
                </div>
                <div className="text-gray-600">Skills Added</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {user.goals?.length || 0}
                </div>
                <div className="text-gray-600">Goals Set</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {user.mode || "Online"}
                </div>
                <div className="text-gray-600">Preferred Mode</div>
              </div>
            </div>
          </div>
        </div>

        {showProfileForm ? (
          <ProfileForm
            user={user}
            onProfileUpdate={handleProfileUpdate}
            isEditing={true}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
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
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Personal Information
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <svg
                    className="w-5 h-5 text-gray-400"
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
                  <div>
                    <div className="text-sm text-gray-500">Full Name</div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <div className="text-sm text-gray-500">Email Address</div>
                    <div className="font-medium text-gray-900">
                      {user.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <div className="text-sm text-gray-500">Member Since</div>
                    <div className="font-medium text-gray-900">Today</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Quick Actions
                </h2>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setShowProfileForm(true)}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-purple-100 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">
                        Edit Profile
                      </div>
                      <div className="text-sm text-gray-600">
                        Update your information
                      </div>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => navigate('/connection-requests')}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg hover:from-green-100 hover:to-blue-100 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">
                        Connection Requests
                      </div>
                      <div className="text-sm text-gray-600">
                        View and manage your requests
                      </div>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => navigate('/connections')}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">
                        My Connections
                      </div>
                      <div className="text-sm text-gray-600">
                        View your connected users
                      </div>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {!showProfileForm && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Skills</h2>
              </div>

              {user.skills && user.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No skills added yet
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Goals</h2>
              </div>

              {user.goals && user.goals.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.goals.map((goal, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() => setGoalFilter(goal)}
                      title={`Show peers for goal: ${goal}`}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition shadow-sm hover:shadow ${
                        goalFilter === goal
                          ? "bg-green-600 text-white"
                          : "bg-green-100 text-green-800 hover:bg-green-200"
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No goals set yet
                </p>
              )}
            </div>
          </div>
        )}

        {!showProfileForm && suggestions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mt-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Suggested Peers</h2>
            </div>

            {(() => {
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredSuggestions.map((s) => (
                    <div
                      key={s._id}
                      className="p-6 border border-gray-100 rounded-xl hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                          {s.profilePicture ? (
                            <img
                              src={s.profilePicture}
                              alt={s.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              {s.name?.[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {s.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {s.mode || "Online"} •{" "}
                            {s.availability || "Availability N/A"}
                          </div>
                        </div>
                      </div>


                      {/* Display skills and goals */}
                      <div className="mt-4 space-y-3">
                        {s.skills && s.skills.length > 0 && (
                          <div>
                            <div className="text-sm text-gray-500 mb-2">Skills</div>
                            <div className="flex flex-wrap gap-2">
                              {s.skills.slice(0, 3).map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {skill}
                                </span>
                              ))}
                              {s.skills.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{s.skills.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {s.goals && s.goals.length > 0 && (
                          <div>
                            <div className="text-sm text-gray-500 mb-2">Learning Goals</div>
                            <div className="flex flex-wrap gap-2">
                              {s.goals.slice(0, 3).map((goal, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                >
                                  {goal}
                                </span>
                              ))}
                              {s.goals.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{s.goals.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Match Score */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-600">Match Score:</span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                            {s.matchScore}
                          </span>
                        </div>
                      </div>

                      {/* Connection Request Button */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {requestStatus[s._id] ? (
                          <div className={`p-3 rounded-lg text-sm ${
                            requestStatus[s._id].type === 'success' 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {requestStatus[s._id].message}
                          </div>
                        ) : (
                          <button
                            onClick={() => sendConnectionRequest(s._id, s.name)}
                            disabled={sendingRequests.has(s._id)}
                            className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                              sendingRequests.has(s._id)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                            }`}
                          >
                            {sendingRequests.has(s._id) ? (
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                <span>Sending...</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span>Send Request</span>
                              </div>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {!showProfileForm && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mt-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Additional Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-2">Preferred Mode</div>
                <div className="font-medium text-gray-900">
                  {user.mode || "Online"}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-2">Availability</div>
                <div className="font-medium text-gray-900">
                  {user.availability || "Not specified"}
                </div>
              </div>
            </div>
          </div>
        )}

        {!showProfileForm && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mt-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Activity
              </h2>
            </div>

            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-6a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No activity yet
              </h3>
              <p className="text-gray-500">
                Start building your profile by adding skills and projects
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
