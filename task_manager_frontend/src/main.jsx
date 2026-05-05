import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'

// React Query client — global cache config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                  // retry failed requests once
      refetchOnWindowFocus: true, // refresh data when user switches back to tab
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter enables React Router navigation */}
    <BrowserRouter>
      {/* QueryClientProvider enables useQuery/useMutation everywhere */}
      <QueryClientProvider client={queryClient}>
        {/* AuthProvider enables useAuth() everywhere */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)
