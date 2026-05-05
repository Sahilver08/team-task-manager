import client from './axiosClient'

export const register     = (data) => client.post('/auth/register/', data)
export const login        = (data) => client.post('/auth/login/', data)
export const logout       = (data) => client.post('/auth/logout/', data)
export const refreshToken = (data) => client.post('/auth/refresh/', data)
export const getMe        = ()     => client.get('/auth/me/')
