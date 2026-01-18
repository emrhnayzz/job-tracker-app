import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast"; // <--- Import eklendi

const AddApplication = () => {
  const navigate = useNavigate();

  // Helper to get today's date in 'YYYY-MM-DD' format
  const getTodayString = () => new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    company: "",
    position: "",
    status: "Applied",
    applied_date: getTodayString(),
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

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post("http://localhost:5001/applications", formData);

      // --- SUCCESS TOAST ---
      toast.success("Application added successfully! 🚀");

      navigate("/");
    } catch (err) {
      console.error("Error adding application:", err);
      // --- ERROR TOAST ---
      toast.error("Failed to save application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100 mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Add New Application
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* --- SECTION 1: ESSENTIAL INFO --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              name="company"
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Google"
              value={formData.company}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position *
            </label>
            <input
              type="text"
              name="position"
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Frontend Developer"
              value={formData.position}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* --- SECTION 2: STATUS, DATE & TYPE --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Applied Date
            </label>
            <input
              type="date"
              name="applied_date"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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

        {/* --- SECTION 3: LOCATION & SALARY --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="e.g. Berlin, Germany"
              value={formData.location}
              onChange={handleChange}
            />
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
              placeholder="50000"
              value={formData.salary_min}
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
              placeholder="65000"
              value={formData.salary_max}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* --- SECTION 4: LINKS & NOTES --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Link
          </label>
          <input
            type="url"
            name="link"
            className="w-full p-2 border border-gray-300 rounded-lg"
            placeholder="https://linkedin.com/jobs/..."
            value={formData.link}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Personal Notes / Recruiter Info
          </label>
          <textarea
            name="notes"
            rows="3"
            className="w-full p-2 border border-gray-300 rounded-lg"
            placeholder="Recruiter: Anna. Interview next week..."
            value={formData.notes}
            onChange={handleChange}
          ></textarea>
        </div>

        {/* --- SUBMIT BUTTONS --- */}
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
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-md disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Application"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddApplication;
