-- ============================================================
-- 001_initial.sql
-- Job Tracker — initial schema
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type job_status as enum ('new', 'saved', 'archived', 'disliked');

create type job_location_type as enum ('remote', 'hybrid', 'onsite');

create type job_type as enum ('internship', 'full_time', 'part_time', 'contract');

create type deadline_type as enum ('date', 'rolling', 'unknown');

create type application_stage as enum (
  'applied',
  'phone_screen',
  'technical',
  'onsite',
  'offer',
  'rejected',
  'withdrawn'
);

create type scraper_run_status as enum ('running', 'success', 'failed');

-- ============================================================
-- companies
-- ============================================================

create table companies (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  domain      text,
  blacklisted boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- jobs
-- ============================================================

create table jobs (
  id               uuid primary key default uuid_generate_v4(),
  external_id      text,
  source_url       text not null unique,
  title            text not null,
  company_id       uuid not null references companies(id) on delete cascade,

  -- location
  location         text,
  location_type    job_location_type,

  -- role metadata
  job_type         job_type,
  term             text,           -- e.g. "summer-2026", "fall-2025"
  duration         text,           -- e.g. "4 months", "8 months"

  -- description
  description      text,           -- raw HTML or markdown
  description_text text,           -- plain text for search / ATS

  -- dates
  posted_at        timestamptz,
  closing_at       timestamptz,    -- null when rolling or unknown
  deadline_type    deadline_type not null default 'unknown',

  -- compensation
  salary_min       numeric(10,2),
  salary_max       numeric(10,2),

  -- tags / search
  tags             text[] not null default '{}',

  -- user-facing state
  status           job_status not null default 'new',
  rank             smallint,       -- manual priority rank
  notes            text,

  -- AI fields (Phase 4)
  ats_score        smallint,
  tailored_resume  text,

  -- housekeeping
  scraped_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index jobs_status_idx      on jobs(status);
create index jobs_company_idx     on jobs(company_id);
create index jobs_closing_at_idx  on jobs(closing_at);
create index jobs_scraped_at_idx  on jobs(scraped_at desc);

-- auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger jobs_updated_at
  before update on jobs
  for each row execute procedure set_updated_at();

-- ============================================================
-- applications
-- ============================================================

create table applications (
  id               uuid primary key default uuid_generate_v4(),
  job_id           uuid not null references jobs(id) on delete cascade,

  applied_at       timestamptz not null default now(),
  stage            application_stage not null default 'applied',
  stage_history    jsonb not null default '[]',  -- [{stage, changed_at, note}]

  cover_letter     text,
  resume_version   text,           -- name/ref to resume used

  contact_name     text,
  contact_email    text,

  next_action_date date,
  next_action_note text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index applications_job_idx   on applications(job_id);
create index applications_stage_idx on applications(stage);

create trigger applications_updated_at
  before update on applications
  for each row execute procedure set_updated_at();

-- ============================================================
-- resumes
-- ============================================================

create table resumes (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  content    text not null,          -- markdown
  is_base    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger resumes_updated_at
  before update on resumes
  for each row execute procedure set_updated_at();

-- ============================================================
-- preferences
-- ============================================================

-- key-value store; known keys:
--   target_roles, target_locations, daily_goal,
--   blacklisted_keywords, blacklisted_companies

create table preferences (
  id         uuid primary key default uuid_generate_v4(),
  key        text not null unique,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger preferences_updated_at
  before update on preferences
  for each row execute procedure set_updated_at();

-- seed sensible defaults
insert into preferences (key, value) values
  ('target_roles',           '[]'),
  ('target_locations',       '[]'),
  ('daily_goal',             '5'),
  ('blacklisted_keywords',   '[]'),
  ('blacklisted_companies',  '[]');

-- ============================================================
-- notifications
-- ============================================================

create table notifications (
  id         uuid primary key default uuid_generate_v4(),
  job_id     uuid references jobs(id) on delete set null,
  type       text not null,          -- e.g. "new_job", "deadline_soon"
  title      text not null,
  body       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_read_idx on notifications(read);

-- ============================================================
-- scraper_targets
-- ============================================================

create table scraper_targets (
  id              uuid primary key default uuid_generate_v4(),
  company_id      uuid not null references companies(id) on delete cascade,
  url             text not null,
  scraper_type    text not null,    -- 'greenhouse' | 'lever' | 'workday' | 'simplify' | 'asip'
  cron_schedule   text not null default '0 2 * * *',
  last_run_at     timestamptz,
  last_run_status scraper_run_status,
  enabled         boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- scraper_runs
-- ============================================================

create table scraper_runs (
  id          uuid primary key default uuid_generate_v4(),
  target_id   uuid not null references scraper_targets(id) on delete cascade,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  jobs_found  integer,
  jobs_new    integer,
  status      scraper_run_status not null default 'running',
  error_log   text
);

create index scraper_runs_target_idx on scraper_runs(target_id);
create index scraper_runs_started_idx on scraper_runs(started_at desc);
