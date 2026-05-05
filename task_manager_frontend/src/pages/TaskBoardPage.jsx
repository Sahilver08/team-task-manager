import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks'
import { useProject } from '../hooks/useProjects'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'

const COLUMNS = [
  { status: 'TODO',        label: 'To Do',       color: 'border-slate-600' },
  { status: 'IN_PROGRESS', label: 'In Progress',  color: 'border-blue-600' },
  { status: 'IN_REVIEW',   label: 'In Review',    color: 'border-amber-600' },
  { status: 'DONE',        label: 'Done',         color: 'border-emerald-600' },
]

// Single task card on the Kanban board
function TaskCard({ task, isAdmin, onStatusChange, onDelete, projectId }) {
  const isOverdue = task.is_overdue
  return (
    <div className="card p-3.5 hover:border-slate-500 transition-all duration-150 group">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-white leading-snug">{task.title}</p>
        {isAdmin && (
          <button onClick={() => onDelete(task.id)}
            className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 text-slate-500 hover:text-red-400 rounded transition-all"
            aria-label="Delete task">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
        <Badge variant="priority" value={task.priority} />
        {isOverdue && (
          <span className="text-xs text-red-400 font-medium">⚠ Overdue</span>
        )}
      </div>

      {/* Footer: assignee + due date */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-700">
        {task.assigned_to ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {task.assigned_to.full_name?.[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-slate-400">{task.assigned_to.full_name}</span>
          </div>
        ) : <span className="text-xs text-slate-600">Unassigned</span>}

        {task.due_date && (
          <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
            {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* Quick status move buttons */}
      {(isAdmin || task.assigned_to?.id) && (
        <div className="mt-2.5 flex gap-1">
          {COLUMNS.filter(c => c.status !== task.status).slice(0, 2).map(c => (
            <button key={c.status}
              onClick={() => onStatusChange(task.id, c.status, task.version)}
              className="text-xs text-slate-500 hover:text-indigo-400 px-2 py-0.5 rounded border border-slate-700 hover:border-indigo-600 transition-all">
              → {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Kanban column
function KanbanColumn({ column, tasks, isAdmin, onStatusChange, onDelete, projectId }) {
  return (
    <div className={`flex flex-col min-w-0 border-t-2 ${column.color}`}>
      <div className="flex items-center justify-between px-1 py-3">
        <span className="text-sm font-semibold text-slate-300">{column.label}</span>
        <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 space-y-2.5 min-h-16">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} isAdmin={isAdmin}
            onStatusChange={onStatusChange} onDelete={onDelete} projectId={projectId} />
        ))}
        {tasks.length === 0 && (
          <div className="border border-dashed border-slate-800 rounded-xl h-16 flex items-center justify-center">
            <p className="text-xs text-slate-700">No tasks</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Create task modal
function CreateTaskModal({ open, onClose, projectId, members = [] }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', due_date: '', assigned_to_id: '' })
  const [error, setError] = useState('')
  const { mutate, isPending } = useCreateTask(projectId)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    const payload = { ...form, assigned_to_id: form.assigned_to_id || null, due_date: form.due_date || null }
    mutate(payload, {
      onSuccess: () => { setForm({ title: '', description: '', priority: 'MEDIUM', due_date: '', assigned_to_id: '' }); onClose() },
      onError: (err) => {
        const errs = err.response?.data?.errors
        setError(errs ? Object.values(errs).flat()[0] : (err.response?.data?.message || 'Failed to create task'))
      }
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="New Task">
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="task-title" label="Title" value={form.title}
          onChange={e => { setForm(p => ({...p, title: e.target.value})); setError('') }}
          placeholder="What needs to be done?" />
        <div>
          <label htmlFor="task-desc" className="label">Description <span className="text-slate-500">(optional)</span></label>
          <textarea id="task-desc" className="input resize-none" rows={2}
            value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
            placeholder="Add more detail..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-priority" className="label">Priority</label>
            <select id="task-priority" className="input" value={form.priority}
              onChange={e => setForm(p => ({...p, priority: e.target.value}))}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <Input id="task-due" label="Due date" type="date" value={form.due_date}
            onChange={e => setForm(p => ({...p, due_date: e.target.value}))} />
        </div>
        <div>
          <label htmlFor="task-assignee" className="label">Assign to</label>
          <select id="task-assignee" className="input" value={form.assigned_to_id}
            onChange={e => setForm(p => ({...p, assigned_to_id: e.target.value}))}>
            <option value="">Unassigned</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" type="button" onClick={onClose} className="flex-1 justify-center">Cancel</Button>
          <Button type="submit" loading={isPending} className="flex-1 justify-center">Create Task</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function TaskBoardPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showCreate, setShowCreate] = useState(false)

  const { data: tasks = [],   isLoading: tasksLoading } = useTasks(projectId)
  const { data: project,      isLoading: projLoading  } = useProject(projectId)
  const { mutate: updateTask } = useUpdateTask(projectId)
  const { mutate: deleteTask } = useDeleteTask(projectId)

  const isAdmin = project?.my_role === 'ADMIN'
  const members = project?.members || []

  const handleStatusChange = (taskId, newStatus, version) => {
    updateTask({ taskId, data: { status: newStatus, version } })
  }
  const handleDelete = (taskId) => {
    if (confirm('Delete this task?')) deleteTask(taskId)
  }

  if (tasksLoading || projLoading) return (
    <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  )

  // Group tasks by status column
  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.status] = tasks.filter(t => t.status === col.status)
    return acc
  }, {})

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/projects')}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{project?.name}</h1>
            <p className="text-slate-400 text-sm">{tasks.length} total tasks</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreate(true)} id="create-task-btn">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </Button>
        )}
      </div>

      {/* Kanban board — 4 equal columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(col => (
          <KanbanColumn key={col.status} column={col}
            tasks={tasksByStatus[col.status]} isAdmin={isAdmin}
            onStatusChange={handleStatusChange} onDelete={handleDelete}
            projectId={projectId} />
        ))}
      </div>

      <CreateTaskModal open={showCreate} onClose={() => setShowCreate(false)}
        projectId={projectId} members={members} />
    </div>
  )
}
