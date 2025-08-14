import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileForm from "../components/ProfileForm";

export default function ProfileSetup() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/users/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          
          localStorage.removeItem("token");
          navigate("/");
          return;
        }

        const data = await response.json();
        const userData = data.user || data;
        setUser(userData);
        
        // Check if user already has completed profile (has skills, goals, etc.)
        if (userData.skills && userData.skills.length > 0 || userData.goals && userData.goals.length > 0) {
          // User already has skills or goals, redirect to profile page
          navigate("/profile");
          return;
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

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    // Redirect to main profile page after successful setup
    navigate("/profile");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to SkillSync, {user?.name || 'Developer'}!
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Let's get to know you better. Complete your profile to connect with other developers, 
            showcase your skills, and find amazing collaboration opportunities.
          </p>
        </div>

        {/* Profile Form */}
        <ProfileForm 
          user={user} 
          onProfileUpdate={handleProfileUpdate}
          isEditing={false}
        />

        {/* Skip Option */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/profile")}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            Skip for now, I'll complete this later
          </button>
        </div>
      </div>
    </div>
  );
}
