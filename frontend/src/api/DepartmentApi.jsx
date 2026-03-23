import api from '../config/axios';


export const fetchDepartment= async () => {
  const response = await api.get(`/Department`);
  return response.data;
};
export const createNewDepartment = async (dp) => {
    
  const response = await api.post(`/Department`,dp);
  return response.data;
};
export const updateDepartmentName = async (dp) => {
  const response = await api.put(`/Department`,dp);
  return response.data;
};
export const deleteDepartment = async (id) => {
  const response = await api.delete(`/Department/${id}`);
  return response.data;
};