-- ============================================================
-- Migration 020: CRM automations — message log (idempotency) + opt-outs
-- Enquiry follow-ups, pre-trip reminder, post-trip welcome back + Google review (Admin → Automations).
--
-- NOT RUN YET. Needs Pratik's OK. Run once in the Supabase SQL editor (project qgiqkxxwoyqffozgvbvi) before the
-- automations are switched on. Safe to re-run (if not exists / on conflict do nothing).
-- Creates only new objects. Changes no existing table or row. Deletes nothing.
-- Requires public.site_settings (015, or re-created by 018) and public.set_updated_at() (001).
-- Settings themselves live in site_settings key 'crm.automations' (seeded below with everything OFF).
-- ============================================================

-- One row per message per person. idempotency_key is UNIQUE: the backend INSERTs the row before sending,
-- so the same message can never go out twice (even if two cron runs overlap).
create table if not exists public.crm_message_log (
  id               uuid        primary key default gen_random_uuid(),
  idempotency_key  text        not null,
  automation       text        not null check (automation in ('enquiryFollowup','preTrip','postTrip')),
  step             integer     not null default 1 check (step between 1 and 3),
  channel          text        not null check (channel in ('email','whatsapp')),
  status           text        not null check (status in ('sending','sent','failed','queued','sent_manual','skipped')),
  source_type      text        not null,                 -- enquiry | booking | payment_registration
  source_id        text        not null,
  recipient_name   text,
  recipient_email  text,
  recipient_phone  text,                                 -- 10 digits
  subject          text,
  body             text        not null,
  wa_link          text,                                 -- prefilled wa.me link (WhatsApp queue)
  trip_date        date,
  error_code       text,
  created_by       text        not null default 'cron',
  handled_by       text,                                 -- admin who marked a WhatsApp message sent/skipped
  sent_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index if not exists crm_message_log_idempotency_key on public.crm_message_log (idempotency_key);
create index if not exists crm_message_log_created_at_idx  on public.crm_message_log (created_at desc);
create index if not exists crm_message_log_queue_idx       on public.crm_message_log (channel, status);
create index if not exists crm_message_log_source_idx      on public.crm_message_log (source_type, source_id);

drop trigger if exists crm_message_log_set_updated_at on public.crm_message_log;
create trigger crm_message_log_set_updated_at
  before update on public.crm_message_log
  for each row execute function public.set_updated_at();

-- People who asked not to get follow-ups/reminders (email or 10-digit mobile). No delete in the app.
create table if not exists public.crm_opt_outs (
  id          uuid        primary key default gen_random_uuid(),
  contact     text        not null,                      -- lower-case email or 10-digit mobile
  channel     text        not null default 'all',
  source      text        not null default 'admin',      -- admin | email_link
  reason      text,
  created_by  text,
  created_at  timestamptz not null default now()
);
create unique index if not exists crm_opt_outs_contact_key on public.crm_opt_outs (contact);

-- Backend (service role) only. No public / anon access.
alter table public.crm_message_log enable row level security;
alter table public.crm_opt_outs    enable row level security;
revoke all on public.crm_message_log from anon, authenticated;
revoke all on public.crm_opt_outs    from anon, authenticated;

-- Default settings: every automation OFF. Does nothing if the key already exists.
insert into public.site_settings (key, value, updated_by)
values ('crm.automations', '{"version":1,"enquiryFollowup":{"enabled":false},"preTrip":{"enabled":false},"postTrip":{"enabled":false}}'::jsonb, 'migration-020')
on conflict (key) do nothing;
