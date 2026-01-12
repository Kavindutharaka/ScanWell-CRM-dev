import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

// API endpoints for Quotes
// Matches your backend: api/quote/quote  →  /api/quote/quote

export const fetchQuotes = async () => {
  const response = await axios.get(`${BASE_URL}/quote/quote`);
  return response.data;
};

export const fetchQuoteById = async (id) => {
  const response = await axios.get(`${BASE_URL}/quote/quote/${id}`);
  return response.data;
};

export const createNewQuote = async (quote) => {
  const response = await axios.post(`${BASE_URL}/quote/quote`, quote);
  return response.data;
};

export const updateQuote = async (quoteData) => {
  try {
    console.log('Payload being sent:', JSON.stringify(quoteData, null, 2));
    
    const response = await axios.put(`${BASE_URL}/quote/quote`, quoteData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating quote:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export const deleteQuote = async (id) => {
  const response = await axios.delete(`${BASE_URL}/quote/quote/${id}`);
  return response.data;
};

// Warehouse Quote API Functions
export const fetchWareQuote = async () => {
  const response = await axios.get(`${BASE_URL}/WarehouseQuotes`);
  return response.data;
};

export const fetchWareQuoteById = async (id) => {
  const response = await axios.get(`${BASE_URL}/WarehouseQuotes/${id}`);
  return response.data;
};

export const createWareQuote = async (quote) => {
  const response = await axios.post(`${BASE_URL}/WarehouseQuotes`, quote);
  return response.data;
};

export const updateWareQuote = async (id, quote) => {
  const response = await axios.put(`${BASE_URL}/WarehouseQuotes/${id}`, quote);
  return response.data;
};

export const deleteWareQuote = async (id) => {
  const response = await axios.delete(`${BASE_URL}/WarehouseQuotes/${id}`);
  return response.data;
};

export const updateWareQuoteStatus = async (id, status) => {
  const response = await axios.put(`${BASE_URL}/WarehouseQuotes/${id}/status`, { status });
  return response.data;
};

// Optional: Export as object (same pattern as your AccountApi)
const QuoteApi = {
  fetchQuotes,
  fetchQuoteById,
  createNewQuote,
  updateQuote,
  deleteQuote,
  fetchWareQuote,
  fetchWareQuoteById,
  createWareQuote,
  updateWareQuote,
  deleteWareQuote,
  updateWareQuoteStatus
};

export default QuoteApi;