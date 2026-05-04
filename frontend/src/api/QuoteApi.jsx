import api from '../config/axios';

// API endpoints for Quotes
// Matches your backend: api/quote/quote  →  /api/quote/quote

export const fetchQuotes = async () => {
  const response = await api.get(`/quote/quote`);
  return response.data;
};

export const fetchQuoteCounts = async () => {
  const response = await api.get(`/quote/quote/counts`);
  return response.data;
};

export const fetchQuotesPaged = async (page = 1, pageSize = 10, search = '', category = 'all', type = 'all', filters = {}) => {
  const params = new URLSearchParams({ page, pageSize, search, category, type });
  // Append additional filters (status, etc.)
  Object.entries(filters).forEach(([key, value]) => {
    if (value && key !== 'category' && key !== 'type') {
      params.append(key, value);
    }
  });
  const response = await api.get(`/quote/quote/paged?${params.toString()}`);
  return response.data;
};

export const fetchQuoteById = async (id) => {
  const response = await api.get(`/quote/quote/${id}`);
  return response.data;
};

export const createNewQuote = async (quote) => {
  const response = await api.post(`/quote/quote`, quote);
  return response.data;
};

export const updateQuote = async (quoteData) => {
  try {
    console.log('Payload being sent:', JSON.stringify(quoteData, null, 2));

    const response = await api.put(`/quote/quote`, quoteData, {
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
  const response = await api.delete(`/quote/quote/${id}`);
  return response.data;
};

export const updateQuoteStatus = async (id, status) => {
  const response = await api.put(`/quote/quote/${id}/status`, { status });
  return response.data;
};

// Warehouse Quote API Functions
export const fetchWareQuote = async () => {
  const response = await api.get(`/WarehouseQuotes`);
  return response.data;
};

export const fetchWareQuoteById = async (id) => {
  const response = await api.get(`/WarehouseQuotes/${id}`);
  return response.data;
};

export const createWareQuote = async (quote) => {
  const response = await api.post(`/WarehouseQuotes`, quote);
  return response.data;
};

export const updateWareQuote = async (id, quote) => {
  const response = await api.put(`/WarehouseQuotes/${id}`, quote);
  return response.data;
};

export const deleteWareQuote = async (id) => {
  const response = await api.delete(`/WarehouseQuotes/${id}`);
  return response.data;
};

export const updateWareQuoteStatus = async (id, status) => {
  const response = await api.put(`/WarehouseQuotes/${id}/status`, { status });
  return response.data;
};

export const getSp = async (name) => {
  // URL-encode the customer name. Without this, names with spaces, ampersands,
  // hashes, etc. silently break the request (which is why salesperson sometimes
  // shows and sometimes doesn't on the quote list).
  if (!name) return [];
  const encoded = encodeURIComponent(name);
  const response = await api.get(`/quote/quote/sale-person?name=${encoded}`);
  return response.data;
};

// Optional: Export as object (same pattern as your AccountApi)
const QuoteApi = {
  fetchQuotes,
  fetchQuoteCounts,
  fetchQuotesPaged,
  fetchQuoteById,
  createNewQuote,
  updateQuote,
  deleteQuote,
  updateQuoteStatus,
  fetchWareQuote,
  fetchWareQuoteById,
  createWareQuote,
  updateWareQuote,
  deleteWareQuote,
  updateWareQuoteStatus,
  getSp
};

export default QuoteApi;
