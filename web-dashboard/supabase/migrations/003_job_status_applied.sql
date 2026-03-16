-- Add 'applied' to job_status enum so applied jobs are isolated from all other pages
alter type job_status add value if not exists 'applied';
