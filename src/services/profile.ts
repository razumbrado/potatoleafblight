import { requireSupabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

/** Creates the profile row if the signup trigger has not (e.g. account predates the migration). */
export async function upsertProfile(userId: string, fullName: string): Promise<Profile> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, full_name: fullName.trim() }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}
