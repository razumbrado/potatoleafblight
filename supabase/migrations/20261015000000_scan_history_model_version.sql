-- ============================================================================
-- BlightVision – record which model produced each saved scan
--
-- Adds two nullable columns to scan_history. Existing rows are left untouched:
-- a NULL model_version marks a scan saved with the earlier Teachable Machine
-- model, so the app can label it as a legacy result instead of a Random Forest
-- result. No tables, policies, buckets, or data are dropped or recreated.
--
-- Run this once in the Supabase SQL Editor (or with `supabase db push`).
-- It is idempotent.
-- ============================================================================

alter table public.scan_history add column if not exists model_name text;
alter table public.scan_history add column if not exists model_version text;

comment on column public.scan_history.model_name is 'Algorithm that produced the prediction, e.g. "Random Forest". NULL = legacy Teachable Machine scan.';
comment on column public.scan_history.model_version is 'Version of the trained model (from backend/models/model_info.json). NULL = legacy Teachable Machine scan.';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'scan_history_model_name_length') then
    alter table public.scan_history
      add constraint scan_history_model_name_length check (model_name is null or char_length(model_name) <= 60);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'scan_history_model_version_length') then
    alter table public.scan_history
      add constraint scan_history_model_version_length check (model_version is null or char_length(model_version) <= 60);
  end if;
end;
$$;
