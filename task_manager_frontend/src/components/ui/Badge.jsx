// Colored badge for status and priority
// Usage: <Badge variant="status" value="IN_PROGRESS" />

const STATUS_STYLES = {
  TODO:        'bg-slate-700 text-slate-300',
  IN_PROGRESS: 'bg-blue-900/60 text-blue-300 border border-blue-700',
  IN_REVIEW:   'bg-amber-900/60 text-amber-300 border border-amber-700',
  DONE:        'bg-emerald-900/60 text-emerald-300 border border-emerald-700',
}

const STATUS_LABELS = {
  TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done',
}

const PRIORITY_STYLES = {
  LOW:    'bg-slate-700 text-slate-400',
  MEDIUM: 'bg-amber-900/60 text-amber-400',
  HIGH:   'bg-red-900/60 text-red-400 border border-red-700',
}

const ROLE_STYLES = {
  ADMIN:  'bg-indigo-900/60 text-indigo-300 border border-indigo-700',
  MEMBER: 'bg-slate-700 text-slate-300',
}

export default function Badge({ variant = 'status', value, className = '' }) {
  let style = 'bg-slate-700 text-slate-300'
  let label = value

  if (variant === 'status')   { style = STATUS_STYLES[value]   || style; label = STATUS_LABELS[value]   || value }
  if (variant === 'priority') { style = PRIORITY_STYLES[value] || style }
  if (variant === 'role')     { style = ROLE_STYLES[value]     || style }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${style} ${className}`}>
      {label}
    </span>
  )
}
