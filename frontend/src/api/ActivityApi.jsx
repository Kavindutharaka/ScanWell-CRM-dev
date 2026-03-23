import api from '../config/axios';

export const fetchActivities = async (page = 1, pageSize = 25, search = '', filters = {}) => {
  const params = { page, pageSize };
  if (search.trim()) params.search = search.trim();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params[key] = value;
  });
  const response = await api.get(`/Activity`, { params });
  return response.data;
};

export const createNewActivity = async (activity) => {
  const response = await api.post(`/Activity`, activity);
  return response.data;
};

export const updateActivity = async (activity) => {
  const response = await api.put(`/Activity`, activity);
  return response.data;
};

export const deleteActivity = async (id) => {
  const response = await api.delete(`/Activity/${id}`);
  return response.data;
};

export const saveNotes = async (statuslog) => {
  const response = await api.post(`/Statuslog`,statuslog);
  return response.data;
};

export const fetchActivityHistory = async (id) => {
  const response = await api.get(`/Statuslog/${id}`);
  return response.data;
};

export const fetchFullName = async(id) =>{
    const response = await api.get(`/owner/${id}`);
    return response.data;
};

export const fetchbyEmpId = async(id, page = 1, pageSize = 25, search = '', filters = {}) =>{
    const params = { page, pageSize };
    if (search.trim()) params.search = search.trim();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    const response = await api.get(`/Activity/${id}`, { params });
    return response.data;
};

