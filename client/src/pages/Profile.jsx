import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { FaCamera, FaUserCircle } from "react-icons/fa";

const Profile = () => {
  const [user, setUser] = useState({ username: "", email: "", avatar: "" });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const storedUserId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

  useEffect(() => {
    const fetchUser = async () => {
      if (!storedUserId || !token) {
        toast.error("Lütfen giriş yapın.");
        navigate("/login");
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/users/${storedUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);

        if (res.data.avatar) {
          const avatarUrl = res.data.avatar.startsWith("http")
            ? res.data.avatar
            : `${API_URL}${res.data.avatar}`;
          setPreview(avatarUrl);
        }
      } catch (err) {
        console.error(err);
        toast.error("Profil yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [storedUserId, token, navigate, API_URL]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("username", user.username);
    formData.append("email", user.email);
    if (passwords.currentPassword)
      formData.append("currentPassword", passwords.currentPassword);
    if (passwords.newPassword)
      formData.append("newPassword", passwords.newPassword);
    if (file) formData.append("avatar", file);

    try {
      const res = await axios.put(
        `${API_URL}/users/${storedUserId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Profil güncellendi! 🚀");
      setUser(res.data);
      setPasswords({ currentPassword: "", newPassword: "" });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Güncelleme başarısız.");
    }
  };

  if (loading)
    return <div className="text-center mt-10 text-white">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Profil Ayarları
        </h2>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4 group cursor-pointer">
              {preview ? (
                <img
                  src={preview}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover border-4 border-indigo-600"
                />
              ) : (
                <FaUserCircle className="w-full h-full text-gray-500" />
              )}

              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <FaCamera className="text-white text-2xl" />
              </div>
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-gray-400 text-sm">
              Resmi değiştirmek için tıklayın
            </p>
          </div>

          <div>
            <label className="text-gray-400 text-sm">Kullanıcı Adı</label>
            <input
              type="text"
              value={user.username || ""}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">E-posta</label>
            <input
              type="email"
              value={user.email || ""}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-white text-md mb-2">Şifre Değiştir</h3>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Mevcut Şifre"
                value={passwords.currentPassword}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    currentPassword: e.target.value,
                  })
                }
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="password"
                placeholder="Yeni Şifre"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, newPassword: e.target.value })
                }
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded transition duration-300 shadow-lg"
          >
            💾 Kaydet
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
