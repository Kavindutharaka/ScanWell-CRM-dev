import api from '../config/axios';

// const BASE_URL = 'http://localhost:5054/api/Account';
// const BASE_URL = './api/Account';

export const fetchAccounts = async (page = 1, pageSize = 25, search = '', filters = {}) => {
  const params = { page, pageSize };
  if (search.trim()) params.search = search.trim();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params[key] = value;
  });
  const response = await api.get(`/Account/account`, { params });
  return response.data;
};

export const fetchAccountFilterOptions = async () => {
  const response = await api.get(`/Account/account/filter-options`);
  return response.data;
};

export const fetchAccountById = async (id) => {
  const response = await api.get(`/Account/account/${id}`);
  return response.data;
};

export const fetchAccountAddress = async (accountName) => {
  const response = await api.post(`/Account/account-address`, { accountName: accountName });
  return response.data;
};

export const fetchAccountContacts = async (accountName) => {
  try {
    const response = await api.post(`/Account/account-contacts`, { accountName: accountName });
    // Axios automatically parses JSON, so response.data is already an array
    return response.data || [];
  } catch (error) {
    console.error('Error fetching account contacts:', error);
    return [];
  }
};

export const createNewAccount = async (account) => {
  const response = await api.post(`/Account/account`, account);
  return response.data;
};

export const updateAccount = async (account) => {
  const response = await api.put(`/Account/account`, account);
  return response.data;
};

export const deleteAccount = async (id) => {
  const response = await api.delete(`/Account/account/${id}`);
  return response.data;
};

export const fetchAccountNames = async () => {
  const response = await api.get(`/Account/account-names`);
  return response.data;
};

const AccountApi = {
  createNewAccount, deleteAccount, fetchAccountById, fetchAccounts, updateAccount, fetchAccountNames, fetchAccountContacts, fetchAccountAddress
};

export default AccountApi;