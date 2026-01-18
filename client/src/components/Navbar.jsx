import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaUserCircle,
  FaSignOutAlt,
  FaCog,
  FaUser,
  FaSun,
  FaMoon,
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext"; // Import context

const Navbar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const { theme, toggleTheme } = useTheme();
  const username = localStorage.getItem("username") || "User";

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "/login";
  };

  // Hide Navbar on Login/Register pages
  if (location.pathname === "/login" || location.pathname === "/register")
    return null;

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20 border-b border-gray-100 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-decoration-none group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">
              🚀
            </span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Job Tracker
            </h1>
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center gap-6">
            <Link
              to="/add"
              className="hidden md:block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
            >
              + New Application
            </Link>

            {/* User Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 focus:outline-none hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
              >
                <span className="text-gray-700 dark:text-gray-200 font-medium hidden sm:block">
                  {username}
                </span>
                <FaUserCircle className="text-3xl text-gray-400 dark:text-gray-300" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg py-1 border border-gray-100 dark:border-gray-700 animation-fade-in z-50">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Signed in as
                    </p>
                    <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
                      {username}
                    </p>
                  </div>

                  <a
                    href="#"
                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <FaUser className="text-gray-400" /> Profile
                  </a>

                  <button
                    onClick={toggleTheme}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    {theme === "dark" ? (
                      <FaSun className="text-yellow-400" />
                    ) : (
                      <FaMoon className="text-gray-400" />
                    )}
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </button>

                  <a
                    href="#"
                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <FaCog className="text-gray-400" /> Settings
                  </a>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 mt-1 transition-colors"
                  >
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
