import api from '../config/axios';

// Fetch all won quotes (for invoice module)
// Pass createdBy (employeeId) to restrict to a specific user's quotes; omit for all.
export const fetchWonQuotes = async (createdBy = '') => {
  try {
    const params = createdBy ? `?createdBy=${encodeURIComponent(createdBy)}` : '';
    const response = await api.get(`/Invoice/won-quotes${params}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch won quotes');
  }
};

// Fetch invoice entries for a specific quote
export const fetchInvoiceEntries = async (quoteId) => {
  try {
    const response = await api.get(`/Invoice/entries/${quoteId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw new Error('Failed to fetch invoice entries');
  }
};

// Create invoice entries for a quote
export const createInvoiceEntries = async (quoteId, entries) => {
  try {
    const response = await api.post(`/Invoice/entries`, { quoteId, entries });
    return response.data;
  } catch (error) {
    throw new Error('Failed to save invoice entries');
  }
};

// Delete an invoice entry
export const deleteInvoiceEntry = async (entryId) => {
  try {
    const response = await api.delete(`/Invoice/entries/${entryId}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to delete invoice entry');
  }
};

// Complete/freeze an invoice (admin only)
export const completeInvoice = async (quoteId) => {
  try {
    const response = await api.put(`/Invoice/complete/${quoteId}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to complete invoice');
  }
};
