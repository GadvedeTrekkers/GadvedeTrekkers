-- ============================================================
-- Migration 021: Instagram + WhatsApp integrations
--   1. enquiries: where a lead came from (website / Instagram DM / WhatsApp) + who it is on that channel
--   2. whatsapp_messages: incoming WhatsApp Cloud API messages (like instagram_messages from 016)
--   3. crm_message_log: allow WhatsApp Cloud API sends (booking confirmation, payment verified, pre-trip reminder)
--
-- NOT RUN YET. Needs Pratik's OK. Run once in the Supabase SQL editor AFTER 016 and 020. Safe to re-run.
-- Adds columns / a table / indexes and widens two CHECK constraints on crm_message_log (020, a new and still empty
-- table). Changes no existing row and deletes no data. Existing enquiries get source = 'website'.
-- ============================================================

-- 1. Lead source on enquiries
alter table public.enquiries add column if not exists source          text not null default 'website';
alter table public.enquiries add column if not exists source_ref      text;          -- IG user id (IGSID) or WhatsApp id (91XXXXXXXXXX)
alter table public.enquiries add column if not exists source_handle   text;          -- @username (Instagram), when known
alter table public.enquiries add column if not exists last_message_at timestamptz;   -- latest DM / WhatsApp message

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'enquiries_source_check') then
    alter table public.enquiries add constraint enquiries_source_check check (source in ('website','instagram_dm','whatsapp'));
  end if;
end $$;
create index if not exists enquiries_source_ref_idx on public.enquiries (source, source_ref);

-- 2. Incoming WhatsApp messages (written by the backend webhook; deduped by wamid)
create table if not exists public.whatsapp_messages (
  id              uuid        primary key default gen_random_uuid(),
  wamid           text        not null unique,
  wa_id           text,                                   -- sender, 91XXXXXXXXXX
  profile_name    text,
  phone_number_id text,                                   -- our Cloud API number that received it
  type            text,
  text            text,
  sent_at         timestamptz,
  created_at      timestamptz not null default now(),
  status          text        not null default 'new' check (status in ('new','replied','closed'))
);
create index if not exists whatsapp_messages_wa_id_idx on public.whatsapp_messages (wa_id);
alter table public.whatsapp_messages enable row level security;
revoke all on public.whatsapp_messages from anon, authenticated;

-- 3. WhatsApp Cloud API sends in the CRM message log (same at-most-once idempotency_key as 020)
alter table public.crm_message_log add column if not exists template_name       text;
alter table public.crm_message_log add column if not exists provider_message_id text;   -- wamid returned by Meta
alter table public.crm_message_log add column if not exists delivery_status     text;   -- sent / delivered / read / failed (webhook)
create index if not exists crm_message_log_provider_message_id_idx on public.crm_message_log (provider_message_id);

alter table public.crm_message_log drop constraint if exists crm_message_log_automation_check;
alter table public.crm_message_log add constraint crm_message_log_automation_check
  check (automation in ('enquiryFollowup','preTrip','postTrip','bookingConfirmation','paymentVerified'));
alter table public.crm_message_log drop constraint if exists crm_message_log_channel_check;
alter table public.crm_message_log add constraint crm_message_log_channel_check
  check (channel in ('email','whatsapp','whatsapp_api'));
