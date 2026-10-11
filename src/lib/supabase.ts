import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// The client needs the bare project URL. The dashboard also shows the Data API URL
// (ending in /rest/v1/), which is easy to paste by mistake, so any path is dropped here.
function projectOrigin(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return trimmed;
  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed;
  }
}

const url = projectOrigin(import.meta.env.VITE_SUPABASE_URL);
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

const looksLikePlaceholder = (value?: string) => !value || /your-project-ref|your-publishable/i.test(value);

/** True when both environment variables are present and not the .env.example placeholders. */
export const isSupabaseConfigured = !looksLikePlaceholder(url) && !looksLikePlaceholder(publishableKey);

export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your .env file and restart the dev server.';

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url!, publishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/** Returns the client or throws a clear, user-presentable error when env vars are missing. */
export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) throw new Error(SUPABASE_NOT_CONFIGURED_MESSAGE);
  return supabase;
}

export const SCAN_BUCKET = 'potato-leaf-scans';
