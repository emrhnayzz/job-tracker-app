import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaUser, FaEnvelope, FaLock, FaCamera, FaSave } from "react-icons/fa";

const Profile = () => {
  const [user, setUser] = useState({
    username: "",
    email: "",
    avatar_path: "",
  });
  const [passwords, setPasswords] = useState({ newPassword: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (userId) fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const res = await axios.get(
        `(import.meta.env.VITE_API_URL || "http://localhost:5001")/users/${userId}`
      );
      setUser(res.data);
      if (res.data.avatar_path) {
        setPreview(
          `(import.meta.env.VITE_API_URL || "http://localhost:5001")/${res.data.avatar_path}`
        );
      }
    } catch (err) {
      toast.error("Failed to load profile");
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("username", user.username);
    formData.append("email", user.email);
    if (passwords.newPassword)
      formData.append("password", passwords.newPassword);
    if (avatarFile) formData.append("avatar", avatarFile);

    try {
      const res = await axios.get(
        (import.meta.env.VITE_API_URL || "http://localhost:5001") +
          `/users/${storedUserId}`
      );

      // Update local storage and state
      localStorage.setItem("username", res.data.username);
      // Reload page to update Navbar avatar
      window.location.reload();
      toast.success("Profile updated! 🚀");
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (!userId)
    return (
      <div className="text-center mt-10 dark:text-white">
        Please login again to view profile.
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 transition-colors">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-4 dark:border-gray-700">
          Profile Settings
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AVATAR SECTION */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="relative w-32 h-32">
              <img
                src={preview || "https://via.placeholder.com/150"}
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100 dark:border-gray-600 shadow-sm"
              />
              <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition shadow-md">
                <FaCamera />
                <input
                  type="file"
                  className="hidden"
                  onChange={handleAvatarChange}
                  accept="image/*"
                />
              </label>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Allowed: JPG, PNG
            </p>
          </div>

          {/* INPUTS */}
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <div className="relative">
                <FaUser className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={user.username}
                  onChange={(e) =>
                    setUser({ ...user, username: e.target.value })
                  }
                  className="w-full pl-10 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  className="w-full pl-10 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password (Optional)
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  placeholder="Leave blank to keep current password"
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                  className="w-full pl-10 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition shadow-lg flex justify-center items-center gap-2"
          >
            {loading ? (
              "Saving..."
            ) : (
              <>
                <FaSave /> Save Changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
