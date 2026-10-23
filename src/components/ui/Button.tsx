import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'light' | 'glass';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--btn-radius)] font-semibold transition-all duration-200 select-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-[rgb(var(--btn-primary))] text-white shadow-sm hover:bg-[rgb(var(--btn-primary-hover))] hover:shadow-glow',
  secondary: 'bg-accent-soft text-accent hover:brightness-95 dark:hover:brightness-125',
  outline: 'border border-line-strong bg-surface text-ink hover:border-accent hover:bg-subtle',
  ghost: 'text-ink-muted hover:bg-subtle hover:text-ink',
  danger: 'bg-danger text-white shadow-sm hover:brightness-110',
  light: 'bg-white text-forest shadow-sm hover:bg-mint',
  glass: 'border border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

/** Class string for elements that should look like a button (e.g. router links). */
export function buttonStyles(options: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[options.variant ?? 'primary'], sizes[options.size ?? 'md'], options.className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, icon, iconRight, className, children, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
});
