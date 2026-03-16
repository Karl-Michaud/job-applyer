create table if not exists ashby_targets (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  display_name text not null,
  enabled      boolean not null default true,
  created_at   timestamptz not null default now()
);
