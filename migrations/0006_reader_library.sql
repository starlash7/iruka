CREATE TABLE chat_folders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id),
 name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 50),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,user_id), UNIQUE(user_id,name)
);
ALTER TABLE chats ADD COLUMN title text CHECK (char_length(btrim(title)) BETWEEN 1 AND 80);
ALTER TABLE chats ADD COLUMN folder_id uuid;
ALTER TABLE chats ADD FOREIGN KEY (folder_id,user_id) REFERENCES chat_folders(id,user_id);
CREATE INDEX chats_user_folder_idx ON chats(user_id,folder_id);
CREATE TABLE work_favorites (
 user_id uuid NOT NULL REFERENCES users(id),
 work_id uuid NOT NULL REFERENCES works(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,work_id)
);
ALTER TABLE works ADD COLUMN show_creator boolean NOT NULL DEFAULT false;
REVOKE ALL ON chat_folders,work_favorites FROM PUBLIC;
