import { cn } from '@/lib/utils';

interface LogoMarkProps {
  className?: string;
}

/** The brand mark (navy square + emerald dot), matching the favicon. */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn('h-8 w-8', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="16" fill="#1E3A8A" />
      <path d="M20 18h22v7H28v6h12v7H28v6h14v7H20z" fill="#FFFFFF" />
      <circle cx="46" cy="46" r="6" fill="#10B981" />
    </svg>
  );
}

interface LogoProps {
  /** Optional small label shown under the wordmark, e.g. "Admin". */
  subtitle?: string;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}

/** Brand mark + "Escobita" wordmark. */
export function Logo({ subtitle, className, markClassName, wordmarkClassName }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={markClassName} />
      <span className="flex flex-col leading-none">
        <span className={cn('font-display text-lg font-bold tracking-tight text-brand-800', wordmarkClassName)}>
          Escobita
        </span>
        {subtitle && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-success-600">
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
