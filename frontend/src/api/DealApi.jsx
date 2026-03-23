import api from '../config/axios';

// const BASE_URL = 'http://localhost:5054/api/Deal';
// const BASE_URL = './api/Deal';

export const fetchDeals = async () => {
  const response = await api.get(`/Deal/deal`);
  return response.data;
};

export const fetchDealById = async (id) => {
  const response = await api.get(`/Deal/deal/${id}`);
  return response.data;
};

export const createNewDeal = async (deal) => {
  const response = await api.post(`/Deal/deal`, deal);
  return response.data;
};

export const updateDeal = async (deal) => {
  const response = await api.put(`/Deal/deal`, deal);
  return response.data;
};

export const deleteDeal = async (id) => {
  const response = await api.delete(`/Deal/deal/${id}`);
  return response.data;
};