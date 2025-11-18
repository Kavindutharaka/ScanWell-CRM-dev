import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

// const BASE_URL = 'http://localhost:5054/api/Deal';
// const BASE_URL = './api/Deal';

export const fetchDeals = async () => {
  const response = await axios.get(`${BASE_URL}/Deal/deal`);
  return response.data;
};

export const fetchDealById = async (id) => {
  const response = await axios.get(`${BASE_URL}/Deal/deal/${id}`);
  return response.data;
};

export const createNewDeal = async (deal) => {
  const response = await axios.post(`${BASE_URL}/Deal/deal`, deal);
  return response.data;
};

export const updateDeal = async (deal) => {
  const response = await axios.put(`${BASE_URL}/Deal/deal`, deal);
  return response.data;
};

export const deleteDeal = async (id) => {
  const response = await axios.delete(`${BASE_URL}/Deal/deal/${id}`);
  return response.data;
};