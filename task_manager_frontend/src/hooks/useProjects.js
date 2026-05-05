import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProjects, getProject, createProject, updateProject, deleteProject, addMember } from '../api/projectsApi'

// ── Fetch all projects ───────────────────────────────────────────────────────
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn:  () => getProjects().then(r => r.data.data.results),
    staleTime: 30_000,   // use cached data for 30 seconds before refetching
  })
}

// ── Fetch one project ─────────────────────────────────────────────────────────
export function useProject(id) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn:  () => getProject(id).then(r => r.data.data),
    enabled:  Boolean(id),
  })
}

// ── Create project ────────────────────────────────────────────────────────────
export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createProject,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

// ── Update project ────────────────────────────────────────────────────────────
export function useUpdateProject(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => updateProject(id, data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['projects', id] })
    },
  })
}

// ── Delete project ────────────────────────────────────────────────────────────
export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteProject,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

// ── Add Member ───────────────────────────────────────────────────────────────
export function useAddMember(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => addMember(projectId, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['projects', projectId] }),
  })
}
