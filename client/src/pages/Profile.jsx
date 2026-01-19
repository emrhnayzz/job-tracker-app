import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState({ username: "", email: "" });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // LocalStorage'dan bilgileri al
  const storedUserId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUser = async () => {
      if (!storedUserId || !token) {
        console.log(
          "HATA: User ID veya Token bulunamadı. Lütfen tekrar giriş yapın."
        );
        toast.error("Oturum süresi dolmuş, lütfen tekrar giriş yapın.");
        navigate("/login");
        return;
      }

      try {
        console.log("Veri çekiliyor... ID:", storedUserId);

        const res = await axios.get(
          (import.meta.env.VITE_API_URL || "http://localhost:5001") +
            `/users/${storedUserId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Başarılı:", res.data);
        setUser(res.data);
      } catch (err) {
        console.error("Profil Yükleme Hatası:", err);
        const errorMessage =
          err.response?.data?.message || "Profil yüklenemedi.";
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [storedUserId, token, navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        (import.meta.env.VITE_API_URL || "http://localhost:5001") +
          `/users/${storedUserId}`,
        {
          username: user.username,
          email: user.email,
          ...passwords,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Profil başarıyla güncellendi! ✅");
      setUser(res.data);
      setPasswords({ currentPassword: "", newPassword: "" });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Güncelleme başarısız.");
    }
  };

  if (loading)
    return (
      <div className="text-center mt-10 text-white">Profil yükleniyor...</div>
    );

  return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Profil Ayarları</h2>

        <form onSubmit={handleUpdate} className="space-y-4">
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
            <h3 className="text-white text-md mb-2">
              Şifre Değiştir (İsteğe Bağlı)
            </h3>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Mevcut Şifreniz"
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
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded transition duration-300"
          >
            💾 Değişiklikleri Kaydet
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
