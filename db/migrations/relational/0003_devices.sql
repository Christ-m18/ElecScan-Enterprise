-- 0003_devices.sql
-- Device inventory + connectivity + configuration management.

CREATE TABLE IF NOT EXISTS device (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID        NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  site_id             UUID        NOT NULL REFERENCES site(id) ON DELETE CASCADE,
  model               TEXT        NOT NULL DEFAULT 'Mi550',
  serial              TEXT,
  name                TEXT        NOT NULL,
  host                TEXT        NOT NULL,
  port                INTEGER     NOT NULL DEFAULT 502 CHECK (port BETWEEN 1 AND 65535),
  connection_mode     TEXT        NOT NULL CHECK (connection_mode IN ('vpn', 'gateway')),
  status              TEXT        NOT NULL DEFAULT 'unknown'
                                   CHECK (status IN ('online', 'offline', 'unknown', 'error')),
  last_seen_at        TIMESTAMPTZ,
  current_profile_version INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
CREATE INDEX IF NOT EXISTS device_site_idx ON device(site_id);
CREATE INDEX IF NOT EXISTS device_tenant_status_idx ON device(tenant_id, status);

CREATE TABLE IF NOT EXISTS device_profile_version (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id          UUID        NOT NULL REFERENCES device(id) ON DELETE CASCADE,
  version            INTEGER     NOT NULL,
  wiring_mode        SMALLINT,
  grid_frequency     SMALLINT,
  nominal_voltage    INTEGER,
  ct_abc             JSONB,
  ct_n               JSONB,
  vt_ratios          JSONB,
  event_thresholds   JSONB,
  demand_policy      JSONB,
  drift_policy       JSONB,
  harm_threshold     JSONB,
  co2_factor         INTEGER,
  created_by         UUID        REFERENCES app_user(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (device_id, version)
);

CREATE TABLE IF NOT EXISTS config_change (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id         UUID        NOT NULL REFERENCES device(id) ON DELETE CASCADE,
  command_id        UUID        NOT NULL UNIQUE,
  instruction_code  INTEGER     NOT NULL,
  parameters        JSONB       NOT NULL,
  requested_by      UUID        REFERENCES app_user(id),
  approved_by       UUID        REFERENCES app_user(id),
  require_four_eyes BOOLEAN     NOT NULL DEFAULT false,
  status            TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'approved', 'applied', 'failed', 'rolledback')),
  error_code        INTEGER,
  reason            TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS config_change_device_idx ON config_change(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS config_change_status_idx ON config_change(status) WHERE status IN ('pending', 'approved');

CREATE TABLE IF NOT EXISTS gateway_agent (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  site_id           UUID        NOT NULL REFERENCES site(id) ON DELETE CASCADE,
  hostname          TEXT        NOT NULL,
  agent_version     TEXT        NOT NULL,
  cert_fingerprint  TEXT,
  last_seen_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gateway_site_idx ON gateway_agent(site_id);

CREATE TABLE IF NOT EXISTS vpn_peer (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID        NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  site_id             UUID        NOT NULL REFERENCES site(id) ON DELETE CASCADE,
  pub_key             TEXT        NOT NULL,
  endpoint            TEXT,
  allowed_ips         TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
  last_handshake_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vpn_site_idx ON vpn_peer(site_id);

CREATE TABLE IF NOT EXISTS outbox_event (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type  TEXT        NOT NULL,
  aggregate_id    TEXT        NOT NULL,
  type            TEXT        NOT NULL,
  payload         JSONB       NOT NULL,
  headers         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  dispatched_at   TIMESTAMPTZ,
  retries         INTEGER     NOT NULL DEFAULT 0,
  last_error      TEXT
);
CREATE INDEX IF NOT EXISTS outbox_undispatched_idx ON outbox_event(created_at) WHERE dispatched_at IS NULL;
