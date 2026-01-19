import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FaGoogle, FaApple, FaLinkedin, FaRocket } from "react-icons/fa";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        (import.meta.env.VITE_API_URL || "http://localhost:5001") +
          "/auth/register",
        formData
      );
      toast.success("Account created successfully! 🎉 Please login.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  const handleSocialRegister = () => {
    toast("Social Registration requires API Keys (Next Step)", { icon: "🚧" });
  };

  return (
    // MAIN CONTAINER: Added dark background and transition
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300">
      {/* --- TOP LEFT LOGO --- */}
      <div className="p-6 absolute top-0 left-0">
        <Link
          to="/"
          className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-decoration-none"
        >
          <FaRocket className="text-3xl" />
          <span className="text-2xl font-bold tracking-tight">Job Tracker</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {/* CARD CONTAINER: Added dark bg, border and text colors */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-700 transition-colors duration-300">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create Account
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Start tracking your job applications today.
            </p>
          </div>

          {/* --- SOCIAL BUTTONS --- */}
          <div className="flex gap-4 justify-center mb-6">
            <button
              onClick={handleSocialRegister}
              className="flex-1 flex justify-center items-center py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <FaGoogle className="text-red-500 text-xl" />
            </button>
            <button
              onClick={handleSocialRegister}
              className="flex-1 flex justify-center items-center py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <FaApple className="text-gray-900 dark:text-white text-xl" />
            </button>
            <button
              onClick={handleSocialRegister}
              className="flex-1 flex justify-center items-center py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <FaLinkedin className="text-blue-600 text-xl" />
            </button>
          </div>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          </div>

          {/* --- REGISTER FORM --- */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                placeholder="johndoe"
                // INPUT STYLES: Dark bg, light text, dark border
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="john@example.com"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Create a strong password"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg hover:shadow-indigo-500/30"
            >
              Sign Up
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
