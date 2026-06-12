CREATE TABLE IF NOT EXISTS alarm_maintenance_window (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   TEXT        NOT NULL,
  label       TEXT        NOT NULL DEFAULT '',
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL,
  created_by  TEXT        NOT NULL DEFAULT 'system',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mw_valid_range CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_mw_device_ends ON alarm_maintenance_window (device_id, ends_at DESC);
