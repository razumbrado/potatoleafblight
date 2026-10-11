import { Link } from 'react-router-dom';
import { Home, ScanLine } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { buttonStyles } from '@/components/ui/Button';
import { EmptyIllustration } from '@/components/ui/EmptyState';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-16 text-center">
      <Link to="/" className="mb-10 rounded-xl">
        <Logo />
      </Link>
      <EmptyIllustration className="h-40" />
      <p className="eyebrow mt-8">Error 404</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">This page has gone to seed</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonStyles({ variant: 'outline' })}>
          <Home className="h-4 w-4" aria-hidden />
          Back to Home
        </Link>
        <Link to="/detect" className={buttonStyles()}>
          <ScanLine className="h-4 w-4" aria-hidden />
          Start Detection
        </Link>
      </div>
    </div>
  );
}
