import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

// const BASE_URL = `${BASE_URL}/Contact`;
// const BASE_URL = './api/Contact';

export const fetchContacts = async () => {
  const response = await axios.get(`${BASE_URL}/Contact/contact`);
  return response.data;
};

export const fetchContactById = async (id) => {
  const response = await axios.get(`${BASE_URL}/Contact/contact/${id}`);
  return response.data;
};

export const createNewContact = async (contact) => {
  const response = await axios.post(`${BASE_URL}/Contact/contact`, contact);
  return response.data;
};

export const updateContact = async (contact) => {
  const response = await axios.put(`${BASE_URL}/Contact/contact`, contact);
  return response.data;
};

export const deleteContact = async (id) => {
  const response = await axios.delete(`${BASE_URL}/Contact/contact/${id}`);
  return response.data;
};