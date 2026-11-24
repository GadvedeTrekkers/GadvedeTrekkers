-- 015_site_settings.sql — FR-FE-89 / SEC-41: single admin-managed WhatsApp number.
-- NOT YET RUN. Review, then apply in the Supabase SQL editor after Pratik approves.
-- Read publicly via GET /api/settings/contact (backend, service role); changed only by Super Admin via
-- PUT /api/settings/contact, which writes an activity_logs row (action = 'SETTING_UPDATE') for every change.
create table if not exists public.site_settings (
  key        text        primary key,
  value      jsonb       not null,
  updated_by text,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;   -- no direct client access; backend only

insert into public.site_settings (key, value, updated_by)
values ('contact.whatsapp_number', '{"number": "919856112727"}'::jsonb, 'migration-015')
on conflict (key) do nothing;

-- Data clean-up (review before use — NOT executed): products/listings saved from the admin panel may still carry the
-- retired booking number in JSON/text fields (e.g. bookingWhatsapp, bookingNote, paymentDetails). Find them with:
--   select id, name from public.products where row_to_json(products)::text like '%' || '86058' || '66155' || '%';
