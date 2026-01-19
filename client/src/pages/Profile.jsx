import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const Profile = () => {
  const [user, setUser] = useState({ username: "", email: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [loading, setLoading] = useState(true);

  // Get User ID from LocalStorage
  const storedUserId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchUser = async () => {
      if (!storedUserId) {
        setLoading(false);
        return;
      }
      try {
        // ✅ API URL DÜZELTİLDİ:
        const res = await axios.get((import.meta.env.VITE_API_URL || "http://localhost:5001") + `/users/${storedUserId}`);
        setUser(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [storedUserId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // ✅ API URL DÜZELTİLDİ:
      const res = await axios.put((import.meta.env.VITE_API_URL || "http://localhost:5001") + `/users/${storedUserId}`, {
        username: user.username,
        email: user.email,
        ...passwords,
      });
      toast.success("Profile updated successfully!");
      setUser(res.data);
      setPasswords({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  if (loading) return <div className="text-center mt-10 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm">Username</label>
            <input
              type="text"
              value={user.username}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">Email</label>
            <input
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">New Password (Optional)</label>
            <input
              type="password"
              placeholder="Leave blank to keep current password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded transition duration-300"
          >
            💾 Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;