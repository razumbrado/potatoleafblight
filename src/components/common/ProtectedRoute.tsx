import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SupabaseSetupNotice } from './Notice';
import { PageHeader } from './PageHeader';

/** Guards routes that need a signed-in user. Remembers where the visitor was heading. */
export function ProtectedRoute() {
  const { user, loading, configured } = useAuth();
  const location = useLocation();

  if (!configured) {
    return (
      <div>
        <PageHeader title="Cloud features unavailable" description="This page stores and reads data from your Supabase project." />
        <SupabaseSetupNotice />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Checking your session">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return <Outlet />;
}
