import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

// Fetch all won quotes (for invoice module)
export const fetchWonQuotes = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/Invoice/won-quotes`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch won quotes');
  }
};

// Fetch invoice entries for a specific quote
export const fetchInvoiceEntries = async (quoteId) => {
  try {
    const response = await axios.get(`${BASE_URL}/Invoice/entries/${quoteId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw new Error('Failed to fetch invoice entries');
  }
};

// Create invoice entries for a quote
export const createInvoiceEntries = async (quoteId, entries) => {
  try {
    const response = await axios.post(`${BASE_URL}/Invoice/entries`, { quoteId, entries });
    return response.data;
  } catch (error) {
    throw new Error('Failed to save invoice entries');
  }
};

// Delete an invoice entry
export const deleteInvoiceEntry = async (entryId) => {
  try {
    const response = await axios.delete(`${BASE_URL}/Invoice/entries/${entryId}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to delete invoice entry');
  }
};

// Complete/freeze an invoice (admin only)
export const completeInvoice = async (quoteId) => {
  try {
    const response = await axios.put(`${BASE_URL}/Invoice/complete/${quoteId}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to complete invoice');
  }
};
