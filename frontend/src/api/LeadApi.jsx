import api from '../config/axios';

export const fetchLeads = async () => {
  const response = await api.get(`/Lead`);
  return response.data;
};

export const updateLead = async (id, leadData) => {
  const response = await api.put(`/Lead/${id}`, leadData);
  return response.data;
};

export const deleteLead = async (id) => {
  const response = await api.delete(`/Lead/${id}`);
  return response.data;
};

export const bulkCreateLeads = async (leads) => {
  const response = await api.post(`/Lead/bulk-create`, leads);
  return response.data;
};

export const bulkDeleteLeads = async (ids) => {
  const response = await api.post(`/Lead/bulk-delete`, { ids });
  return response.data;
};

export const fetchLeadGroups = async () => {
  const response = await api.get(`/Lead/lead-groups`);
  return response.data;
};

export const createLeadGroup = async (groupData) => {
  const response = await api.post(`/Lead/lead-groups`, groupData);
  return response.data;
};

export const updateLeadGroup = async (id, groupData) => {
  const response = await api.put(`/Lead/lead-groups/${id}`, groupData);
  return response.data;
};

export const deleteLeadGroup = async (id) => {
  const response = await api.delete(`/Lead/lead-groups/${id}`);
  return response.data;
};

export const fetchLeadGroupsLead = async (id) => {
  const response = await api.get(`/Lead/group/${id}`);
  return response.data;
};

export const groupAssign = async (lid, gid) => {
  const response = await api.post(`/Lead/lead-group/assign`, { leadId: lid, groupId: gid });
  return response.data;
};
