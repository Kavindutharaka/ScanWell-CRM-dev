import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 * Redirects to login if user is not authenticated
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem('authToken');

  if (!token) {
    // Redirect to login page, but save the attempted URL
    // so we can redirect back after successful login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Optional: Validate token expiry
  if (!isTokenValid(token)) {
    // Token expired, clear storage and redirect to login
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected component
  return children;
}

/**
 * Check if JWT token is still valid (not expired)
 * @param {string} token - JWT token
 * @returns {boolean} - True if token is valid
 */
function isTokenValid(token) {
  if (!token) return false;

  try {
    // Decode JWT token (format: header.payload.signature)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Check expiry time (exp is in seconds, Date.now() is in milliseconds)
    const expiryTime = payload.exp * 1000;
    const now = Date.now();
    
    return expiryTime > now;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
}
