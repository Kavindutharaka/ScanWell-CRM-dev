import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

export const fetchOutComeById = async (quoteId) => {
  try {
    const response = await axios.get(`${BASE_URL}/QuoteOutcome/${quoteId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // No outcome found
    }
    throw new Error('Failed to fetch outcome');
  }
};

export const saveQuoteOutCome = async (payload) => {
  try {
    const response = await axios.post(`${BASE_URL}/QuoteOutcome`, payload);
    return response.data;
  } catch (error) {
    throw new Error('Failed to save quote outcome');
  }
};