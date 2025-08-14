import { useState, useEffect } from "react";

export default function ProfileForm({ user, onProfileUpdate, isEditing = false }) {
  const [formData, setFormData] = useState({
    name: "",
    skills: [],
    goals: [],
    mode: "Online",
    availability: "",
    profilePicture: null
  });
  const [skillInput, setSkillInput] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Initialize form with user data if available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        skills: user.skills || [],
        goals: user.goals || [],
        mode: user.mode || "Online",
        availability: user.availability || "",
        profilePicture: user.profilePicture || null
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillAdd = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput("");
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleGoalAdd = () => {
    if (goalInput.trim() && !formData.goals.includes(goalInput.trim())) {
      setFormData(prev => ({
        ...prev,
        goals: [...prev.goals, goalInput.trim()]
      }));
      setGoalInput("");
    }
  };

  const handleGoalRemove = (goalToRemove) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter(goal => goal !== goalToRemove)
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error("Name is required");
      }

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append("name", formData.name.trim());
      submitData.append("skills", JSON.stringify(formData.skills || []));
      submitData.append("goals", JSON.stringify(formData.goals || []));
      submitData.append("mode", formData.mode || "Online");
      submitData.append("availability", formData.availability || "");
      
      // Only append profile picture if it's actually a File object
      if (formData.profilePicture && formData.profilePicture instanceof File) {
        submitData.append("profilePicture", formData.profilePicture);
      }

      
      
      const response = await fetch("http://localhost:5000/api/users/profile/update", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type header when sending FormData
        },
        body: submitData
      });

      
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      

      setSuccess("Profile updated successfully!");
      
      // Call the callback to update parent component
      if (onProfileUpdate) {
        onProfileUpdate(data.user || data);
      }

      // Reset form if not editing
      if (!isEditing) {
        setFormData({
          name: "",
          skills: [],
          goals: [],
          mode: "Online",
          availability: "",
          profilePicture: null
        });
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? "Edit Profile" : "Complete Your Profile"}
        </h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-green-700 text-sm">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
          />
        </div>

        {/* Skills Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Skills
          </label>
          <div className="space-y-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a skill (e.g., React, Node.js)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSkillAdd())}
              />
              <button
                type="button"
                onClick={handleSkillAdd}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
              >
                Add
              </button>
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleSkillRemove(skill)}
                      className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 transition-colors duration-200"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Goals Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Goals
          </label>
          <div className="space-y-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Add a goal (e.g., Learn TypeScript, Build a full-stack app)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleGoalAdd())}
              />
              <button
                type="button"
                onClick={handleGoalAdd}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 font-medium"
              >
                Add
              </button>
            </div>
            {formData.goals.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.goals.map((goal, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                  >
                    {goal}
                    <button
                      type="button"
                      onClick={() => handleGoalRemove(goal)}
                      className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-600 transition-colors duration-200"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mode Field */}
        <div>
          <label htmlFor="mode" className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Mode
          </label>
          <select
            id="mode"
            name="mode"
            value={formData.mode}
            onChange={handleChange}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        {/* Availability Field */}
        <div>
          <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-2">
            Availability
          </label>
          <input
            type="text"
            id="availability"
            name="availability"
            value={formData.availability}
            onChange={handleChange}
            placeholder="e.g., Weekdays 9 AM - 6 PM, Weekends flexible"
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
          />
        </div>

        {/* Profile Picture Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Picture (Optional)
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              {formData.profilePicture && (
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                  {formData.profilePicture instanceof File ? (
                    <img
                      src={URL.createObjectURL(formData.profilePicture)}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={formData.profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors duration-200"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: Square image, max 5MB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 transform ${
            loading
              ? "bg-gray-400 cursor-not-allowed scale-95"
              : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isEditing ? "Updating..." : "Saving Profile..."}
            </div>
          ) : (
            isEditing ? "Update Profile" : "Save Profile"
          )}
        </button>

      
      </form>
    </div>
  );
}
