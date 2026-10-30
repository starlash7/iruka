CREATE TABLE user_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  nickname text NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 30),
  bio text NOT NULL DEFAULT '' CHECK (char_length(bio) <= 300),
  avatar text CHECK (octet_length(avatar) <= 1500000),
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON user_profiles FROM PUBLIC;
