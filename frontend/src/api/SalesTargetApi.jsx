import api from '../config/axios';

// Financial Year Config
export const fetchTargetConfig = async () => {
  const response = await api.get('/SalesTarget/config');
  return response.data;
};

export const updateTargetConfig = async (data) => {
  const response = await api.put('/SalesTarget/config', data);
  return response.data;
};

// Employee Sales Targets
export const fetchAllTargets = async (year) => {
  const response = await api.get(`/SalesTarget/targets?year=${year}`);
  return response.data;
};

export const fetchEmployeeTarget = async (employeeId, year) => {
  const response = await api.get(`/SalesTarget/targets/${employeeId}?year=${year}`);
  return response.data;
};

export const saveEmployeeTarget = async (data) => {
  const response = await api.post('/SalesTarget/targets', data);
  return response.data;
};

export const deleteEmployeeTarget = async (id) => {
  const response = await api.delete(`/SalesTarget/targets/${id}`);
  return response.data;
};
