import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast"; // <--- Import eklendi

const EditApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    company: "",
    position: "",
    status: "Applied",
    applied_date: "",
    work_type: "Remote",
    location: "",
    salary_min: "",
    salary_max: "",
    currency: "EUR",
    link: "",
    description: "",
    recruiter_name: "",
    recruiter_email: "",
    notes: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `(import.meta.env.VITE_API_URL || "http://localhost:5001")/applications`
        );
        const app = res.data.find((item) => item.id === parseInt(id));

        if (app) {
          if (app.applied_date)
            app.applied_date = app.applied_date.split("T")[0];
          setFormData(app);
        } else {
          toast.error("Application not found"); // Hata durumunda bildirim
          navigate("/");
        }
        setLoading(false);
      } catch (err) {
        console.error("Error loading data", err);
        toast.error("Could not load application data.");
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        (import.meta.env.VITE_API_URL || "http://localhost:5001") +
          `/applications/${app.id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // --- SUCCESS TOAST ---
      toast.success("Application updated successfully! 💾");

      navigate("/");
    } catch (err) {
      console.error("Update error:", err);
      // --- ERROR TOAST ---
      toast.error("Failed to update application.");
    }
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 dark:text-white p-6 rounded-lg w-full max-w-2xl shadow-xl relative">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Edit Application
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              name="company"
              required
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={formData.company}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <input
              type="text"
              name="position"
              required
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={formData.position}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Applied Date
            </label>
            <input
              type="date"
              name="applied_date"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={formData.applied_date}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              className="w-full p-2 border border-gray-300 rounded-lg bg-white"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Type
            </label>
            <select
              name="work_type"
              className="w-full p-2 border border-gray-300 rounded-lg bg-white"
              value={formData.work_type}
              onChange={handleChange}
            >
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              name="currency"
              className="w-full p-2 border border-gray-300 rounded-lg bg-white"
              value={formData.currency}
              onChange={handleChange}
            >
              <option value="EUR">€ (EUR)</option>
              <option value="USD">$ (USD)</option>
              <option value="TRY">₺ (TRY)</option>
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Salary
            </label>
            <input
              type="number"
              name="salary_min"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={formData.salary_min || ""}
              onChange={handleChange}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Salary
            </label>
            <input
              type="number"
              name="salary_max"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={formData.salary_max || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Link
          </label>
          <input
            type="url"
            name="link"
            className="w-full p-2 border border-gray-300 rounded-lg"
            value={formData.link || ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            rows="3"
            className="w-full p-2 border border-gray-300 rounded-lg"
            value={formData.notes || ""}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-md"
          >
            Update Application
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditApplication;
