-- ============================================================
-- 006_lever_targets.sql
-- Lever API scraper targets
-- ============================================================

create table lever_targets (
  id           uuid primary key default uuid_generate_v4(),
  slug         text not null unique,   -- Lever slug e.g. "spotify" from jobs.lever.co/spotify
  display_name text not null,          -- Human-readable e.g. "Spotify"
  enabled      boolean not null default true,
  created_at   timestamptz not null default now()
);
