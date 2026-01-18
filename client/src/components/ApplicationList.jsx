import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FaTrash,
  FaEdit,
  FaExternalLinkAlt,
  FaCalendarAlt,
  FaSearch,
  FaFilter,
} from "react-icons/fa";
import DashboardStats from "./DashboardStats"; // Import the stats component
import toast from "react-hot-toast";

const ApplicationList = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NEW STATES FOR SEARCH & FILTER ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // 1. Fetch Data
  const fetchApplications = async () => {
    try {
      const res = await axios.get("http://localhost:5001/applications");
      setApplications(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // 2. Delete Function
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?"))
      return;

    try {
      await axios.delete(`http://localhost:5001/applications/${id}`);
      setApplications(applications.filter((app) => app.id !== id));

      toast.success("Application deleted successfully! 🗑️");
    } catch (err) {
      console.error("Error deleting application:", err);
      toast.error("Failed to delete application.");
    }
  };
  // 3. Filter Logic (Search + Dropdown)
  const filteredApplications = applications.filter((app) => {
    // Search by Company or Position (Case insensitive)
    const matchesSearch =
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by Status
    const matchesStatus = statusFilter === "All" || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="p-6">
      {/* --- 1. DASHBOARD STATS --- */}
      {/* We pass the original 'applications' to show total stats, not filtered ones */}
      <DashboardStats applications={applications} />

      {/* --- 2. SEARCH & FILTER BAR --- */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search Input */}
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search company or position..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="relative">
          <FaFilter className="absolute left-3 top-3 text-gray-400" />
          <select
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Applied">Applied</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* --- 3. APPLICATION GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* We map through 'filteredApplications' instead of 'applications' */}
        {filteredApplications.map((app) => (
          <div
            key={app.id}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100 flex flex-col justify-between"
          >
            {/* Header Info */}
            <div className="mb-4">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-gray-800">
                  {app.company}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold 
                  ${
                    app.status === "Applied"
                      ? "bg-blue-100 text-blue-800"
                      : app.status === "Interview"
                      ? "bg-yellow-100 text-yellow-800"
                      : app.status === "Rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {app.status}
                </span>
              </div>
              <p className="text-gray-600 font-medium mt-1">{app.position}</p>

              {/* Date Display */}
              <div className="flex items-center gap-2 text-gray-500 text-sm mt-2">
                <FaCalendarAlt className="text-indigo-400" />
                <span>
                  {app.applied_date
                    ? new Date(app.applied_date).toLocaleDateString("tr-TR")
                    : "No Date"}
                </span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center mt-4 border-t pt-4">
              {app.link ? (
                <a
                  href={app.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm"
                >
                  <FaExternalLinkAlt /> Job Post
                </a>
              ) : (
                <span className="text-gray-300 text-sm">No Link</span>
              )}

              <div className="flex gap-3 text-gray-400">
                {/* Edit Button (Link to Edit Page) */}
                <Link
                  to={`/edit/${app.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  <FaEdit />
                </Link>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(app.id)}
                  className="hover:text-red-500 transition-colors"
                  title="Delete Application"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State for Filter Results */}
        {filteredApplications.length === 0 && (
          <p className="col-span-full text-center text-gray-500 py-10">
            {searchTerm || statusFilter !== "All"
              ? "No applications match your search filters."
              : "No applications found. Start by adding one!"}
          </p>
        )}
      </div>
    </div>
  );
};

export default ApplicationList;
