import axios from "axios";
import { BASE_URL } from "./apiConfig";

// Set withCredentials globally so ALL axios calls (including raw axios usage
// in API files) send the authToken cookie to the backend
axios.defaults.withCredentials = true;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Global response interceptor - sanitize HTML/JS error responses
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      error.friendlyMessage = "Unable to connect to server. Please check if the server is running.";
      return Promise.reject(error);
    }

    if (error.response) {
      const { status, data } = error.response;

      // Auto-redirect to login on 401 (token expired or missing)
      if (status === 401 && !window.location.pathname.includes('/login')) {
        window.location.href = "/login";
        return Promise.reject(error);
      }

      // Detect HTML error pages (IIS, .NET stack traces, etc.)
      const isHtml = typeof data === 'string' && (
        data.trim().startsWith('<!') ||
        data.trim().startsWith('<html') ||
        data.includes('<script') ||
        data.includes('<!DOCTYPE')
      );

      if (isHtml) {
        // Replace raw HTML with a clean error object
        const friendlyMessages = {
          400: "Bad request. Please check your input.",
          401: "Session expired. Please log in again.",
          403: "You don't have permission to perform this action.",
          404: "The requested resource was not found.",
          500: "Server error occurred. Please try again later.",
          502: "Server is temporarily unavailable. Please try again.",
          503: "Service is under maintenance. Please try again later.",
        };

        error.response.data = {
          message: friendlyMessages[status] || "Something went wrong. Please try again later."
        };
        error.friendlyMessage = error.response.data.message;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;