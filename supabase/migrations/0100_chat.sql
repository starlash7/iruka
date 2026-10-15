CREATE TABLE chat_state (
 chat_id uuid PRIMARY KEY REFERENCES chats(id),
 active_message_id uuid,
 opening_id text,
 branch_from_message_id uuid REFERENCES messages(id),
 deleted_at timestamptz,
 FOREIGN KEY(active_message_id,chat_id) REFERENCES messages(id,chat_id)
);
CREATE TABLE chat_turn_leases (
 turn_id uuid PRIMARY KEY REFERENCES turn_requests(id),
 chat_id uuid NOT NULL UNIQUE REFERENCES chats(id),
 expires_at timestamptz NOT NULL
);
CREATE TABLE chat_memories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 chat_id uuid NOT NULL REFERENCES chats(id),
 kind text NOT NULL CHECK(kind IN ('pinned','summary')),
 anchor_id uuid,
 content text NOT NULL CHECK(length(content) BETWEEN 1 AND 4000),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(anchor_id,chat_id) REFERENCES messages(id,chat_id),
 CHECK((kind='summary' AND anchor_id IS NOT NULL) OR (kind='pinned' AND anchor_id IS NULL)),
 UNIQUE(chat_id,kind,anchor_id)
);
CREATE TABLE chat_summary_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 chat_id uuid NOT NULL REFERENCES chats(id),
 anchor_id uuid NOT NULL,
 state text NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','running','done','failed')),
 lease_token uuid,
 expires_at timestamptz,
 attempts integer NOT NULL DEFAULT 0,
 FOREIGN KEY(anchor_id,chat_id) REFERENCES messages(id,chat_id),
 UNIQUE(chat_id,anchor_id)
);
CREATE INDEX chat_memories_chat_idx ON chat_memories(chat_id);
CREATE INDEX chat_summary_jobs_state_idx ON chat_summary_jobs(state,expires_at);
REVOKE ALL ON chat_state,chat_turn_leases,chat_memories,chat_summary_jobs FROM PUBLIC;
CREATE TABLE chat_message_presentations (
 message_id uuid PRIMARY KEY REFERENCES messages(id),
 images jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(images)='array'),
 statuses jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(statuses)='array'),
 endings jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(endings)='array')
);
REVOKE ALL ON chat_message_presentations FROM PUBLIC;
