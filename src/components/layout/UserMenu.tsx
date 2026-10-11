import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, History, LogOut, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';
import { getErrorMessage, getInitials } from '@/utils/format';

export function UserMenu() {
  const { user, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      setOpen(false);
      toast.success('You have been signed out.');
      navigate('/');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not sign out.'));
    } finally {
      setSigningOut(false);
    }
  };

  const itemClass =
    'flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-subtle hover:text-ink';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-11 items-center gap-2.5 rounded-xl border border-line bg-surface pl-1.5 pr-2.5 transition-colors hover:border-line-strong"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest text-xs font-bold text-soft">
          {getInitials(displayName)}
        </span>
        <span className="hidden max-w-[140px] truncate text-sm font-semibold text-ink md:block">{displayName}</span>
        <ChevronDown className={cn('h-4 w-4 text-ink-faint transition-transform duration-200', open && 'rotate-180')} aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-2xl border border-line bg-surface p-2 shadow-lift"
          >
            <div className="border-b border-line px-3 pb-3 pt-2">
              <p className="truncate text-sm font-bold text-ink">{displayName}</p>
              <p className="truncate text-xs text-ink-faint">{user.email}</p>
            </div>
            <div className="py-1.5">
              <Link to="/settings" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
                <Settings className="h-4 w-4" aria-hidden />
                Settings
              </Link>
              <Link to="/history" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
                <History className="h-4 w-4" aria-hidden />
                Scan history
              </Link>
            </div>
            <div className="border-t border-line pt-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={handleSignOut}
                disabled={signingOut}
                className={cn(itemClass, 'text-danger hover:bg-danger-soft hover:text-danger disabled:opacity-60')}
              >
                <LogOut className="h-4 w-4" aria-hidden />
                {signingOut ? 'Signing out…' : 'Log out'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
