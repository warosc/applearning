import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        neutral: 'border-slate-200 bg-slate-100 text-slate-600',
        brand: 'border-brand-200 bg-brand-50 text-brand-700',
        success: 'border-success-200 bg-success-50 text-success-700',
        warning: 'border-warning-100 bg-warning-50 text-warning-700',
        danger: 'border-danger-100 bg-danger-50 text-danger-700',
        info: 'border-info-100 bg-info-50 text-info-700',
        outline: 'border-slate-300 bg-transparent text-slate-600',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
