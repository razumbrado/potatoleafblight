import { Link, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeft, BarChart3, CloudCog, ScanLine } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { SupabaseSetupNotice } from '@/components/common/Notice';
import { PageTransition } from '@/components/common/PageTransition';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

const highlights = [
  { icon: ScanLine, title: 'Real model inference', text: 'A trained Random Forest classifies every image you analyze.' },
  { icon: CloudCog, title: 'Private cloud history', text: 'Saved scans and images are protected by row-level security.' },
  { icon: BarChart3, title: 'Live analytics', text: 'Charts are calculated from your own saved scan records.' },
];

export function AuthLayout() {
  const { configured } = useAuth();
  const location = useLocation();

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-hero-gradient lg:flex lg:flex-col lg:justify-between lg:p-12">
        <img src="/images/potato-leaves.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/70 to-forest/40" aria-hidden />
        <Link to="/" className="relative w-fit rounded-xl">
          <Logo tone="onDark" showTagline />
        </Link>
        <div className="relative">
          <h2 className="max-w-md text-4xl font-extrabold leading-tight text-white">
            Protect the crop with a clearer first look.
          </h2>
          <ul className="mt-10 space-y-6">
            {highlights.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-soft ring-1 ring-white/15">
                  <item.icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-bold text-white">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-white/65">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/45">Model predictions are decision support, not a confirmed diagnosis.</p>
      </aside>

      {/* Form panel */}
      <main className="flex min-w-0 flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="rounded-xl lg:hidden">
            <Logo />
          </Link>
          <Link
            to="/"
            className="hidden items-center gap-2 rounded-lg text-sm font-semibold text-ink-muted transition-colors hover:text-ink lg:inline-flex"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to home
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <PageTransition key={location.pathname} className="w-full max-w-[440px]">
            {!configured && <SupabaseSetupNotice className="mb-6" />}
            <Outlet />
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
