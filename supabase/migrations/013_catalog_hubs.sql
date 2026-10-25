-- ============================================================
-- Migration 013: Catalog hubs + trip fields on products/batches
-- Extends the existing products + product_batches model.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- Run AFTER 012_api_alignment.sql
-- ============================================================

begin;

create table if not exists public.catalog_hubs (
  slug              text        primary key,
  name              text        not null,
  hub_kind          text        not null check (hub_kind in ('city', 'region', 'experience', 'seasonal')),
  description       text,
  sort_order        integer     not null default 0,
  is_active         boolean     not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists catalog_hubs_set_updated_at on public.catalog_hubs;
create trigger catalog_hubs_set_updated_at
  before update on public.catalog_hubs
  for each row execute function public.set_updated_at();

insert into public.catalog_hubs (slug, name, hub_kind, description, sort_order)
values
  ('pune-weekend',   'Pune Weekend',          'city',       'Saturday and Sunday departures that start in Pune.', 10),
  ('mumbai-weekend', 'Mumbai Weekend',        'city',       'Weekend batches that leave from Mumbai.', 20),
  ('himachal',       'Himachal',              'region',     'Mountain trips across Himachal Pradesh.', 30),
  ('uttarakhand',    'Uttarakhand',           'region',     'River camps and Himalayan trails in Uttarakhand.', 40),
  ('rajasthan',      'Rajasthan',             'region',     'Desert nights and fort circuits in Rajasthan.', 50),
  ('kerala-south',   'Kerala & South',        'region',     'Forest stays and southern circuits, including Kerala.', 60),
  ('camping',        'Camping',               'experience', 'Lakeside, ridge, and forest camps run by Gadvede Trekkers.', 70),
  ('backpacking',    'Backpacking',           'experience', 'Multi-day trips with a shared stay and a light pack.', 80),
  ('seasonal-nye',   'Seasonal & New Year',   'seasonal',   'Festival weekends and New Year batches.', 90)
on conflict (slug) do update
  set name = excluded.name,
      hub_kind = excluded.hub_kind,
      description = excluded.description,
      sort_order = excluded.sort_order,
      is_active = true;

alter table public.products
  add column if not exists hub_slug    text references public.catalog_hubs (slug) on update cascade on delete set null,
  add column if not exists destination text,
  add column if not exists category    text,
  add column if not exists media       jsonb not null default '[]'::jsonb;

create index if not exists products_hub_slug_idx
  on public.products (hub_slug);

alter table public.product_batches
  add column if not exists end_date        date,
  add column if not exists departure_city  text;

-- Tag existing rows only when a hub has not been chosen yet.
update public.products
set hub_slug = 'camping',
    category = coalesce(category, 'Camping'),
    destination = coalesce(destination, location)
where hub_slug is null
  and product_type = 'camping';

update public.products
set hub_slug = 'himachal',
    category = coalesce(category, 'Himachal'),
    destination = coalesce(destination, location)
where hub_slug is null
  and lower(coalesce(region, '')) = 'himachal';

update public.products
set hub_slug = 'uttarakhand',
    category = coalesce(category, 'Uttarakhand'),
    destination = coalesce(destination, location)
where hub_slug is null
  and lower(coalesce(region, '')) = 'uttarakhand';

update public.products
set hub_slug = 'rajasthan',
    category = coalesce(category, 'Rajasthan'),
    destination = coalesce(destination, location)
where hub_slug is null
  and lower(coalesce(region, '')) = 'rajasthan';

update public.products
set hub_slug = 'kerala-south',
    category = coalesce(category, 'Kerala & South'),
    destination = coalesce(destination, location)
where hub_slug is null
  and lower(coalesce(region, '')) in ('kerala', 'southindia');

update public.products
set hub_slug = 'pune-weekend',
    category = coalesce(category, 'Pune Weekend'),
    destination = coalesce(destination, location)
where hub_slug is null
  and product_type = 'trek'
  and (
    lower(coalesce(region, '')) = 'pune'
    or location ilike '%pune%'
    or location ilike '%lonavala%'
  );

update public.products
set hub_slug = 'mumbai-weekend',
    category = coalesce(category, 'Mumbai Weekend'),
    destination = coalesce(destination, location)
where hub_slug is null
  and product_type = 'trek'
  and (
    lower(coalesce(region, '')) = 'mumbai'
    or location ilike '%mumbai%'
  );

alter table public.catalog_hubs enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'catalog_hubs'
      and policyname = 'anon_read_catalog_hubs'
  ) then
    create policy "anon_read_catalog_hubs"
      on public.catalog_hubs
      for select to anon
      using (is_active = true);
  end if;
end $$;

commit;
