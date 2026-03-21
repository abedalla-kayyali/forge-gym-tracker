-- backup_state: tracks cursor position for paginated cron backups
CREATE TABLE IF NOT EXISTS backup_state (
  user_id    TEXT        PRIMARY KEY,
  cursor     TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE backup_state ENABLE ROW LEVEL SECURITY;
-- Service role bypasses RLS; deny all other access
CREATE POLICY "service_role only" ON backup_state USING (FALSE);
