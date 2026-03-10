'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FormField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
}

interface ExamFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, unknown>) => void;
  initialValues?: Record<string, unknown>;
}

export function ExamForm({ fields, onSubmit, initialValues = {} }: ExamFormProps) {
  const schema = z.object(
    Object.fromEntries(
      fields.map((f) => [
        f.id,
        f.required ? z.string().min(1, 'Requerido') : z.string().optional(),
      ])
    )
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(
      fields.map((f) => [f.id, (initialValues[f.id] as string) ?? ''])
    ),
  });

  return (
    <form
      onSubmit={form.handleSubmit((data) => onSubmit(data as Record<string, unknown>))}
      className="space-y-3"
    >
      {fields.map((f) => (
        <div key={f.id}>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {f.label} {f.required && '*'}
          </label>
          <Input
            type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
            {...form.register(f.id)}
            className="w-full"
          />
          {form.formState.errors[f.id] && (
            <p className="mt-1 text-xs text-red-600">
              {String(form.formState.errors[f.id]?.message)}
            </p>
          )}
        </div>
      ))}
      <Button type="submit" size="sm">
        Guardar datos
      </Button>
    </form>
  );
}
