import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

export const fetchLeads = async () => {
  const response = await axios.get(`${BASE_URL}/Lead`);
  return response.data;
};

export const updateLead = async (id, leadData) => {
  const response = await axios.put(`${BASE_URL}/Lead/${id}`, leadData);
  return response.data;
};

export const deleteLead = async (id) => {
  const response = await axios.delete(`${BASE_URL}/Lead/${id}`);
  return response.data;
};

export const bulkCreateLeads = async (leads) => {
  const response = await axios.post(`${BASE_URL}/Lead/bulk-create`, leads);
  return response.data;
};

export const bulkDeleteLeads = async (ids) => {
  const response = await axios.post(`${BASE_URL}/Lead/bulk-delete`, { ids });
  return response.data;
};

export const fetchLeadGroups = async () => {
  const response = await axios.get(`${BASE_URL}/Lead/lead-groups`);
  return response.data;
};

export const createLeadGroup = async (groupData) => {
  const response = await axios.post(`${BASE_URL}/Lead/lead-groups`, groupData);
  return response.data;
};

export const updateLeadGroup = async (id, groupData) => {
  const response = await axios.put(`${BASE_URL}/Lead/lead-groups/${id}`, groupData);
  return response.data;
};

export const deleteLeadGroup = async (id) => {
  const response = await axios.delete(`${BASE_URL}/Lead/lead-groups/${id}`);
  return response.data;
};

export const fetchLeadGroupsLead = async (id) => {
  const response = await axios.get(`${BASE_URL}/Lead/group/${id}`);
  return response.data;
};

export const groupAssign = async (lid, gid) => {
  const response = await axios.post(`${BASE_URL}/Lead/lead-group/assign`, { leadId: lid, groupId: gid });
  return response.data;
};
