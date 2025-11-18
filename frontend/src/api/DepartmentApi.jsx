import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';


export const fetchDepartment= async () => {
  const response = await axios.get(`${BASE_URL}/Department`);
  return response.data;
};
export const createNewDepartment = async (dp) => {
    
  const response = await axios.post(`${BASE_URL}/Department`,dp);
  return response.data;
};
export const updateDepartmentName = async (dp) => {
  const response = await axios.put(`${BASE_URL}/Department`,dp);
  return response.data;
};
export const deleteDepartment = async (id) => {
  const response = await axios.delete(`${BASE_URL}/Department/${id}`);
  return response.data;
};