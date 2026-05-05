import client from './axiosClient'

// Tasks
export const getTasks    = (projectId, params) => client.get(`/projects/${projectId}/tasks/`, { params })
export const getTask     = (projectId, taskId) => client.get(`/projects/${projectId}/tasks/${taskId}/`)
export const createTask  = (projectId, data)   => client.post(`/projects/${projectId}/tasks/`, data)
export const updateTask  = (projectId, taskId, data) => client.patch(`/projects/${projectId}/tasks/${taskId}/update/`, data)
export const deleteTask  = (projectId, taskId) => client.delete(`/projects/${projectId}/tasks/${taskId}/`)

// Comments
export const getComments   = (projectId, taskId)       => client.get(`/projects/${projectId}/tasks/${taskId}/comments/`)
export const addComment    = (projectId, taskId, data) => client.post(`/projects/${projectId}/tasks/${taskId}/comments/`, data)
