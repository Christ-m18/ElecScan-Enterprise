-- Device configuration profile versions
CREATE TABLE IF NOT EXISTS device_profile_version (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   TEXT        NOT NULL,
  version     INTEGER     NOT NULL,
  label       TEXT        NOT NULL,
  entries     JSONB       NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  TEXT        NOT NULL DEFAULT 'system',
  note        TEXT        NOT NULL DEFAULT '',
  UNIQUE (device_id, version)
);

CREATE INDEX IF NOT EXISTS idx_dpv_device ON device_profile_version(device_id, version DESC);
