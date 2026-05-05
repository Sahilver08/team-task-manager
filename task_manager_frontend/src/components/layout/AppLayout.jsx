import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from './Navbar'

// Protected layout — redirects to login if not authenticated
// All pages inside this layout share the sidebar Navbar
export default function AppLayout() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Navbar />
      {/* Main content — offset by sidebar width (w-56 = 14rem) */}
      <main className="flex-1 ml-56 min-h-screen">
        <div className="max-w-7xl mx-auto p-6">
          <Outlet />   {/* React Router renders the current page here */}
        </div>
      </main>
    </div>
  )
}
