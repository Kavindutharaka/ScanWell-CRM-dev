// src/api/UserRoleApi.jsx
import api from '../config/axios';

// All endpoints match your controller routes
// Controller: [Route("api/[controller]")] + [HttpGet("user-roles")] etc.

export const fetchUserRoles = async () => {
  const response = await api.get(`/UserRole/user-roles`);
  return response.data;
};

export const fetchUserDetailsByRoleID = async (id) => {
  const response = await api.get(`/UserRole/employee-details/${id}`);
  return response.data;
};

export const fetchUserRoleById = async (id) => {
  const response = await api.get(`/UserRole/user-roles/${id}`);
  return response.data;
};

export const createUserRole = async (roleData) => {
  const response = await api.post(`/UserRole/user-roles`, roleData);
  return response.data;
};

export const updateUserRole = async (id, roleData) => {
  const response = await api.put(`/UserRole/user-roles/${id}`, roleData);
  return response.data;
};

// Optional: Delete user role (if you add delete endpoint later)
export const deleteUserRole = async (id) => {
  const response = await api.delete(`/UserRole/user-roles/${id}`);
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