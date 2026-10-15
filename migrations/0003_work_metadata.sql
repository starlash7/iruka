ALTER TABLE works
  ADD COLUMN cover_url text,
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
