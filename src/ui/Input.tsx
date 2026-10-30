import { useId, type InputHTMLAttributes } from 'react';

export function Input({ label, error, hint, id, ...props }: InputHTMLAttributes<HTMLInputElement> & {
  label: string; error?: string; hint?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const message = error ?? hint;
  const describedBy = [props['aria-describedby'], message ? `${inputId}-message` : undefined].filter(Boolean).join(' ') || undefined;
  return <div className="ui-field">
    <label htmlFor={inputId}>{label}</label>
    <input {...props} id={inputId} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={describedBy} />
    {message && <p id={`${inputId}-message`} role={error ? 'alert' : undefined}>{message}</p>}
  </div>;
}
