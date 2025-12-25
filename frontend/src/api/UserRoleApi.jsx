// src/api/UserRoleApi.jsx
import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

// All endpoints match your controller routes
// Controller: [Route("api/[controller]")] + [HttpGet("user-roles")] etc.

export const fetchUserRoles = async () => {
  const response = await axios.get(`${BASE_URL}/UserRole/user-roles`);
  return response.data;
};

export const fetchUserDetailsByRoleID = async (id) => {
  const response = await axios.get(`${BASE_URL}/UserRole/employee-details/${id}`);
  return response.data;
};

export const fetchUserRoleById = async (id) => {
  const response = await axios.get(`${BASE_URL}/UserRole/user-roles/${id}`);
  return response.data;
};

export const createUserRole = async (roleData) => {
  const response = await axios.post(`${BASE_URL}/UserRole/user-roles`, roleData);
  return response.data;
};

export const updateUserRole = async (id, roleData) => {
  const response = await axios.put(`${BASE_URL}/UserRole/user-roles/${id}`, roleData);
  return response.data;
};

// Optional: Delete user role (if you add delete endpoint later)
export const deleteUserRole = async (id) => {
  const response = await axios.delete(`${BASE_URL}/UserRole/user-roles/${id}`);
  return response.data;
};

// Named export object (same pattern as AccountApi.jsx)
const UserRoleApi = {
  fetchUserRoles,
  fetchUserRoleById,
  createUserRole,
  updateUserRole,
  deleteUserRole,
  fetchUserDetailsByRoleID
};

export default UserRoleApi;