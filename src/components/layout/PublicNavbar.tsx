import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { buttonStyles } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';

const links = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#diseases', label: 'Diseases' },
];

export function PublicNavbar() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-all duration-300',
        scrolled || open ? 'border-b border-white/10 bg-forest/90 shadow-lift backdrop-blur-md' : 'bg-transparent',
      )}
    >
      <div className="container flex h-[72px] items-center justify-between gap-4">
        <Link to="/" className="rounded-xl" aria-label="BlightVision home">
          <Logo tone="onDark" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Page sections">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <Link to="/about" className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white">
            About
          </Link>
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          {user ? (
            <Link to="/detect" className={buttonStyles({ variant: 'light' })}>
              Open App
            </Link>
          ) : (
            <>
              <Link to="/login" className={buttonStyles({ variant: 'glass' })}>
                Sign In
              </Link>
              <Link to="/register" className={buttonStyles({ variant: 'light' })}>
                Create Account
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 text-white md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden md:hidden"
          >
            <nav className="container flex flex-col gap-1 pb-5" aria-label="Mobile">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-base font-semibold text-white/85 hover:bg-white/10"
                >
                  {link.label}
                </a>
              ))}
              <Link to="/about" className="rounded-xl px-3 py-3 text-base font-semibold text-white/85 hover:bg-white/10">
                About
              </Link>
              <div className="mt-3 grid gap-2.5">
                {user ? (
                  <Link to="/detect" className={buttonStyles({ variant: 'light', size: 'lg' })}>
                    Open App
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className={buttonStyles({ variant: 'light', size: 'lg' })}>
                      Create Account
                    </Link>
                    <Link to="/login" className={buttonStyles({ variant: 'glass', size: 'lg' })}>
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
