import api from '../config/axios';

export const fetchRates = async () => {
  try {
    const response = await api.get(`/rates/rates`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch rates');
  }
};

export const createRate = async (rateData) => {
  try {
    const response = await api.post(`/rates/rates`, rateData);
    return response.data;
  } catch (error) {
    throw new Error('Failed to create rate');
  }
};

export const updateRate = async (id, rateData) => {
  try {
    const response = await api.put(`/rates/rates/${id}`, rateData);
    return response.data;
  } catch (error) {
    throw new Error('Failed to update rate');
  }
};

export const deleteRate = async (id) => {
  try {
    const response = await api.delete(`/rates/rates/${id}`);
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
    const response = await api.get(`/rates/sub-categories${params}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch sub-categories');
  }
};

export const createSubCategory = async (data) => {
  try {
    const response = await api.post(`/rates/sub-categories`, data);
    return response.data;
  } catch (error) {
    throw new Error('Failed to create sub-category');
  }
};

export const updateSubCategory = async (id, data) => {
  try {
    const response = await api.put(`/rates/sub-categories/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error('Failed to update sub-category');
  }
};

export const deleteSubCategory = async (id) => {
  try {
    const response = await api.delete(`/rates/sub-categories/${id}`);
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
    const response = await api.get(`/rates/sea-bond`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch sea bond rates');
  }
};

export const bulkUploadSeaBondRates = async (data) => {
  try {
    const response = await api.post(`/rates/sea-bond/bulk`, data);
    return response.data;
  } catch (error) {
    throw new Error('Failed to upload sea bond rates');
  }
};

export const deleteSeaBondRate = async (id) => {
  try {
    const response = await api.delete(`/rates/sea-bond/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to delete sea bond rate');
  }
};

export const deleteAllSeaBondRates = async () => {
  try {
    const response = await api.delete(`/rates/sea-bond/all`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to delete all sea bond rates');
  }
};