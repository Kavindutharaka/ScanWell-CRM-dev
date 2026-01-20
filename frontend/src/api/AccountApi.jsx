import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

// const BASE_URL = 'http://localhost:5054/api/Account';
// const BASE_URL = './api/Account';

export const fetchAccounts = async () => {
  const response = await axios.get(`${BASE_URL}/Account/account`);
  return response.data;
};

export const fetchAccountById = async (id) => {
  const response = await axios.get(`${BASE_URL}/Account/account/${id}`);
  return response.data;
};

export const fetchAccountAddress = async (accountName) => {
  const response = await axios.post(`${BASE_URL}/Account/account-address`, { accountName: accountName });
  return response.data;
};

export const fetchAccountContacts = async (accountName) => {
  try {
    const response = await axios.post(`${BASE_URL}/Account/account-contacts`, { accountName: accountName });
    // Axios automatically parses JSON, so response.data is already an array
    return response.data || [];
  } catch (error) {
    console.error('Error fetching account contacts:', error);
    return [];
  }
};

export const createNewAccount = async (account) => {
  const response = await axios.post(`${BASE_URL}/Account/account`, account);
  return response.data;
};

export const updateAccount = async (account) => {
  const response = await axios.put(`${BASE_URL}/Account/account`, account);
  return response.data;
};

export const deleteAccount = async (id) => {
  const response = await axios.delete(`${BASE_URL}/Account/account/${id}`);
  return response.data;
};

export const fetchAccountNames = async () => {
  const response = await axios.get(`${BASE_URL}/Account/account-names`);
  return response.data;
};

const AccountApi = {
  createNewAccount, deleteAccount, fetchAccountById, fetchAccounts, updateAccount, fetchAccountNames, fetchAccountContacts, fetchAccountAddress
};

export default AccountApi;