import { Navigate } from 'react-router-dom';

// Wrapper component to protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  // If no token, redirect to Login page immediately
  if (!token) {
    return <Navigate to="/login" replace />; 
  }

  // If token exists, render the protected content (children)
  return children;
};

export default ProtectedRoute;