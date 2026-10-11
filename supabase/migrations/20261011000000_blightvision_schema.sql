-- ============================================================================
-- BlightVision – database schema, Row Level Security, and private image storage
--
-- Run this once in the Supabase SQL Editor (or with `supabase db push`).
-- It is idempotent: running it again will not duplicate or destroy anything.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  created_at  timestamptz not null default now(),
  constraint profiles_full_name_length check (full_name is null or char_length(full_name) <= 120)
);

comment on table public.profiles is 'One row per BlightVision user, created automatically at sign-up.';

-- ---------------------------------------------------------------------------
-- 2. scan_history
--    Probabilities are stored exactly as the model returned them, on a 0–1 scale.
-- ---------------------------------------------------------------------------
create table if not exists public.scan_history (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  image_path                text not null,
  predicted_disease         text not null,
  confidence                double precision not null,
  early_blight_probability  double precision not null,
  late_blight_probability   double precision not null,
  scanned_at                timestamptz not null default now(),

  constraint scan_history_image_path_unique unique (image_path),
  -- The stored image must live in the owner's own folder: "<user_id>/<file>".
  constraint scan_history_image_path_owner check (image_path like user_id::text || '/%'),
  constraint scan_history_disease_valid check (predicted_disease in ('Early Blight', 'Late Blight')),
  constraint scan_history_confidence_range check (confidence between 0 and 1),
  constraint scan_history_early_range check (early_blight_probability between 0 and 1),
  constraint scan_history_late_range check (late_blight_probability between 0 and 1),
  -- Confidence is the probability of the predicted (highest-scoring) class.
  constraint scan_history_confidence_matches check (
    abs(confidence - greatest(early_blight_probability, late_blight_probability)) < 1e-6
  ),
  constraint scan_history_prediction_matches check (
    (predicted_disease = 'Early Blight' and early_blight_probability >= late_blight_probability)
    or (predicted_disease = 'Late Blight' and late_blight_probability >= early_blight_probability)
  )
);

comment on table public.scan_history is 'Saved classifications. Each row belongs to exactly one user.';
comment on column public.scan_history.image_path is 'Object path inside the private "potato-leaf-scans" storage bucket.';
comment on column public.scan_history.confidence is 'Probability (0–1) of the predicted class.';

create index if not exists scan_history_user_scanned_at_idx on public.scan_history (user_id, scanned_at desc);
create index if not exists scan_history_user_disease_idx on public.scan_history (user_id, predicted_disease);

-- ---------------------------------------------------------------------------
-- 3. Create a profile automatically when a user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(left(trim(new.raw_user_meta_data ->> 'full_name'), 120), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Back-fill profiles for any accounts created before this migration.
insert into public.profiles (id, full_name)
select u.id, nullif(left(trim(u.raw_user_meta_data ->> 'full_name'), 120), '')
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Row Level Security – users can only reach their own rows
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.scan_history enable row level security;

-- Signed-out visitors get nothing; signed-in users get only what the policies allow.
revoke all on public.profiles from anon;
revoke all on public.scan_history from anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.scan_history to authenticated;

drop policy if exists "Profiles: read own" on public.profiles;
create policy "Profiles: read own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Profiles: create own" on public.profiles;
create policy "Profiles: create own"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Profiles: update own" on public.profiles;
create policy "Profiles: update own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Scans: read own" on public.scan_history;
create policy "Scans: read own"
  on public.scan_history for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Scans: create own" on public.scan_history;
create policy "Scans: create own"
  on public.scan_history for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Scans: delete own" on public.scan_history;
create policy "Scans: delete own"
  on public.scan_history for delete to authenticated
  using ((select auth.uid()) = user_id);

-- No UPDATE policy on scan_history: saved model outputs are immutable.

-- ---------------------------------------------------------------------------
-- 5. Private storage bucket for scan images
--    Limited to 10 MB and to JPEG / PNG / WEBP, matching the app's upload rules.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'potato-leaf-scans',
  'potato-leaf-scans',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Objects are stored as "<user_id>/<uuid>.<ext>"; the first folder must be the caller's id.
drop policy if exists "Scan images: read own" on storage.objects;
create policy "Scan images: read own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'potato-leaf-scans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Scan images: upload own" on storage.objects;
create policy "Scan images: upload own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'potato-leaf-scans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Scan images: delete own" on storage.objects;
create policy "Scan images: delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'potato-leaf-scans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
