import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useTheme } from "./context/ThemeContext";

// --- COMPONENTS IMPORTS ---
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// --- PAGES IMPORTS ---
import ApplicationList from "./components/ApplicationList";
import AddApplication from "./components/AddApplication";
import EditApplication from "./components/EditApplication";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

function App() {
  const { theme } = useTheme();

  return (
    <Router>
      {/* 1. Global Toast Config */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: theme === "dark" ? "#333" : "#fff",
            color: theme === "dark" ? "#fff" : "#333",
          },
        }}
      />

      {/* 2. Global Layout Wrapper */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Navigation Bar */}
        <Navbar />

        {/* 3. Main Content Area */}
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <Routes>
            {/* --- PUBLIC ROUTES --- */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* --- PROTECTED ROUTES --- */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  {/* Header Section with New App Button */}
                  <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        My Applications
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1 text-lg">
                        Track and manage your job search process.
                      </p>
                    </div>

                    <Link
                      to="/add"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-base font-semibold transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center gap-2 whitespace-nowrap"
                    >
                      <span className="text-xl">+</span> New Application
                    </Link>
                  </div>

                  <ApplicationList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/add"
              element={
                <ProtectedRoute>
                  <AddApplication />
                </ProtectedRoute>
              }
            />

            <Route
              path="/edit/:id"
              element={
                <ProtectedRoute>
                  <EditApplication />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
