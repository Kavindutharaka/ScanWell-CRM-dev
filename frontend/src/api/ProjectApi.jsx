import api from '../config/axios';

export const fetchProjects = async () => {
  const response = await api.get(`/project`);
  return response.data;
};

export const createNewProject = async (project) => {
  const response = await api.post(`/project`, project);
  return response.data;
};

export const updateProject = async (project) => {
  const response = await api.put(`/project`, project);
  return response.data;
};

export const deleteProject = async (id) => {
  const response = await api.delete(`/project/${id}`);
  return response.data;
};
