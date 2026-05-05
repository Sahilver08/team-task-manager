import client from './axiosClient'

export const getDashboard = () => client.get('/dashboard/')
