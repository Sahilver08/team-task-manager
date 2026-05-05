import api from './api'

export const getNotifications = async () => {
  const { data } = await api.get('/notifications/')
  return data.data
}

export const markNotificationRead = async (id) => {
  const { data } = await api.post(`/notifications/${id}/read/`)
  return data
}

export const markAllNotificationsRead = async () => {
  const { data } = await api.post('/notifications/read-all/')
  return data
}
