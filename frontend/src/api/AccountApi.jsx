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
  createNewAccount, deleteAccount, fetchAccountById, fetchAccounts, updateAccount, fetchAccountNames
};

export default AccountApi;