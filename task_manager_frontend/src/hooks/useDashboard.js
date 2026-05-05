import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api/dashboardApi'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => getDashboard().then(r => r.data.data),
    staleTime: 60_000,   // backend also caches for 60s — no point refetching faster
    refetchOnWindowFocus: false,
  })
}
