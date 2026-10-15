CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  privy_did text NOT NULL UNIQUE CHECK (privy_did LIKE 'did:privy:%'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  profile jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(profile) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, user_id)
);
CREATE TABLE works (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id),
  mode text NOT NULL CHECK (mode IN ('character','story')),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public','unlisted')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE work_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid NOT NULL REFERENCES works(id),
  version integer NOT NULL CHECK (version > 0),
  public_snapshot jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(public_snapshot) = 'object'),
  private_config jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(private_config) = 'object'),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (work_id, version),
  UNIQUE (id, work_id)
);
CREATE FUNCTION protect_published_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.published_at IS NOT NULL THEN
    RAISE EXCEPTION 'published work version is immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER published_version_immutable BEFORE UPDATE OR DELETE ON work_versions
  FOR EACH ROW EXECUTE FUNCTION protect_published_version();
CREATE TABLE chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  work_id uuid NOT NULL REFERENCES works(id),
  work_version_id uuid NOT NULL,
  persona_id uuid,
  persona_snapshot jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(persona_snapshot) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (work_version_id, work_id) REFERENCES work_versions(id, work_id),
  FOREIGN KEY (persona_id, user_id) REFERENCES personas(id, user_id),
  UNIQUE (id, user_id)
);
CREATE FUNCTION protect_chat_pins() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND ROW(NEW.user_id,NEW.work_id,NEW.work_version_id,NEW.persona_id,NEW.persona_snapshot)
      IS DISTINCT FROM ROW(OLD.user_id,OLD.work_id,OLD.work_version_id,OLD.persona_id,OLD.persona_snapshot) THEN
    RAISE EXCEPTION 'chat pins are immutable';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM work_versions WHERE id=NEW.work_version_id AND published_at IS NOT NULL) THEN
    RAISE EXCEPTION 'chat requires a published work version';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER chat_pins BEFORE INSERT OR UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION protect_chat_pins();
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES chats(id),
  parent_id uuid,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (id, chat_id),
  FOREIGN KEY (parent_id, chat_id) REFERENCES messages(id, chat_id),
  CHECK (parent_id IS DISTINCT FROM id)
);
CREATE FUNCTION protect_message_parent() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF ROW(NEW.id,NEW.chat_id,NEW.parent_id) IS DISTINCT FROM ROW(OLD.id,OLD.chat_id,OLD.parent_id) THEN
    RAISE EXCEPTION 'message parent is immutable';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER message_parent_immutable BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION protect_message_parent();
CREATE TABLE turn_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  chat_id uuid NOT NULL,
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 1 AND 200),
  payload_hash text NOT NULL CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','succeeded','failed','aborted')),
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (chat_id,user_id) REFERENCES chats(id,user_id),
  UNIQUE (user_id,idempotency_key),
  UNIQUE (id,user_id)
);
CREATE FUNCTION protect_turn_request() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'turn request identity is immutable'; END IF;
  IF OLD.status IN ('succeeded','failed','aborted') THEN
    RAISE EXCEPTION 'terminal turn request is immutable';
  END IF;
  IF ROW(NEW.id,NEW.user_id,NEW.chat_id,NEW.idempotency_key,NEW.payload_hash)
      IS DISTINCT FROM ROW(OLD.id,OLD.user_id,OLD.chat_id,OLD.idempotency_key,OLD.payload_hash) THEN
    RAISE EXCEPTION 'turn request identity is immutable';
  END IF;
  IF OLD.status = 'running' AND NEW.status = 'pending' THEN RAISE EXCEPTION 'invalid turn transition'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER turn_request_immutable BEFORE UPDATE OR DELETE ON turn_requests
  FOR EACH ROW EXECUTE FUNCTION protect_turn_request();
CREATE TABLE credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seq bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  user_id uuid NOT NULL REFERENCES users(id),
  turn_request_id uuid,
  bucket text NOT NULL DEFAULT 'free' CHECK (bucket = 'free'),
  kind text NOT NULL CHECK (kind IN ('grant','reserve','charge','release')),
  amount bigint NOT NULL,
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (turn_request_id,user_id) REFERENCES turn_requests(id,user_id),
  UNIQUE (user_id,idempotency_key),
  CHECK ((kind IN ('grant','release') AND amount > 0) OR (kind='reserve' AND amount < 0) OR (kind='charge' AND amount = 0)),
  CHECK (kind='grant' OR turn_request_id IS NOT NULL)
);
CREATE FUNCTION reject_ledger_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'credit ledger is append-only'; END $$;
CREATE TRIGGER credit_ledger_append_only BEFORE UPDATE OR DELETE ON credit_ledger
  FOR EACH ROW EXECUTE FUNCTION reject_ledger_mutation();
CREATE TRIGGER credit_ledger_no_truncate BEFORE TRUNCATE ON credit_ledger
  FOR EACH STATEMENT EXECUTE FUNCTION reject_ledger_mutation();
CREATE INDEX personas_user_idx ON personas(user_id);
CREATE INDEX works_owner_idx ON works(owner_id);
CREATE INDEX chats_user_idx ON chats(user_id);
CREATE INDEX messages_chat_idx ON messages(chat_id);
CREATE INDEX credit_ledger_user_seq_idx ON credit_ledger(user_id,seq);
-- Parents must pre-exist, so even a multi-row INSERT cannot create a cycle.
CREATE FUNCTION require_existing_message_parent() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM messages WHERE id=NEW.parent_id AND chat_id=NEW.chat_id
  ) THEN RAISE EXCEPTION 'message parent foreign key requires an existing message in the same chat'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER message_existing_parent BEFORE INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION require_existing_message_parent();
-- Server-owned connection only. Never distribute DB credentials to browser clients.
REVOKE ALL ON users, personas, works, work_versions, chats, messages, turn_requests, credit_ledger FROM PUBLIC;
REVOKE ALL ON SEQUENCE credit_ledger_seq_seq FROM PUBLIC;
