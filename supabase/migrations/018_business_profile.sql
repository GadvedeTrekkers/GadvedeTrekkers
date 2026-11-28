-- ============================================================
-- Migration 018: Business profile (Admin → Profile Setup) — Pratik t84u / t85u
--
-- NOT RUN YET. Needs Pratik's OK. Run once in the Supabase SQL editor (project qgiqkxxwoyqffozgvbvi)
-- BEFORE/WITH the PR that adds Admin → Profile Setup. Safe to re-run (if not exists / on conflict do nothing).
-- Creates only new objects. Changes no existing row, table or bucket. Deletes nothing.
--
-- Data model: NO new table. The profile is one JSON value in public.site_settings (from 015):
--   key 'business.profile'        → company/owner/address/contact/emails/online/billing/bank/policies/theme/images
--   key 'billing.receipt_counter' → {"next": 1}   (shown read-only as the next receipt number)
--   key 'contact.whatsapp_number' → unchanged, still the single WhatsApp number (015).
-- site_settings has RLS on and no anon/authenticated access: only the backend (service role) reads it, and the public
-- endpoint GET /api/settings/profile/public returns display-safe fields only (no bank details, no internal emails).
-- ============================================================

-- 1) site_settings — identical to 015 (no-op when 015 has already been run).
create table if not exists public.site_settings (
  key        text        primary key,
  value      jsonb       not null,
  updated_by text,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;

insert into public.site_settings (key, value, updated_by)
values ('contact.whatsapp_number', '{"number": "919856112727"}'::jsonb, 'migration-018')
on conflict (key) do nothing;

insert into public.site_settings (key, value, updated_by)
values ('billing.receipt_counter', '{"next": 1}'::jsonb, 'migration-018')
on conflict (key) do nothing;

-- 2) PRIVATE bucket for the payment QR and the MTDC certificate (JPEG/PNG, max 2 MB).
--    Admin sees them through 5-minute signed URLs only. The logo and favicon go to the existing PUBLIC bucket
--    'site-images' under branding/ (no change to that bucket here).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-docs', 'business-docs', false, 2097152, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- 3) Check (read-only): the public bucket must accept PNG for transparent logos.
--    If allowed_mime_types is not null and lacks image/png, ask before changing it:
--      select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'site-images';
