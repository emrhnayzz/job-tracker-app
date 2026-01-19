import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaMagic } from "react-icons/fa";

const AddApplication = () => {
  const navigate = useNavigate();

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

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // --- AI GENERATION FUNCTION ---
  const handleGenerateAI = async () => {
    if (!formData.company || !formData.position) {
      toast.error("Please enter Company and Position first!");
      return;
    }

    setAiLoading(true);
    try {
      const userName = localStorage.getItem("username");

      const res = await axios.post(
        (import.meta.env.VITE_API_URL || "http://localhost:5001") +
          "/ai/generate",
        {
          company: formData.company,
          position: formData.position,
          description: formData.description,
          userName: userName,
        }
      );

      const letter = res.data.letter;

      // Append generated letter to notes
      setFormData((prev) => ({
        ...prev,
        notes: prev.notes
          ? prev.notes + "\n\n--- AI COVER LETTER ---\n" + letter
          : "--- AI COVER LETTER ---\n" + letter,
      }));

      toast.success("Cover Letter Generated! 🪄");
    } catch (err) {
      console.error(err);
      toast.error("AI Generation failed. Check server logs.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const userId = localStorage.getItem("userId");
    const data = new FormData();

    // Append all fields to FormData
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    if (file) data.append("cv", file);
    if (userId) data.append("user_id", userId);

    try {
      await axios.post(
        (import.meta.env.VITE_API_URL || "http://localhost:5001") +
          "/applications",
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      toast.success("Application added successfully! 🚀");
      navigate("/");
    } catch (err) {
      console.error("Error adding application:", err);
      toast.error("Failed to save application.");
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const labelClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const inputClass =
    "w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors";

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 mt-10 transition-colors duration-300">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Add New Application
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ROW 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Company Name *</label>
            <input
              type="text"
              name="company"
              required
              className={inputClass}
              placeholder="e.g. Google"
              value={formData.company}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelClass}>Position *</label>
            <input
              type="text"
              name="position"
              required
              className={inputClass}
              placeholder="e.g. Frontend Developer"
              value={formData.position}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className={labelClass}>Applied Date</label>
            <input
              type="date"
              name="applied_date"
              className={inputClass}
              value={formData.applied_date}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select
              name="status"
              className={inputClass}
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
            <label className={labelClass}>Work Type</label>
            <select
              name="work_type"
              className={inputClass}
              value={formData.work_type}
              onChange={handleChange}
            >
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>
        </div>

        {/* ROW 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Location</label>
            <input
              type="text"
              name="location"
              className={inputClass}
              placeholder="e.g. Berlin, Germany"
              value={formData.location}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelClass}>Upload CV / File (PDF)</label>
            <input
              type="file"
              name="cv"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-300"
            />
          </div>
        </div>

        {/* SALARY INFO */}
        <div className="grid grid-cols-3 gap-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <div className="col-span-1">
            <label className={labelClass}>Currency</label>
            <select
              name="currency"
              className={inputClass}
              value={formData.currency}
              onChange={handleChange}
            >
              <option value="EUR">€ (EUR)</option>
              <option value="USD">$ (USD)</option>
              <option value="TRY">₺ (TRY)</option>
            </select>
          </div>
          <div className="col-span-1">
            <label className={labelClass}>Min Salary</label>
            <input
              type="number"
              name="salary_min"
              className={inputClass}
              placeholder="50000"
              value={formData.salary_min}
              onChange={handleChange}
            />
          </div>
          <div className="col-span-1">
            <label className={labelClass}>Max Salary</label>
            <input
              type="number"
              name="salary_max"
              className={inputClass}
              placeholder="65000"
              value={formData.salary_max}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Job Link</label>
          <input
            type="url"
            name="link"
            className={inputClass}
            placeholder="https://linkedin.com/jobs/..."
            value={formData.link}
            onChange={handleChange}
          />
        </div>

        {/* --- AI SECTION START --- */}
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-bold text-indigo-900 dark:text-indigo-300">
              Job Description (Optional)
            </label>
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={aiLoading}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              <FaMagic className={aiLoading ? "animate-spin" : ""} />
              {aiLoading ? "Writing..." : "Generate Cover Letter with AI"}
            </button>
          </div>
          <textarea
            name="description"
            rows="3"
            className={`${inputClass} text-sm`}
            placeholder="Paste the job description here, and click the magic button!"
            value={formData.description}
            onChange={handleChange}
          ></textarea>
        </div>
        {/* --- AI SECTION END --- */}

        <div>
          <label className={labelClass}>Personal Notes / Cover Letter</label>
          <textarea
            name="notes"
            rows="6"
            className={inputClass}
            placeholder="Notes will appear here..."
            value={formData.notes}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
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
