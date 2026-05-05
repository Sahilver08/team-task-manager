import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout   from './components/layout/AppLayout'
import LoginPage   from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage  from './pages/ProjectsPage'
import TaskBoardPage from './pages/TaskBoardPage'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes — AppLayout checks auth and renders the sidebar */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard"                     element={<DashboardPage />} />
        <Route path="/projects"                      element={<ProjectsPage />} />
        <Route path="/projects/:projectId/tasks"     element={<TaskBoardPage />} />
      </Route>

      {/* Catch-all → redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
