// Reusable Input with label and error state
// Usage: <Input id="email" label="Email" type="email" error={errors.email} {...register('email')} />

export default function Input({ label, id, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <input id={id} className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''}`} {...props} />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}
