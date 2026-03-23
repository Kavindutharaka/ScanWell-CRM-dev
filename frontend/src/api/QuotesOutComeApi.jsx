import api from '../config/axios';

export const fetchOutComeById = async (quoteId) => {
  try {
    const response = await api.get(`/QuoteOutcome/${quoteId}`);
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
    const response = await api.post(`/QuoteOutcome`, payload);
    return response.data;
  } catch (error) {
    throw new Error('Failed to save quote outcome');
  }
};

export const updateWonDetails = async (payload) => {
  try {
    const response = await api.put(`/QuoteOutcome/won-details`, payload);
    return response.data;
  } catch (error) {
    throw new Error('Failed to update won details');
  }
};