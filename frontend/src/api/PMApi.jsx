import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

// const BASE_URL = 'http://localhost:5054/api/Employee';
// const BASE_URL = './api/Employee';

export const fetchEmployees= async () => {
  const response = await axios.get(`${BASE_URL}/Employee/emp`);
  return response.data;
};
export const createEmployee = async (emp) => {
    
  const response = await axios.post(`${BASE_URL}/Employee/emp`,emp);
  return response.data;
};
export const updateEmployee = async (emp) => {
    console.log("oooo",emp);
  const response = await axios.put(`${BASE_URL}/Employee/emp`,emp);
  return response.data;
};