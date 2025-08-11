import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
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
            console.log("Not authorized or error fetching profile");
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }
      
          const data = await response.json();
        
          // Adjust this depending on your backend response shape
          setUser(data.user || data); 
        } catch (err) {
          console.error("Error fetching profile:", err);
          localStorage.removeItem("token");
          navigate("/login");
        }
      };
      

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!user) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl mb-4">Welcome, {user.name}!</h2>
      <p><strong>Email:</strong> {user.email}</p>
      {/* Add other user info here */}
      <button onClick={handleLogout} className="bg-red-500 text-white py-2 mt-4">
        Logout
      </button>
    </div>
  );
}

export default Profile;
