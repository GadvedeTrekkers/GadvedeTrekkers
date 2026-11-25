-- 016_meta_webhooks.sql — Meta (Instagram DMs/comments, Facebook Page lead ads) webhook storage.
-- NOT YET RUN. RLS on, no anon/authenticated access (written by the backend service role via /api/v1/webhooks/meta).
create table if not exists public.meta_webhook_events (
  id bigint generated always as identity primary key,
  dedupe_key text not null unique,                 -- ig_msg:<mid> | ig_comment:<id> | leadgen:<leadgen_id> | <kind>:<sha>
  object text not null, event_type text not null,
  payload jsonb not null,
  status text not null default 'received' check (status in ('received','processed','error')),
  error text,
  received_at timestamptz not null default now(), processed_at timestamptz
);

create table if not exists public.instagram_messages (
  id uuid primary key default gen_random_uuid(),
  mid text not null unique,
  ig_account_id text, sender_id text, recipient_id text,
  text text, attachments jsonb, is_echo boolean not null default false,
  sent_at timestamptz, created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new','replied','closed'))
);

create table if not exists public.instagram_comments (
  id uuid primary key default gen_random_uuid(),
  comment_id text not null unique,
  ig_account_id text, media_id text, media_product_type text, parent_id text,
  from_id text, from_username text, text text,
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new','replied','hidden','closed'))
);

create table if not exists public.meta_leads (
  id uuid primary key default gen_random_uuid(),
  leadgen_id text not null unique,
  form_id text, page_id text, ad_id text, adgroup_id text, created_time timestamptz,
  name text, phone text, email text, trek_interest text, answers jsonb,
  status text not null default 'new' check (status in ('new','fetch_failed','contacted','converted','closed')),
  fetch_error text, assignee text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array['meta_webhook_events','instagram_messages','instagram_comments','meta_leads'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
