import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PageTransition } from '@/components/common/PageTransition';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useModel } from '@/contexts/ModelContext';
import { cn } from '@/utils/cn';

const COLLAPSE_KEY = 'blightvision-sidebar-collapsed';

export function AppLayout() {
  const location = useLocation();
  const { ensureLoaded } = useModel();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });

  // Check the model server as soon as someone enters the application shell.
  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  // App pages get pill buttons in the content palette; set on <body> so dialogs pick it up too.
  useEffect(() => {
    document.body.classList.add('app-theme');
    return () => document.body.classList.remove('app-theme');
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    // The drawer only exists below the lg breakpoint; never keep the page locked on a wider screen.
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onDesktop = () => desktop.matches && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onDesktop);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onDesktop);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const toggleCollapse = () => {
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, value ? '0' : '1');
      } catch {
        // Not persisted; harmless.
      }
      return !value;
    });
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'no-print fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-300 ease-out lg:block',
          collapsed ? 'w-20' : 'w-[272px]',
        )}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
      </aside>

      {/* Mobile drawer. Always mounted and driven by CSS, so a closed drawer can never be left
          behind as an invisible layer that swallows taps. */}
      <div
        className={cn(
          'no-print fixed inset-0 z-50 lg:hidden',
          drawerOpen ? 'visible' : 'pointer-events-none invisible [transition:visibility_0s_linear_300ms]',
        )}
        aria-hidden={!drawerOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-forest/60 backdrop-blur-sm transition-opacity duration-300',
            drawerOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 w-[86%] max-w-[300px] shadow-lift transition-transform duration-300 ease-out',
            drawerOpen ? 'translate-x-0' : '-translate-x-full',
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <Sidebar collapsed={false} onNavigate={() => setDrawerOpen(false)} onClose={() => setDrawerOpen(false)} />
        </aside>
      </div>

      <div className={cn('flex min-h-screen min-w-0 flex-col transition-[padding] duration-300 ease-out', collapsed ? 'lg:pl-20' : 'lg:pl-[272px]', 'print:!pl-0')}>
        <Topbar onOpenMenu={() => setDrawerOpen(true)} />
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
        <footer className="no-print border-t border-line px-4 py-5 text-center text-xs text-ink-faint sm:px-6 lg:px-8">
          BlightVision provides model predictions for educational and decision-support use — not a confirmed plant disease diagnosis.
        </footer>
      </div>
    </div>
  );
}
