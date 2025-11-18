import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

// const BASE_URL = 'http://localhost:5054/api/Position';
// const BASE_URL = './api/Position';

export const fetchPosition= async () => {
  const response = await axios.get(`${BASE_URL}/Position`);
  return response.data;
};
export const createNewPosition = async (pos) => {
    
  const response = await axios.post(`${BASE_URL}/Position`,pos);
  return response.data;
};
export const updatePositionName = async (pos) => {
  const response = await axios.put(`${BASE_URL}/Position`,pos);
  return response.data;
};