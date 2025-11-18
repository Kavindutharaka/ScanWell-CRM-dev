import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

export const fetchRates = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/rates/rates`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch rates');
  }
};

export const createRate = async (rateData) => {
  try {
    const response = await axios.post(`${BASE_URL}/rates/rates`, rateData);
    return response.data;
  } catch (error) {
    throw new Error('Failed to create rate');
  }
};

export const updateRate = async (id, rateData) => {
  try {
    const response = await axios.put(`${BASE_URL}/rates/rates/${id}`, rateData);
    return response.data;
  } catch (error) {
    throw new Error('Failed to update rate');
  }
};

export const deleteRate = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/rates/rates/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to delete rate');
  }
};