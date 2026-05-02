-- Migration 028: Add department column to notes + seed existing notes as FAST / Computing
ALTER TABLE notes ADD COLUMN IF NOT EXISTS department text;

UPDATE notes
SET
  university_id = (SELECT id FROM universities WHERE slug = 'fast' LIMIT 1),
  department    = 'Computing'
WHERE status = 'published';
