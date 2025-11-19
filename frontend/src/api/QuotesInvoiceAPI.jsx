// File: src/api/QuotesInvoiceAPI.jsx

import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';   // Make sure this points to http://localhost:5054

// Optional: You can hardcode for development if needed
// const QUOTE_API_URL = 'http://localhost:5054/api/quote';

const API = {
  // GET: All Quotes (for listing)
  fetchQuotes: async () => {
    const response = await axios.get(`${BASE_URL}/quote`);
    return response.data;
  },

  // GET: Single Quote by ID (for Edit mode)
  fetchQuoteById: async (id) => {
    const response = await axios.get(`${BASE_URL}/quote/${id}`);
    return response.data;
  },

  // POST: Create New Quote
  createQuote: async (quoteData) => {
    // If you're using the current controller (with JSON string fields)
    // We need to stringify the complex parts before sending
    const payload = {
      ...quoteData,

      // Convert objects → JSON strings (required by current backend)
      directRouteJson: quoteData.directRoute ? JSON.stringify(quoteData.directRoute) : null,
      transitRouteJson: quoteData.transitRoute ? JSON.stringify(quoteData.transitRoute) : null,
      multimodalSegmentsJson: quoteData.multimodalSegments ? JSON.stringify(quoteData.multimodalSegments) : null,
      routePlanJson: quoteData.routePlan ? JSON.stringify(quoteData.routePlan) : null,
      freightChargesJson: quoteData.freightCharges?.length > 0 ? JSON.stringify(quoteData.freightCharges) : null,
      additionalChargesJson: quoteData.additionalCharges?.length > 0 ? JSON.stringify(quoteData.additionalCharges) : null,
      customTermsJson: quoteData.customTerms?.length > 0 ? JSON.stringify(quoteData.customTerms) : null,
    };

    const response = await axios.post(`${BASE_URL}/quote`, payload);
    return response.data;
  },

  // PUT: Update Existing Quote
  updateQuote: async (id, quoteData) => {
    const payload = {
      id,
      ...quoteData,

      directRouteJson: quoteData.directRoute ? JSON.stringify(quoteData.directRoute) : null,
      transitRouteJson: quoteData.transitRoute ? JSON.stringify(quoteData.transitRoute) : null,
      multimodalSegmentsJson: quoteData.multimodalSegments ? JSON.stringify(quoteData.multimodalSegments) : null,
      routePlanJson: quoteData.routePlan ? JSON.stringify(quoteData.routePlan) : null,
      freightChargesJson: quoteData.freightCharges?.length > 0 ? JSON.stringify(quoteData.freightCharges) : null,
      additionalChargesJson: quoteData.additionalCharges?.length > 0 ? JSON.stringify(quoteData.additionalCharges) : null,
      customTermsJson: quoteData.customTerms?.length > 0 ? JSON.stringify(quoteData.customTerms) : null,
    };

    const response = await axios.put(`${BASE_URL}/quote/${id}`, payload);
    return response.data;
  },

  // Optional: Delete Quote (if needed later)
  deleteQuote: async (id) => {
    const response = await axios.delete(`${BASE_URL}/quote/${id}`);
    return response.data;
  },
};

export default API;