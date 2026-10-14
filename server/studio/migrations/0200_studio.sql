CREATE TABLE studio_drafts (
 work_id uuid PRIMARY KEY REFERENCES works(id),
 revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
 body jsonb NOT NULL CHECK (jsonb_typeof(body)='object'),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE studio_assets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 work_id uuid NOT NULL REFERENCES works(id),
 owner_id uuid NOT NULL REFERENCES users(id),
 code text NOT NULL CHECK (code ~ '^[A-Za-z0-9_-]{1,64}$'),
 label text NOT NULL,
 url text,
 UNIQUE(work_id,code)
);
REVOKE ALL ON studio_drafts, studio_assets FROM PUBLIC;
CREATE TABLE studio_seed_imports (
 slug text PRIMARY KEY,
 source_hash text NOT NULL,
 work_id uuid NOT NULL REFERENCES works(id)
);
REVOKE ALL ON studio_seed_imports FROM PUBLIC;
