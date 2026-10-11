import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { Breadcrumbs } from './Breadcrumbs';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink transition-colors hover:border-line-strong lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <Breadcrumbs />
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <ThemeToggle />
          {user ? (
            <UserMenu />
          ) : loading ? (
            <div className="skeleton h-11 w-24 rounded-xl" />
          ) : (
            <Link to="/login" state={{ from: location.pathname }} className={buttonStyles({ size: 'md' })}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
