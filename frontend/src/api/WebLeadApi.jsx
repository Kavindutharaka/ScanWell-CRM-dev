import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

export const fetchWebLeads = async () => {
  const response = await axios.get(`${BASE_URL}/WebLead/web-leads`);
  return response.data;
};

export const fetchAllWebLeads = async () => {
  const response = await axios.get(`${BASE_URL}/WebLead/web-leads/all`);
  return response.data;
};

export const updateWebLead = async (webLead) => {
  const response = await axios.put(`${BASE_URL}/WebLead/web-lead`, webLead);
  return response.data;
};

export const deleteWebLead = async (id) => {
  const response = await axios.delete(`${BASE_URL}/WebLead/web-lead/${id}`);
  return response.data;
};
