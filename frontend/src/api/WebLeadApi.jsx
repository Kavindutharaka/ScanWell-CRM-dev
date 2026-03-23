import api from '../config/axios';

export const fetchWebLeads = async () => {
  const response = await api.get(`/WebLead/web-leads`);
  return response.data;
};

export const fetchAllWebLeads = async () => {
  const response = await api.get(`/WebLead/web-leads/all`);
  return response.data;
};

export const updateWebLead = async (webLead) => {
  const response = await api.put(`/WebLead/web-lead`, webLead);
  return response.data;
};

export const deleteWebLead = async (id) => {
  const response = await api.delete(`/WebLead/web-lead/${id}`);
  return response.data;
};
