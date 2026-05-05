import { useDashboard } from '../hooks/useDashboard'
import Spinner from '../components/ui/Spinner'

// One stat card
function StatCard({ label, value, sub, color = 'indigo', icon }) {
  const colors = {
    indigo:  'bg-indigo-600/15 text-indigo-400 border-indigo-600/30',
    emerald: 'bg-emerald-600/15 text-emerald-400 border-emerald-600/30',
    red:     'bg-red-600/15 text-red-400 border-red-600/30',
    amber:   'bg-amber-600/15 text-amber-400 border-amber-600/30',
  }
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg border ${colors[color]}`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {icon}
        </svg>
      </div>
      <div>
        <p className="text-slate-400 text-sm">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// Completion progress bar
function ProgressBar({ value }) {
  return (
    <div className="w-full bg-slate-700 rounded-full h-1.5">
      <div
        className="bg-indigo-500 h-1.5 rounded-full transition-all duration-700"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard()

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-64 text-red-400">
      Failed to load dashboard. Please refresh.
    </div>
  )

  const { summary, my_assigned_tasks, by_project } = data

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Your work summary across all projects</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={summary.total_tasks} color="indigo"
          icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}
        />
        <StatCard label="Completed" value={summary.completed_tasks} color="emerald"
          sub={`${summary.completion_rate}% completion rate`}
          icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
        />
        <StatCard label="In Progress" value={summary.in_progress_tasks} color="amber"
          icon={<path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />}
        />
        <StatCard label="Overdue" value={summary.overdue_tasks} color="red"
          icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Project breakdown */}
        <div className="card p-5 xl:col-span-2">
          <h2 className="text-sm font-semibold text-white mb-4">By Project</h2>
          {by_project.length === 0 ? (
            <p className="text-slate-500 text-sm">No projects yet.</p>
          ) : (
            <div className="space-y-4">
              {by_project.map((p) => {
                const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0
                return (
                  <div key={p.project_id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-slate-300 font-medium">{p.project_name}</span>
                      <span className="text-xs text-slate-500">{p.completed}/{p.total} done</span>
                    </div>
                    <ProgressBar value={pct} />
                    {p.overdue > 0 && (
                      <p className="text-xs text-red-400 mt-1">{p.overdue} overdue</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* My tasks widget */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">My Assigned Tasks</h2>
          <div className="space-y-3">
            {[
              { label: 'Total assigned', value: my_assigned_tasks.total, color: 'text-white' },
              { label: 'Completed',      value: my_assigned_tasks.completed, color: 'text-emerald-400' },
              { label: 'Overdue',        value: my_assigned_tasks.overdue,   color: 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                <span className="text-sm text-slate-400">{label}</span>
                <span className={`text-lg font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
