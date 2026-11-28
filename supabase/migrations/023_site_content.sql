-- 023_site_content.sql — Pratik t129u: "Nothing in site code; everything managed from admin."
-- NOT YET RUN. Review, then apply in the Supabase SQL editor only after Pratik approves.
--
-- One row per site-content section (home hero, headline numbers, testimonials, trust badges, About / FAQ / Terms /
-- Privacy / Cancellation pages …). The list of allowed keys and their fields lives in shared/siteContent.js.
--   draft      = what the admin is editing (never shown publicly)
--   published  = what the public site shows (NULL = section hidden)
-- Read publicly ONLY through GET /api/site-content (backend, service role), which returns published values.
-- Written ONLY by Super Admin / Admin through /api/site-content/admin/* — every change writes an activity_logs row
-- (SITE_CONTENT_DRAFT / SITE_CONTENT_PUBLISH / SITE_CONTENT_HIDE); if that audit write fails the change is reverted.
-- No delete route and no export exist. This migration inserts NO content: every section starts empty and hidden.

create table if not exists public.site_content (
  key           text        primary key,
  draft         jsonb,
  published     jsonb,
  updated_by    text,
  updated_at    timestamptz not null default now(),
  published_by  text,
  published_at  timestamptz,
  constraint site_content_key_format check (key ~ '^[a-z]+\.[A-Za-z]+$'),
  constraint site_content_draft_is_object check (draft is null or jsonb_typeof(draft) = 'object'),
  constraint site_content_published_is_object check (published is null or jsonb_typeof(published) = 'object')
);

alter table public.site_content enable row level security;
revoke all on public.site_content from anon, authenticated;   -- no direct client access; backend (service role) only

comment on table public.site_content is 'Admin-managed public site copy (t129u). draft = editing, published = live (NULL hides). Backend-only access.';
