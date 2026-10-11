import { cn } from '@/utils/cn';

interface LogoMarkProps {
  className?: string;
  /** "onDark" for dark green backgrounds, "onLight" for light surfaces. */
  tone?: 'onDark' | 'onLight';
}

export function LogoMark({ className, tone = 'onLight' }: LogoMarkProps) {
  const tile = tone === 'onDark' ? '#74C69D' : '#12372A';
  const leaf = tone === 'onDark' ? '#12372A' : '#74C69D';
  return (
    <svg viewBox="0 0 48 48" className={cn('h-10 w-10 shrink-0', className)} role="img" aria-label="BlightVision logo">
      <rect width="48" height="48" rx="13" fill={tile} />
      <path d="M12.5 35.5C12.5 21.5 21.5 12.5 35.5 12.5C35.5 26.5 26.5 35.5 12.5 35.5Z" fill={leaf} />
      <path d="M13 35L27.5 20.5" stroke={tile} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="27.5" cy="27.5" r="2.3" fill={tile} />
    </svg>
  );
}

interface LogoProps extends LogoMarkProps {
  showTagline?: boolean;
  markClassName?: string;
}

export function Logo({ tone = 'onLight', showTagline = false, className, markClassName }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <LogoMark tone={tone} className={markClassName} />
      <span className="flex flex-col leading-none">
        <span className={cn('text-lg font-extrabold tracking-tight', tone === 'onDark' ? 'text-white' : 'text-ink')}>
          Blight<span className={tone === 'onDark' ? 'text-soft' : 'text-leaf'}>Vision</span>
        </span>
        {showTagline && (
          <span className={cn('mt-1 text-[11px] font-medium', tone === 'onDark' ? 'text-white/60' : 'text-ink-faint')}>
            Potato leaf blight AI
          </span>
        )}
      </span>
    </span>
  );
}
