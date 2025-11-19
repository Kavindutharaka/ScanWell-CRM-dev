import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

export const fetchRfq = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/rfq`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch rfqs');
  }
};

export const createRfq = async (rfq) => {
  try {
    const response = await axios.post(`${BASE_URL}/rfq`, rfq);
    return response.data;
  } catch (error) {
    throw new Error('Failed to create rfq');
  }
};
export const getDataObj = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/rfq/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to get obj from rfq');
  }
};