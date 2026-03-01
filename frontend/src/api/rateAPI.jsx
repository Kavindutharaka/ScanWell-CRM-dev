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

// ============================================================================
// SUB-CATEGORIES (Dynamic Liner/Destination Headers)
// ============================================================================

export const fetchSubCategories = async (type) => {
  try {
    const params = type ? `?type=${type}` : '';
    const response = await axios.get(`${BASE_URL}/rates/sub-categories${params}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch sub-categories');
  }
};

export const createSubCategory = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/rates/sub-categories`, data);
    return response.data;
  } catch (error) {
    throw new Error('Failed to create sub-category');
  }
};

export const updateSubCategory = async (id, data) => {
  try {
    const response = await axios.put(`${BASE_URL}/rates/sub-categories/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error('Failed to update sub-category');
  }
};

export const deleteSubCategory = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/rates/sub-categories/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to delete sub-category');
  }
};

// ============================================================================
// SEA BOND RATES
// ============================================================================

export const fetchSeaBondRates = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/rates/sea-bond`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch sea bond rates');
  }
};

export const bulkUploadSeaBondRates = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/rates/sea-bond/bulk`, data);
    return response.data;
  } catch (error) {
    throw new Error('Failed to upload sea bond rates');
  }
};

export const deleteSeaBondRate = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/rates/sea-bond/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to delete sea bond rate');
  }
};

export const deleteAllSeaBondRates = async () => {
  try {
    const response = await axios.delete(`${BASE_URL}/rates/sea-bond/all`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to delete all sea bond rates');
  }
};