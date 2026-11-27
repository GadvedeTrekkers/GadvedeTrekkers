-- ============================================================
-- Migration 022: blog posts (Admin → Blog, AI article writer, public /blog and /blog/:slug)
--
-- NOT RUN YET. Needs Pratik's OK. Run once in the Supabase SQL editor (project qgiqkxxwoyqffozgvbvi).
-- Safe to re-run (if not exists). Creates only new objects. Changes no existing table or row. Deletes nothing.
-- Requires public.set_updated_at() (migration 001).
-- Numbering: 019 is left free for the proposed Settings hub (encrypted API keys); 020 = CRM automations;
-- 021 = social integrations (feat/insta-whatsapp, not merged yet). So this is 022.
--
-- Status: 'draft' (default, never public) → 'published' (public) → 'archived' (hidden, kept).
-- No delete in the app: posts are unpublished or archived instead.
-- Access: RLS on, no policies, anon/authenticated revoked → only the backend (service role) reads/writes.
-- The public site reads published posts through GET /api/blog/posts (backend filters status = 'published').
-- ============================================================

create table if not exists public.blog_posts (
  id                 uuid        primary key default gen_random_uuid(),
  slug               text        not null,
  title              text        not null check (char_length(title) between 1 and 160),
  meta_title         text        check (meta_title is null or char_length(meta_title) <= 80),
  meta_description   text        check (meta_description is null or char_length(meta_description) <= 200),
  excerpt            text,
  content            text        not null default '',          -- safe Markdown subset (shared/blogContent.js)
  faq                jsonb       not null default '[]'::jsonb, -- [{q, a}]
  keywords           text[]      not null default '{}',
  category           text,
  cover_image_url    text,
  cover_image_alt    text,
  author_name        text        not null default 'Gadvede Trekkers',
  related_trip_slug  text,                                     -- products.slug (soft link, no FK)
  status             text        not null default 'draft' check (status in ('draft','published','archived')),
  ai_generated       boolean     not null default false,
  ai_model           text,
  published_at       timestamptz,
  created_by         text,
  updated_by         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint blog_posts_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80)
);

create unique index if not exists blog_posts_slug_key on public.blog_posts (slug);
create index if not exists blog_posts_status_published_idx on public.blog_posts (status, published_at desc);
create index if not exists blog_posts_updated_idx on public.blog_posts (updated_at desc);

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

alter table public.blog_posts enable row level security;
revoke all on public.blog_posts from anon, authenticated;

-- Check after running (read only):
--   select status, count(*) from public.blog_posts group by status;
