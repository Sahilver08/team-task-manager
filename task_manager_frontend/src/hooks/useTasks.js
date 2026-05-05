import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, createTask, updateTask, deleteTask } from '../api/tasksApi'

// ── Fetch tasks (with optional filters) ─────────────────────────────────────
export function useTasks(projectId, filters = {}) {
  return useQuery({
    queryKey: ['tasks', projectId, filters],
    queryFn:  () => getTasks(projectId, filters).then(r => r.data.data.results),
    enabled:  Boolean(projectId),
    staleTime: 20_000,
  })
}

// ── Create task ───────────────────────────────────────────────────────────────
export function useCreateTask(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => createTask(projectId, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })
}

// ── Update task (status, fields) ─────────────────────────────────────────────
export function useUpdateTask(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, data }) => updateTask(projectId, taskId, data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// ── Delete task ───────────────────────────────────────────────────────────────
export function useDeleteTask(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId) => deleteTask(projectId, taskId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })
}
