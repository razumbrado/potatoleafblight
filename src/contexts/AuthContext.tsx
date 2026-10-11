import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, requireSupabase, supabase } from '@/lib/supabase';
import { fetchProfile, upsertProfile } from '@/services/profile';
import { clearSignedUrlCache } from '@/services/scans';
import type { Profile } from '@/types';
import { getErrorMessage } from '@/utils/format';

interface AuthContextValue {
  /** False when the Supabase environment variables are missing. */
  configured: boolean;
  /** True until the persisted session has been checked. */
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  displayName: string;
  /** True after the user arrives from a password-recovery email link. */
  isPasswordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateFullName: (fullName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyAuthError(error: unknown): Error {
  const message = getErrorMessage(error);
  if (/invalid login credentials/i.test(message)) return new Error('Incorrect email or password.');
  if (/email not confirmed/i.test(message)) {
    return new Error('Please confirm your email address first — check your inbox for the confirmation link.');
  }
  if (/user already registered/i.test(message)) return new Error('An account with this email already exists. Try signing in.');
  if (/rate limit|too many requests|security purposes/i.test(message)) {
    return new Error('Too many attempts. Please wait a minute and try again.');
  }
  if (/different from the old password/i.test(message)) {
    return new Error('Your new password must be different from your current password.');
  }
  return new Error(message);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data.session);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
        setProfile(null);
        clearSignedUrlCache();
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;
  const userId = user?.id;

  // Load the profile whenever the signed-in user changes.
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    let active = true;
    fetchProfile(userId)
      .then((row) => {
        if (active) setProfile(row);
      })
      .catch(() => {
        // The name falls back to auth metadata; Settings surfaces profile errors on save.
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await requireSupabase().auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } catch (error) {
      throw friendlyAuthError(error);
    }
  }, []);

  const signUp = useCallback(async (fullName: string, email: string, password: string) => {
    try {
      const { data, error } = await requireSupabase().auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/detect`,
        },
      });
      if (error) throw error;
      // With email confirmation on, Supabase returns an identity-less user for existing addresses.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        throw new Error('An account with this email already exists. Try signing in.');
      }
      return { needsEmailConfirmation: !data.session };
    } catch (error) {
      throw friendlyAuthError(error);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await requireSupabase().auth.signOut();
      if (error) throw error;
    } catch (error) {
      throw friendlyAuthError(error);
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      const { error } = await requireSupabase().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (error) {
      throw friendlyAuthError(error);
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    try {
      const { error } = await requireSupabase().auth.updateUser({ password });
      if (error) throw error;
      setIsPasswordRecovery(false);
    } catch (error) {
      throw friendlyAuthError(error);
    }
  }, []);

  const updateFullName = useCallback(
    async (fullName: string) => {
      if (!userId) throw new Error('You need to be signed in to update your profile.');
      try {
        const row = await upsertProfile(userId, fullName);
        setProfile(row);
        // Keep auth metadata in sync so the name is available before the profile row loads.
        await requireSupabase().auth.updateUser({ data: { full_name: fullName.trim() } });
      } catch (error) {
        throw friendlyAuthError(error);
      }
    },
    [userId],
  );

  const displayName = useMemo(() => {
    const metaName = typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '';
    return profile?.full_name?.trim() || metaName.trim() || user?.email?.split('@')[0] || 'Guest';
  }, [profile, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      session,
      user,
      profile,
      displayName,
      isPasswordRecovery,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
      updateFullName,
    }),
    [loading, session, user, profile, displayName, isPasswordRecovery, signIn, signUp, signOut, sendPasswordReset, updatePassword, updateFullName],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
