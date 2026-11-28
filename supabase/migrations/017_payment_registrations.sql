-- ============================================================
-- Migration 017: payment_registrations + private bucket payment-proofs
-- t81u (Pratik): customers who paid directly by bank transfer / UPI register the payment on /register;
-- admin verifies it in Admin → Payment Registrations.
--
-- NOT RUN YET. Needs Pratik's OK. Run once in Supabase SQL editor (project qgiqkxxwoyqffozgvbvi)
-- BEFORE the PR that adds /register is merged/deployed. Safe to re-run (if not exists / on conflict do nothing).
-- Creates only new objects. Changes no existing table, row or bucket. Deletes nothing.
-- Requires public.set_updated_at() from 001_customers.sql (already in production).
-- ============================================================

create table if not exists public.payment_registrations (
  id                  uuid        primary key default gen_random_uuid(),
  reference           text        not null unique,             -- GTP-YYMMDD-XXXXX shown to the customer
  status              text        not null default 'pending_verification'
                                  check (status in ('pending_verification','verified','rejected')),

  -- what they paid for (copied from the event at submit time; price is computed by the server)
  event_slug          text        not null,
  event_name          text        not null,
  event_type          text,
  price_option        text        not null,                    -- e.g. "Pune", "Mumbai", "3AC"
  price_option_label  text,
  batch_date          date,
  batch_label         text,
  date_was_typed      boolean     not null default false,      -- customer chose "Other date"
  pickup_point        text,
  price_per_person    numeric(12,2) not null,
  participants_count  integer     not null check (participants_count between 1 and 20),
  total_amount        numeric(12,2) not null,

  -- payment
  amount_paid         numeric(12,2) not null check (amount_paid > 0),
  payment_date        date        not null,
  payment_mode        text        not null check (payment_mode in ('UPI','NEFT','IMPS','Bank transfer','Cash')),
  utr                 text        not null,                    -- upper-cased, no spaces
  screenshot_path     text,                                    -- object path in bucket payment-proofs (private)

  -- lead participant
  full_name           text        not null,
  mobile              text        not null,
  whatsapp            text,
  email               text,
  age                 integer,
  gender              text,
  city                text,
  emergency_name      text,
  emergency_phone     text,
  medical_conditions  text,
  notes               text,
  participants        jsonb       not null default '[]',       -- extra participants [{name, age, gender, mobile}]
  consent_at          timestamptz not null,
  user_agent          text,

  -- admin verification (no delete in the app; status only)
  admin_note          text,
  verified_by         text,
  verified_at         timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index if not exists payment_registrations_utr_key     on public.payment_registrations (utr);
create index if not exists payment_registrations_status_idx         on public.payment_registrations (status);
create index if not exists payment_registrations_event_date_idx     on public.payment_registrations (event_slug, batch_date);
create index if not exists payment_registrations_mobile_idx         on public.payment_registrations (mobile);
create index if not exists payment_registrations_created_at_idx     on public.payment_registrations (created_at desc);

drop trigger if exists payment_registrations_set_updated_at on public.payment_registrations;
create trigger payment_registrations_set_updated_at
  before update on public.payment_registrations
  for each row execute function public.set_updated_at();

-- Only the backend (service role) may read or write. No public / anon access at all.
alter table public.payment_registrations enable row level security;
revoke all on public.payment_registrations from anon, authenticated;

-- Private bucket for payment screenshots (JPEG only, max 2 MB). Not public: admin sees them via 5-minute signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 2097152, array['image/jpeg'])
on conflict (id) do nothing;
