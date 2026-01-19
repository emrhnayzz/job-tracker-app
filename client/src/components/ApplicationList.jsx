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
  FaPaperclip,
  FaThLarge,
  FaColumns,
} from "react-icons/fa"; // Icons added
import toast from "react-hot-toast";
import DashboardStats from "./DashboardStats";
import KanbanBoard from "./KanbanBoard";
import DashboardCharts from "./DashboardCharts";

const ApplicationList = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // --- NEW STATE: VIEW MODE ---
  const [viewMode, setViewMode] = useState("board"); // Default to 'board' because it's cool!

  const fetchApplications = async () => {
    try {
      const userId = localStorage.getItem("userId"); // Get logged-in user ID

      if (!userId) return;

      const res = await axios.get("(import.meta.env.VITE_API_URL || "http://localhost:5001")/applications", {
        params: { userId: userId },
      });

      setApplications(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load applications.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?"))
      return;
    try {
      await axios.delete(`(import.meta.env.VITE_API_URL || "http://localhost:5001")/applications/${id}`);
      setApplications(applications.filter((app) => app.id !== id));
      toast.success("Application deleted successfully! 🗑️");
    } catch (err) {
      toast.error("Failed to delete application.");
    }
  };

  // Filter Logic
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading)
    return (
      <div className="text-center mt-10 text-gray-600 dark:text-gray-300">
        Loading...
      </div>
    );

  return (
    <div className="p-6">
      {/* 1. DASHBOARD STATS */}
      <DashboardStats applications={applications} />
      {/* --- 1.5 CHARTS SECTION  --- */}
      {applications.length > 0 && (
        <DashboardCharts applications={applications} />
      )}

      {/* 2. CONTROLS BAR (Search + Filter + View Toggle) */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 justify-between items-end lg:items-center">
        {/* Search & Filter Group */}
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto flex-1">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <FaFilter className="absolute left-3 top-3 text-gray-400" />
            <select
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-colors"
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

        {/* --- VIEW TOGGLE BUTTONS --- */}
        <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${
              viewMode === "grid"
                ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            <FaThLarge /> Grid
          </button>
          <button
            onClick={() => setViewMode("board")}
            className={`p-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${
              viewMode === "board"
                ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            <FaColumns /> Board
          </button>
        </div>
      </div>

      {/* 3. CONTENT AREA (Conditional Rendering) */}
      {viewMode === "board" ? (
        // --- KANBAN VIEW ---
        // We pass setApplications so the board can update the state on drag-drop
        <KanbanBoard
          applications={filteredApplications}
          setApplications={setApplications}
        />
      ) : (
        // --- GRID VIEW (Original) ---
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-100 dark:border-gray-700 flex flex-col justify-between"
            >
              <div className="mb-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    {app.company}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold 
                    ${
                      app.status === "Applied"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : app.status === "Interview"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : app.status === "Rejected"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-medium mt-1">
                  {app.position}
                </p>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mt-2">
                  <FaCalendarAlt className="text-indigo-400" />
                  <span>
                    {app.applied_date
                      ? new Date(app.applied_date).toLocaleDateString("tr-TR")
                      : "No Date"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                <div className="flex gap-3">
                  {app.link && (
                    <a
                      href={app.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 text-sm"
                    >
                      <FaExternalLinkAlt />{" "}
                      <span className="hidden sm:inline">Job</span>
                    </a>
                  )}
                  {app.cv_path && (
                    <a
                      href={`(import.meta.env.VITE_API_URL || "http://localhost:5001")/${app.cv_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 flex items-center gap-1 text-sm"
                    >
                      <FaPaperclip />{" "}
                      <span className="hidden sm:inline">CV</span>
                    </a>
                  )}
                </div>
                <div className="flex gap-3 text-gray-400 dark:text-gray-500">
                  <Link
                    to={`/edit/${app.id}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <FaEdit />
                  </Link>
                  <button
                    onClick={() => handleDelete(app.id)}
                    className="hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredApplications.length === 0 && (
            <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">
              No applications found.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ApplicationList;
