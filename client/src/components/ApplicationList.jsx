import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaTrash,
  FaEdit,
  FaExternalLinkAlt,
  FaCalendarAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const ApplicationList = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // 2. Delete Function (NEW)
  const handleDelete = async (id) => {
    // Confirm before deleting (Safety first!)
    if (!window.confirm("Are you sure you want to delete this application?"))
      return;

    try {
      // Send DELETE request to backend
      await axios.delete(`http://localhost:5001/applications/${id}`);

      // Update the list immediately (Optimistic UI update)
      setApplications(applications.filter((app) => app.id !== id));
    } catch (err) {
      console.error("Error deleting application:", err);
      alert("Failed to delete. Check console for details.");
    }
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {applications.map((app) => (
        <div
          key={app.id}
          className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100 flex flex-col justify-between"
        >
          {/* Header Info */}
          <div className="mb-4">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-gray-800">{app.company}</h3>
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

            {/* Date Display (Updated) */}
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
              <Link
                to={`/edit/${app.id}`}
                className="hover:text-blue-600 transition-colors"
              >
                <FaEdit />
              </Link>
              {/* Delete Button with Click Event */}
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

      {applications.length === 0 && (
        <p className="col-span-full text-center text-gray-500">
          No applications found. Start by adding one!
        </p>
      )}
    </div>
  );
};

export default ApplicationList;
