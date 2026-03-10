'use client';

import { Input } from '@/components/ui/input';

interface QuestionNumericProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function QuestionNumeric({ value, onChange, placeholder }: QuestionNumericProps) {
  return (
    <Input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? 'Ingresa tu respuesta numérica'}
      className="max-w-xs font-mono"
    />
  );
}
