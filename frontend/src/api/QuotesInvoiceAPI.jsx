import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';


const DOCUMENTS_BASE_URL = `${BASE_URL}/Documents`;
const TEMPLATES_BASE_URL = `${BASE_URL}/Templates`;
// const DOCUMENTS_BASE_URL = 'http://localhost:5054/api/Documents';
// const TEMPLATES_BASE_URL = 'http://localhost:5054/api/Templates';

export const fetchDocuments = async () => {
  const response = await axios.get(`${DOCUMENTS_BASE_URL}`);
  return response.data;
};

export const fetchDocumentById = async (id) => {
  const response = await axios.get(`${DOCUMENTS_BASE_URL}/${id}`);
  return response.data;
};

export const createQuote = async (quote) => {
  const response = await axios.post(`${DOCUMENTS_BASE_URL}/quotes`, quote);
  return response.data;
};

export const createInvoice = async (invoice) => {
  const response = await axios.post(`${DOCUMENTS_BASE_URL}/invoices`, invoice);
  return response.data;
};

export const updateDocument = async (id, document) => {
  const response = await axios.put(`${DOCUMENTS_BASE_URL}/${id}`, document);
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await axios.delete(`${DOCUMENTS_BASE_URL}/${id}`);
  return response.data;
};

export const downloadDocumentPdf = async (id) => {
  const response = await axios.get(`${DOCUMENTS_BASE_URL}/${id}/download`, { responseType: 'blob' });
  return response.data;
};

export const sendDocument = async (id) => {
  const response = await axios.post(`${DOCUMENTS_BASE_URL}/${id}/send`);
  return response.data;
};

export const fetchTemplates = async (freightType = null) => {
  const params = freightType ? { freightType } : {};
  const response = await axios.get(`${TEMPLATES_BASE_URL}`, { params });
  return response.data;
};

export const createTemplate = async (template) => {
  const response = await axios.post(`${TEMPLATES_BASE_URL}`, template);
  return response.data;
};