// Reusable button component — wraps native <button> with design system styles
// Usage: <Button variant="primary" loading={isLoading}>Save</Button>

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  ...props
}) {
  const base = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    ghost:     'btn-ghost',
    danger:    'btn-danger',
  }[variant]

  return (
    <button
      disabled={loading || props.disabled}
      className={`${base} inline-flex items-center gap-2 ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
