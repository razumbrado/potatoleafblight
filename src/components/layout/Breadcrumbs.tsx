import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { ROUTE_TITLES } from './navigation';

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => ({
    label: ROUTE_TITLES[segment] ?? (index > 0 && segments[index - 1] === 'history' ? 'Scan Details' : segment),
    to: `/${segments.slice(0, index + 1).join('/')}`,
  }));

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm">
        <li className="hidden sm:block">
          <Link
            to="/"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-subtle hover:text-ink"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={crumb.to} className={last ? 'flex min-w-0 items-center gap-1.5' : 'hidden items-center gap-1.5 sm:flex'}>
              <ChevronRight className="hidden h-4 w-4 shrink-0 text-ink-faint sm:block" aria-hidden />
              {last ? (
                <span className="truncate font-semibold text-ink" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.to} className="rounded-md px-1 font-medium text-ink-muted transition-colors hover:text-ink">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
