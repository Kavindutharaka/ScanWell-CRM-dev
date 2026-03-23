import api from '../config/axios';

// const BASE_URL = `/Contact`;
// const BASE_URL = './api/Contact';

export const fetchContacts = async () => {
  const response = await api.get(`/Contact/contact`);
  return response.data;
};

export const fetchContactById = async (id) => {
  const response = await api.get(`/Contact/contact/${id}`);
  return response.data;
};

export const createNewContact = async (contact) => {
  const response = await api.post(`/Contact/contact`, contact);
  return response.data;
};

export const updateContact = async (contact) => {
  const response = await api.put(`/Contact/contact`, contact);
  return response.data;
};

export const deleteContact = async (id) => {
  const response = await api.delete(`/Contact/contact/${id}`);
  return response.data;
};