// ResourceApi.jsx
import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

export const fetchResources = async () => {
  const response = await axios.get(`${BASE_URL}/Resource/resource`);
  return response.data;
};

export const fetchResourceById = async (id) => {
  const response = await axios.get(`${BASE_URL}/Resource/resource/${id}`);
  return response.data;
};

export const createNewResource = async (formData) => {
  const response = await axios.post(`${BASE_URL}/Resource/resource`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateResource = async (formData) => {
  const response = await axios.put(`${BASE_URL}/Resource/resource`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteResource = async (id) => {
  const response = await axios.delete(`${BASE_URL}/Resource/resource/${id}`);
  return response.data;
};

const ResourceApi = {
  createNewResource, deleteResource, fetchResourceById, fetchResources, updateResource
};

export default ResourceApi;