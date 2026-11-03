ALTER TABLE studio_assets ADD COLUMN revision integer NOT NULL DEFAULT 1 CHECK (revision > 0);
ALTER TABLE studio_assets DROP CONSTRAINT studio_assets_work_id_code_key;
ALTER TABLE studio_assets ADD UNIQUE(work_id,code,revision);
