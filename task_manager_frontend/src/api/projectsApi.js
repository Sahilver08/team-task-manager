import client from './axiosClient'

// Projects
export const getProjects      = ()         => client.get('/projects/')
export const getProject       = (id)       => client.get(`/projects/${id}/`)
export const createProject    = (data)     => client.post('/projects/', data)
export const updateProject    = (id, data) => client.patch(`/projects/${id}/`, data)
export const deleteProject    = (id)       => client.delete(`/projects/${id}/`)

// Members
export const getMembers       = (projectId)         => client.get(`/projects/${projectId}/members/`)
export const addMember        = (projectId, data)   => client.post(`/projects/${projectId}/members/`, data)
export const updateMemberRole = (projectId, userId, data) => client.patch(`/projects/${projectId}/members/${userId}/`, data)
export const removeMember     = (projectId, userId) => client.delete(`/projects/${projectId}/members/${userId}/`)
