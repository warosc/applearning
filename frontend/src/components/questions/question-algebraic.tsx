'use client';

import { Input } from '@/components/ui/input';

interface QuestionAlgebraicProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function QuestionAlgebraic({ value, onChange, placeholder }: QuestionAlgebraicProps) {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? 'Ej: 2x, 3a², etc.'}
      className="max-w-md font-mono"
    />
  );
}
