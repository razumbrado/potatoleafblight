import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronsLeft, ChevronsRight, Lock, LogIn, X } from 'lucide-react';
import { Logo, LogoMark } from '@/components/common/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';
import { getInitials } from '@/utils/format';
import { NAV_GROUPS, NAV_ITEMS } from './navigation';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  /** Called after a navigation click (closes the mobile drawer). */
  onNavigate?: () => void;
  /** Mobile drawer variant shows a close button instead of the collapse toggle. */
  onClose?: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, onNavigate, onClose }: SidebarProps) {
  const { user, displayName } = useAuth();

  return (
    <div className="flex h-full flex-col bg-sidebar-gradient text-white">
      <div className={cn('flex h-[72px] shrink-0 items-center', collapsed ? 'justify-center px-2' : 'justify-between px-5')}>
        <Link to="/" onClick={onNavigate} aria-label="BlightVision home" className="rounded-xl">
          {collapsed ? <LogoMark tone="onDark" /> : <Logo tone="onDark" showTagline />}
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className={cn('flex-1 overflow-y-auto pb-4', collapsed ? 'px-3' : 'px-4')} aria-label="Main navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group.key} className="mt-5 first:mt-2">
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-8 bg-white/10" />
            ) : (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">{group.label}</p>
            )}
            <ul className="space-y-1">
              {NAV_ITEMS.filter((item) => item.group === group.key).map((item) => {
                const locked = item.protected && !user;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex h-11 items-center rounded-xl text-sm font-semibold transition-colors duration-200',
                          collapsed ? 'justify-center' : 'gap-3 px-3',
                          isActive ? 'text-white' : 'text-white/65 hover:bg-white/[0.07] hover:text-white',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive &&
                            (onClose ? (
                              <span className="absolute inset-0 rounded-xl bg-white/[0.12] ring-1 ring-inset ring-white/10" />
                            ) : (
                              <motion.span
                                layoutId="nav-active"
                                className="absolute inset-0 rounded-xl bg-white/[0.12] ring-1 ring-inset ring-white/10"
                                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                              />
                            ))}
                          {isActive && !collapsed && (
                            <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-soft" />
                          )}
                          <item.icon
                            className={cn('relative h-5 w-5 shrink-0 transition-colors', isActive ? 'text-soft' : 'text-white/60 group-hover:text-white')}
                            aria-hidden
                          />
                          {!collapsed && <span className="relative flex-1 truncate">{item.label}</span>}
                          {!collapsed && locked && <Lock className="relative h-3.5 w-3.5 text-white/35" aria-label="Sign in required" />}
                          {collapsed && <span className="sr-only">{item.label}</span>}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn('shrink-0 space-y-3 border-t border-white/10 py-4', collapsed ? 'px-3' : 'px-4')}>
        {user ? (
          <Link
            to="/settings"
            onClick={onNavigate}
            className={cn('flex items-center rounded-xl transition-colors hover:bg-white/[0.07]', collapsed ? 'justify-center py-1' : 'gap-3 px-2 py-2')}
            title={collapsed ? displayName : undefined}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft text-xs font-bold text-forest">
              {getInitials(displayName)}
            </span>
            {!collapsed && (
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">{displayName}</span>
                <span className="block truncate text-xs text-white/50">{user.email}</span>
              </span>
            )}
          </Link>
        ) : (
          <Link
            to="/login"
            onClick={onNavigate}
            title={collapsed ? 'Sign in' : undefined}
            className={cn(
              'flex h-11 items-center justify-center gap-2 rounded-xl bg-soft text-sm font-bold text-forest transition-all hover:brightness-105',
              collapsed && 'w-full',
            )}
          >
            <LogIn className="h-4 w-4" aria-hidden />
            {!collapsed && 'Sign in'}
            {collapsed && <span className="sr-only">Sign in</span>}
          </Link>
        )}

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              'flex h-9 w-full items-center rounded-xl text-xs font-medium text-white/50 transition-colors hover:bg-white/[0.07] hover:text-white',
              collapsed ? 'justify-center' : 'gap-2 px-3',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            {!collapsed && 'Collapse'}
          </button>
        )}
      </div>
    </div>
  );
}
