// ResourceApi.jsx
import api from '../config/axios';

export const fetchResources = async () => {
  const response = await api.get(`/Resource/resource`);
  return response.data;
};

export const fetchResourceById = async (id) => {
  const response = await api.get(`/Resource/resource/${id}`);
  return response.data;
};

export const createNewResource = async (formData) => {
  const response = await api.post(`/Resource/resource`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateResource = async (formData) => {
  const response = await api.put(`/Resource/resource`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteResource = async (id) => {
  const response = await api.delete(`/Resource/resource/${id}`);
  return response.data;
};

const ResourceApi = {
  createNewResource, deleteResource, fetchResourceById, fetchResources, updateResource
};

export default ResourceApi;