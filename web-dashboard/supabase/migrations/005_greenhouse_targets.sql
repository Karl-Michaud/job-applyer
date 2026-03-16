-- ============================================================
-- 005_greenhouse_targets.sql
-- Greenhouse API scraper targets — configured before first scrape
-- ============================================================

create table greenhouse_targets (
  id           uuid primary key default uuid_generate_v4(),
  slug         text not null unique,   -- Greenhouse API slug e.g. "shopify"
  display_name text not null,          -- Human-readable e.g. "Shopify"
  enabled      boolean not null default true,
  created_at   timestamptz not null default now()
);
