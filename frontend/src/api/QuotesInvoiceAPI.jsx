// src/api/QuotesInvoiceAPI.js
import api from '../config/axios';

const API_URL = `/Quote`; // Matches [Route("api/[controller]")] in QuoteController.cs

// GET: All Quotes
export const fetchQuotes = async () => {
  const response = await api.get(`${API_URL}/quote`);
  return response.data;
};

// GET: Single Quote by SysID
export const fetchQuoteById = async (id) => {
  const response = await api.get(`${API_URL}/quote/${id}`);
  return response.data;
};

// POST: Create New Quote
export const createQuote = async (quoteData) => {
  const response = await api.post(`${API_URL}/quote`, quoteData);
  return response.data;
};

// PUT: Update Existing Quote
export const updateQuote = async (quoteData) => {
  const response = await api.put(`${API_URL}/quote`, quoteData);
  return response.data;
};

// DELETE: Delete Quote by SysID
export const deleteQuote = async (id) => {
  const response = await api.delete(`${API_URL}/quote/${id}`);
  return response.data;
};

// QuotesInvoiceAPI.js — add this at the very bottom
const QuotesInvoiceAPI = {
  fetchQuotes,
  fetchQuoteById,
  createQuote,
  updateQuote,
  deleteQuote
};

export default QuotesInvoiceAPI;
