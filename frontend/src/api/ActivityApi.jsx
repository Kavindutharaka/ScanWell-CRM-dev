import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

export const fetchActivities = async (page = 1, pageSize = 25, search = '', filters = {}) => {
  const params = { page, pageSize };
  if (search.trim()) params.search = search.trim();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params[key] = value;
  });
  const response = await axios.get(`${BASE_URL}/Activity`, { params });
  return response.data;
};

export const createNewActivity = async (activity) => {
  const response = await axios.post(`${BASE_URL}/Activity`, activity);
  return response.data;
};

export const updateActivity = async (activity) => {
  const response = await axios.put(`${BASE_URL}/Activity`, activity);
  return response.data;
};

export const deleteActivity = async (id) => {
  const response = await axios.delete(`${BASE_URL}/Activity/${id}`);
  return response.data;
};

export const saveNotes = async (statuslog) => {
  const response = await axios.post(`${BASE_URL}/Statuslog`,statuslog);
  return response.data;
};

export const fetchActivityHistory = async (id) => {
  const response = await axios.get(`${BASE_URL}/Statuslog/${id}`);
  return response.data;
};

export const fetchFullName = async(id) =>{
    const response = await axios.get(`${BASE_URL}/owner/${id}`);
    return response.data;
};

export const fetchbyEmpId = async(id, page = 1, pageSize = 25, search = '', filters = {}) =>{
    const params = { page, pageSize };
    if (search.trim()) params.search = search.trim();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    const response = await axios.get(`${BASE_URL}/Activity/${id}`, { params });
    return response.data;
};

