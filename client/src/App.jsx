import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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

function App() {
  const { theme } = useTheme();

  return (
    <Router>
      {/* 1. Global Toast Configuration (Dark Mode Aware) */}
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
                  {/* Header Section for Dashboard */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                      My Applications
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                      Track and manage your job search process.
                    </p>
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
