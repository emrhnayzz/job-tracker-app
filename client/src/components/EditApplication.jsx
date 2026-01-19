import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

const EditApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    company: "",
    position: "",
    status: "Applied",
    dateApplied: "",
    workType: "Remote",
    salaryMin: "",
    salaryMax: "",
    currency: "USD",
    jobLink: "",
    description: "",
    notes: "",
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        console.log("Veri çekiliyor... ID:", id);
        
        // 1. Tüm listeyi çek (En garanti yöntem)
        const res = await axios.get(`${API_URL}/applications`, {
          params: { userId },
          headers: { Authorization: `Bearer ${token}` }
        });

        // 2. Gelen veri dizi mi kontrol et
        const apps = Array.isArray(res.data) ? res.data : (res.data.data || []);

        if (!Array.isArray(apps)) {
            console.error("Hata: Gelen veri dizi değil:", res.data);
            toast.error("Veri formatı hatalı.");
            setLoading(false);
            return;
        }

        // 3. Dizinin içinde bizim ID'yi bul
        const app = apps.find(item => item.id == id || item._id == id);

        if (app) {
          console.log("Başvuru bulundu:", app);
          setFormData({
            company: app.company || "",
            position: app.position || "",
            status: app.status || "Applied",
            dateApplied: app.dateApplied ? app.dateApplied.split("T")[0] : "",
            workType: app.workType || "Remote",
            salaryMin: app.salaryMin || "",
            salaryMax: app.salaryMax || "",
            currency: app.currency || "USD",
            jobLink: app.jobLink || "",
            description: app.description || "",
            notes: app.notes || "",
          });
        } else {
            console.warn("Bu ID ile başvuru bulunamadı:", id);
            toast.error("Başvuru bulunamadı.");
        }

      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Veri yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    if (id && token) fetchApplication();
  }, [id, API_URL, token, userId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/applications/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Başvuru güncellendi! 🚀");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Güncelleme başarısız.");
    }
  };

  if (loading) return <div className="text-white text-center mt-10">Yükleniyor...</div>;

  // Dark Mode Uyumlu Input Stili
  const inputClass = "w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors bg-gray-50 text-gray-900 border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder-gray-400";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Başvuruyu Düzenle</h2>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Şirket</label>
              <input type="text" className={inputClass} value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pozisyon</label>
              <input type="text" className={inputClass} value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tarih</label>
              <input type="date" className={inputClass} value={formData.dateApplied} onChange={(e) => setFormData({...formData, dateApplied: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statü</label>
              <select className={inputClass} value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Çalışma Tipi</label>
              <select className={inputClass} value={formData.workType} onChange={(e) => setFormData({...formData, workType: e.target.value})}>
                <option value="Remote">Remote</option>
                <option value="On-Site">On-Site</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Para Birimi</label>
              <select className={inputClass} value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="TRY">TRY (₺)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Maaş</label>
              <input type="number" className={inputClass} value={formData.salaryMin} onChange={(e) => setFormData({...formData, salaryMin: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Maaş</label>
              <input type="number" className={inputClass} value={formData.salaryMax} onChange={(e) => setFormData({...formData, salaryMax: e.target.value})} />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">İlan Linki</label>
             <input type="url" className={inputClass} value={formData.jobLink} onChange={(e) => setFormData({...formData, jobLink: e.target.value})} />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notlar</label>
             <textarea rows="4" className={inputClass} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}></textarea>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => navigate("/")} className="px-6 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white transition">İptal</button>
            <button type="submit" className="px-6 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-lg">Güncelle</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditApplication;