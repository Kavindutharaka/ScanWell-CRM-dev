import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

export const fetchProjects = async () => {
  const response = await axios.get(`${BASE_URL}/project`);
  return response.data;
};

export const createNewProject = async (project) => {
  const response = await axios.post(`${BASE_URL}/project`, project);
  return response.data;
};

export const updateProject = async (project) => {
  const response = await axios.put(`${BASE_URL}/project`, project);
  return response.data;
};

export const deleteProject = async (id) => {
  const response = await axios.delete(`${BASE_URL}/project/${id}`);
  return response.data;
};