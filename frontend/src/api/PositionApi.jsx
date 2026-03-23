import api from '../config/axios';

// const BASE_URL = 'http://localhost:5054/api/Position';
// const BASE_URL = './api/Position';

export const fetchPosition= async () => {
  const response = await api.get(`/Position`);
  return response.data;
};
export const createNewPosition = async (pos) => {

  const response = await api.post(`/Position`,pos);
  return response.data;
};
export const updatePositionName = async (pos) => {
  const response = await api.put(`/Position`,pos);
  return response.data;
};
