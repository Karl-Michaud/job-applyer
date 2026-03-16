-- Prevent duplicate applications for the same job
-- First remove any existing duplicates, keeping the most recent
delete from applications
where id not in (
  select distinct on (job_id) id
  from applications
  order by job_id, created_at desc
);

alter table applications
  add constraint applications_job_id_unique unique (job_id);
