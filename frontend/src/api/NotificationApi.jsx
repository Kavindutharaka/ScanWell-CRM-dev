import api from '../config/axios';

export const fetchNotifications = async (userRoleId) => {
  const response = await api.get('/Notification', { params: { userRoleId } });
  return response.data;
};

export const markNotificationsSeen = async (userRoleId, totalCount = 0) => {
  const response = await api.post('/Notification/mark-seen', null, { params: { userRoleId, totalCount } });
  return response.data;
};
