import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const inputBase =
  'flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-50';

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input type={type} className={cn(inputBase, className)} ref={ref} {...props} />
  )
);
Input.displayName = 'Input';

interface FieldProps extends InputProps {
  label?: string;
  error?: string;
  hint?: string;
}

/** Labelled field with inline error styling. */
const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const fieldId = id || props.name;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          id={fieldId}
          ref={ref}
          className={cn(
            inputBase,
            error && 'border-danger-500 focus-visible:border-danger-500 focus-visible:ring-danger-500/30',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs font-medium text-danger-600">{error}</p>
        ) : hint ? (
          <p className="text-xs text-slate-400">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Field.displayName = 'Field';

export { Input, Field };
