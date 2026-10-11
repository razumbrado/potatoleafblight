import type { ReactNode } from 'react';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { cn } from '@/utils/cn';

type Tone = 'info' | 'warning' | 'danger';

const styles: Record<Tone, { box: string; icon: string }> = {
  info: { box: 'border-accent/20 bg-accent-soft/60', icon: 'text-accent' },
  warning: { box: 'border-warning/25 bg-warning-soft', icon: 'text-warning' },
  danger: { box: 'border-danger/25 bg-danger-soft', icon: 'text-danger' },
};

const icons = { info: Info, warning: AlertTriangle, danger: ShieldAlert };

interface NoticeProps {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Notice({ tone = 'info', title, children, action, className }: NoticeProps) {
  const Icon = icons[tone];
  return (
    <div className={cn('print-surface flex gap-3 rounded-2xl border p-4', styles[tone].box, className)} role="note">
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', styles[tone].icon)} aria-hidden />
      <div className="min-w-0 flex-1 text-sm leading-relaxed text-ink-muted">
        {title && <p className="mb-0.5 font-bold text-ink">{title}</p>}
        <div>{children}</div>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

/** Shown wherever cloud features are needed but the Supabase env vars are missing. */
export function SupabaseSetupNotice({ className }: { className?: string }) {
  return (
    <Notice tone="warning" title="Supabase is not connected yet" className={className}>
      Accounts, saved scans, and analytics need a Supabase project. Copy <code className="font-semibold">.env.example</code>{' '}
      to <code className="font-semibold">.env</code>, add your <code className="font-semibold">VITE_SUPABASE_URL</code> and{' '}
      <code className="font-semibold">VITE_SUPABASE_PUBLISHABLE_KEY</code>, run the SQL migration, then restart the dev
      server. See the README for step-by-step instructions.
    </Notice>
  );
}
