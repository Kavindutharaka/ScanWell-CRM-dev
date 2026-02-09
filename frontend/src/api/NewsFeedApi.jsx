// NewsFeedApi.jsx
import api from '../config/axios';

export const fetchNewsFeedImages = async () => {
  const response = await api.get('/NewsFeed/images');
  return response.data;
};

export const uploadNewsFeedImage = async (formData) => {
  const response = await api.post('/NewsFeed/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteNewsFeedImage = async (id) => {
  const response = await api.delete(`/NewsFeed/images/${id}`);
  return response.data;
};

const NewsFeedApi = {
  fetchNewsFeedImages, uploadNewsFeedImage, deleteNewsFeedImage
};

export default NewsFeedApi;
