-- Masuk? Guardhouse Intel · Supabase/PostgreSQL schema
-- 直接在 Supabase SQL Editor 执行即可。

create extension if not exists pgcrypto;

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text not null,
  address text,
  latitude double precision,
  longitude double precision,
  difficulty_level smallint not null check (difficulty_level between 1 and 5),
  entry_requirements jsonb not null default '{}'::jsonb,
  tips text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on column public.locations.difficulty_level is '1 = 极度友好, 5 = 非常刁难';
comment on column public.locations.entry_requirements is 'need_ic, need_qr, fee_required, bike_allowed, parking, gate_rule 等门禁字段';

create index if not exists locations_area_idx on public.locations (area);
create index if not exists locations_difficulty_idx on public.locations (difficulty_level);
create index if not exists locations_updated_at_idx on public.locations (updated_at desc);

create or replace function public.set_locations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists locations_updated_at on public.locations;
create trigger locations_updated_at
before update on public.locations
for each row execute procedure public.set_locations_updated_at();

-- 首版前端可以先使用 mock data；接入 Supabase 时建议把公开读取和 UGC 提交拆成不同权限。
alter table public.locations enable row level security;

drop policy if exists "locations are publicly readable" on public.locations;
create policy "locations are publicly readable"
on public.locations for select
to anon, authenticated
using (true);

-- 让前端可以通过 Supabase Realtime 监听新增、修改和删除。
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'locations'
  ) then
    alter publication supabase_realtime add table public.locations;
  end if;
end;
$$;

-- UGC 最好通过 Edge Function / 审核接口写入，而不是直接开放匿名 update。
