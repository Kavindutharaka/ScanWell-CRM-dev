import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

// const BASE_URL = 'http://localhost:5054/api/Lead';
// const BASE_URL = './api/Lead';

export const fetchLeads = async () => {
  try {
    // Import new Facebook leads first (adds to DB if new)
    await axios.get(`${BASE_URL}/Lead/facebook-leads`);
    
    // Then fetch all leads from DB (manual + imported FB)
    const response = await axios.get(`${BASE_URL}/Lead`);
    return response.data;
  } catch (error) {
    // Simple fallback: If FB import fails (e.g., config issue), still get existing leads
    console.warn('Facebook import failed, falling back to existing leads:', error.message);
    const response = await axios.get(`${BASE_URL}/Lead`);
    return response.data;
  }
};

export const fetchLeadById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/Lead/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch lead with id ${id}`);
  }
};

export const createLead = async (leadData) => {
  try {
    const response = await axios.post(`${BASE_URL}/Lead`, leadData);
    return response.data;
  } catch (error) {
    throw new Error('Failed to create lead');
  }
};

export const updateLead = async (id, leadData) => {
  try {
    const response = await axios.put(`${BASE_URL}/Lead/${id}`, leadData);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to update lead with id ${id}`);
  }
};

export const deleteLead = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/Lead/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to delete lead with id ${id}`);
  }
};

export const approveLead = async (id) => {
  try {
    const response = await axios.patch(`${BASE_URL}/Lead/${id}/approve`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to approve lead with id ${id}`);
  }
};

export const rejectLead = async (id, reason) => {
  try {
    const response = await axios.patch(`${BASE_URL}/Lead/${id}/reject`, { reason });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to reject lead with id ${id}`);
  }
};

export const assignLead = async (id, employeeId) => {
  try {
    const response = await axios.patch(`${BASE_URL}/Lead/${id}/assign`, { employeeId });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to assign lead with id ${id}`);
  }
};

export const bulkApproveLeads = async (leadIds) => {
  try {
    const response = await axios.patch(`${BASE_URL}/Lead/bulk/approve`, { leadIds });
    return response.data;
  } catch (error) {
    throw new Error('Failed to bulk approve leads');
  }
};

export const bulkRejectLeads = async (leadIds, reason) => {
  try {
    const response = await axios.patch(`${BASE_URL}/Lead/bulk/reject`, { leadIds, reason });
    return response.data;
  } catch (error) {
    throw new Error('Failed to bulk reject leads');
  }
};

export const bulkAssignLeads = async (leadIds, employeeId) => {
  try {
    const response = await axios.patch(`${BASE_URL}/Lead/bulk/assign`, { leadIds, employeeId });
    return response.data;
  } catch (error) {
    throw new Error('Failed to bulk assign leads');
  }
};

export const convertLeadToContact = async (id) => {
  try {
    const response = await axios.post(`${BASE_URL}/Lead/${id}/convert`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to convert lead with id ${id} to contact`);
  }
};

export const importLeadsFromExcel = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${BASE_URL}/Lead/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to import leads from Excel');
  }
};

export const fetchLeadGroups = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/Lead/lead-groups`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch lead groups');
  }
};

export const createLeadGroup = async (groupData) => {
  try {
    const response = await axios.post(`${BASE_URL}/Lead/lead-groups`, groupData);
    return response.data;
  } catch (error) {
    throw new Error('Failed to create lead group');
  }
};

export const updateLeadGroup = async (id, groupData) => {
  try {
    const response = await axios.put(`${BASE_URL}/Lead/lead-groups/${id}`, groupData);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to update lead group with id ${id}`);
  }
};

export const deleteLeadGroup = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/Lead/lead-groups/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to delete lead group with id ${id}`);
  }
};

export const fetchLeadGroupsLead = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/Lead/group/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch lead groups');
  }
};

export const groupAssign = async (lid, gid) => {
  console.log("Assigning lead:", lid, "to group:", gid);
  try {
    const response = await axios.post(`${BASE_URL}/Lead/lead-group/assign`, { leadId: lid, groupId: gid });
    return response.data;
  } catch (error) {
    throw new Error('Failed to assign lead to group');
  }
};
