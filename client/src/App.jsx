import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ApplicationList from "./components/ApplicationList";
import AddApplication from "./components/AddApplication";
import EditApplication from "./components/EditApplication";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        
        {/* --- GLOBAL NAVIGATION --- */}
        {/* This nav stays visible on all pages */}
        <nav className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              {/* Logo -> Clicks to Home */}
              <Link to="/" className="flex items-center gap-2 text-decoration-none">
                <span className="text-2xl">🚀</span>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight cursor-pointer">
                  Job Tracker
                </h1>
              </Link>

              {/* Add Button -> Clicks to Add Page */}
              <Link 
                to="/add" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                + New Application
              </Link>
            </div>
          </div>
        </nav>

        {/* --- PAGE CONTENT --- */}
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <Routes>
            {/* Home Route: Show the list */}
            <Route path="/" element={
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">My Applications</h2>
                  <p className="text-gray-500">Track and manage your job search process.</p>
                </div>
                <ApplicationList />
              </>
            } />

            {/* Add Route: Show the form */}
            <Route path="/add" element={<AddApplication />} />
            <Route path="/edit/:id" element={<EditApplication />} />
          </Routes>
        </main>

      </div>
    </Router>
  );
}

export default App;