-- 024_listing_submissions_columns.sql — fix for E2E bug 2 (POST /api/listings/{event|property|campsite} returned 500:
-- "Could not find the 'contact_name' column of 'listing_submissions'").
-- NOT YET RUN. Review, then apply in the Supabase SQL editor only after Pratik approves.
--
-- Why: migration 009 created listing_submissions with an older, narrower layout (name, trek_name, trek_type, price …).
-- The backend (listings.controller.js / listingMapper.js) and the "List your event / property / campsite" forms use the
-- wider layout (submission_type, title, subtype, contact_name, event_date, …). The live table already has those columns
-- (migration 011's seed inserts into them), but a database rebuilt from the migration files did not, so every public
-- listing submission failed with 500.
--
-- Safe to run on the live database: it only ADDS missing columns/indexes (add column if not exists), changes no existing
-- column, deletes nothing and touches no rows. The old 009 columns are left in place.

alter table public.listing_submissions add column if not exists submission_type    text;
alter table public.listing_submissions add column if not exists title              text;
alter table public.listing_submissions add column if not exists subtype            text;
alter table public.listing_submissions add column if not exists contact_name       text;
alter table public.listing_submissions add column if not exists event_date         date;
alter table public.listing_submissions add column if not exists expected_attendees integer;
alter table public.listing_submissions add column if not exists entry_fee          numeric;
alter table public.listing_submissions add column if not exists capacity           integer;
alter table public.listing_submissions add column if not exists price_per_night    numeric;
alter table public.listing_submissions add column if not exists price_per_person   numeric;
alter table public.listing_submissions add column if not exists nearby_trek        text;
alter table public.listing_submissions add column if not exists pickup_points      jsonb not null default '[]'::jsonb;
alter table public.listing_submissions add column if not exists amenities          jsonb not null default '[]'::jsonb;
alter table public.listing_submissions add column if not exists facilities         jsonb not null default '[]'::jsonb;
alter table public.listing_submissions add column if not exists images             jsonb not null default '[]'::jsonb;
alter table public.listing_submissions add column if not exists admin_notes        text;
alter table public.listing_submissions add column if not exists reviewed_at        timestamptz;
alter table public.listing_submissions add column if not exists published_at       timestamptz;

create index if not exists listing_submissions_type_status_idx on public.listing_submissions (submission_type, status);
