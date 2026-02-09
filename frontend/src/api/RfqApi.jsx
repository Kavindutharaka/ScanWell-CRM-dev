import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

export const fetchRfq = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/rfq`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch rfqs');
  }
};

export const createRfq = async (rfq) => {
  try {
    const response = await axios.post(`${BASE_URL}/rfq`, rfq);
    return response.data;
  } catch (error) {
    throw new Error('Failed to create rfq');
  }
};

export const updateRfq = async (id, rfq) => {
  try {
    const response = await axios.put(`${BASE_URL}/rfq/${id}`, rfq);
    return response.data;
  } catch (error) {
    throw new Error('Failed to update rfq');
  }
};

export const deleteRfq = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/rfq/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to delete rfq');
  }
};

export const fetchSalesEntries = async (rfqId) => {
  try {
    const response = await axios.get(`${BASE_URL}/rfq/${rfqId}/sales-entries`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch sales entries');
  }
};

export const createSalesEntries = async (rfqId, entries) => {
  try {
    const response = await axios.post(`${BASE_URL}/rfq/${rfqId}/sales-entries`, entries);
    return response.data;
  } catch (error) {
    throw new Error('Failed to create sales entries');
  }
};

export const deleteSalesEntry = async (entryId) => {
  try {
    const response = await axios.delete(`${BASE_URL}/rfq/sales-entry/${entryId}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to delete sales entry');
  }
};
