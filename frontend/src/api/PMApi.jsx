import api from '../config/axios';

// const BASE_URL = 'http://localhost:5054/api/Employee';
// const BASE_URL = './api/Employee';

export const fetchEmployees= async () => {
  const response = await api.get(`/Employee/emp`);
  return response.data;
};
export const createEmployee = async (emp) => {

  const response = await api.post(`/Employee/emp`,emp);
  return response.data;
};
export const updateEmployee = async (emp) => {
    console.log("oooo",emp);
  const response = await api.put(`/Employee/emp`,emp);
  return response.data;
};
