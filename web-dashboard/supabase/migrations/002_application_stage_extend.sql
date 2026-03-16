-- Extend application_stage enum with new pipeline stages
alter type application_stage add value if not exists 'oa';
alter type application_stage add value if not exists 'interviewing';
alter type application_stage add value if not exists 'ghosted';

-- Drop technical and no_response are legacy values; leave them in the enum
-- for backwards compat but they won't be exposed in the UI.
