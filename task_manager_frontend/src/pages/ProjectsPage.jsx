import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects, useCreateProject, useDeleteProject } from '../hooks/useProjects'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'

function ProjectCard({ project, onDelete }) {
  const navigate = useNavigate()
  return (
    <div
      className="card p-5 hover:border-slate-600 transition-all duration-200 group cursor-pointer"
      onClick={() => navigate(`/projects/${project.id}/tasks`)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors truncate">
              {project.name}
            </h3>
            <Badge variant="role" value={project.my_role} />
          </div>
          <p className="text-xs text-slate-500 line-clamp-2">{project.description || 'No description'}</p>
        </div>
        {project.my_role === 'ADMIN' && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(project.id) }}
            className="opacity-0 group-hover:opacity-100 ml-2 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
            aria-label="Delete project"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center gap-1.5 text-slate-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-xs">{project.task_count} tasks</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
          </svg>
          <span className="text-xs">{project.member_count} members</span>
        </div>
      </div>
    </div>
  )
}

function CreateProjectModal({ open, onClose }) {
  const [form, setForm]   = useState({ name: '', description: '' })
  const [error, setError] = useState('')
  const { mutate, isPending } = useCreateProject()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Project name is required'); return }
    mutate(form, {
      onSuccess: () => { setForm({ name: '', description: '' }); onClose() },
      onError:   (err) => setError(err.response?.data?.message || 'Failed to create project'),
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="New Project">
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="proj-name" label="Project name" value={form.name}
          onChange={(e) => { setForm(p => ({ ...p, name: e.target.value })); setError('') }}
          placeholder="e.g. Website Redesign" error={error && !form.name.trim() ? error : ''} />
        <div>
          <label htmlFor="proj-desc" className="label">
            Description <span className="text-slate-500">(optional)</span>
          </label>
          <textarea id="proj-desc" className="input resize-none" rows={3}
            value={form.description}
            onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="What is this project about?" />
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" type="button" onClick={onClose} className="flex-1 justify-center">Cancel</Button>
          <Button type="submit" loading={isPending} className="flex-1 justify-center">Create Project</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function ProjectsPage() {
  const { data: projects = [], isLoading, error } = useProjects()
  const { mutate: deleteProject } = useDeleteProject()
  const [showCreate, setShowCreate] = useState(false)

  const handleDelete = (id) => {
    if (window.confirm('Delete this project and all its tasks? This cannot be undone.')) {
      deleteProject(id)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button id="create-project-btn" onClick={() => setShowCreate(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="text-center py-16 text-red-400">Failed to load projects. Please refresh.</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-slate-400 font-medium">No projects yet</p>
          <p className="text-slate-500 text-sm mt-1">Create your first project to get started</p>
          <Button className="mt-5" onClick={() => setShowCreate(true)}>Create your first project</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
