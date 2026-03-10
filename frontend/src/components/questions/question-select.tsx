'use client';

import { cn } from '@/lib/utils';

interface Option {
  id: string;
  label: string;
  value: string;
}

interface QuestionSelectProps {
  options: Option[];
  value: string | string[] | null;
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
}

export function QuestionSelect({ options, value, onChange, multiple }: QuestionSelectProps) {
  if (multiple) {
    const selected = (value as string[] | null) ?? [];
    const toggle = (v: string) => {
      const next = selected.includes(v)
        ? selected.filter((x) => x !== v)
        : [...selected, v];
      onChange(next);
    };
    return (
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt.id}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition',
              selected.includes(opt.value)
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            )}
          >
            <input
              type="checkbox"
              checked={selected.includes(opt.value)}
              onChange={() => toggle(opt.value)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.id}
          className={cn(
            'flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition',
            value === opt.value
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 hover:border-slate-300'
          )}
        >
          <input
            type="radio"
            name="choice"
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="h-4 w-4 border-slate-300"
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
