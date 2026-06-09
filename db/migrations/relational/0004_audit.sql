-- 0004_audit.sql
-- Append-only audit hash chain. Insert-only by design.

CREATE TABLE IF NOT EXISTS audit_event (
  id            BIGSERIAL    PRIMARY KEY,
  tenant_id     UUID         NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
  actor_user_id UUID         REFERENCES app_user(id),
  action        TEXT         NOT NULL,
  resource      TEXT         NOT NULL,
  resource_id   TEXT,
  payload       JSONB        NOT NULL,
  payload_hash  CHAR(64)     NOT NULL,
  prev_hash     CHAR(64),
  hash          CHAR(64)     NOT NULL,
  ts            TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_tenant_ts_idx ON audit_event(tenant_id, ts DESC);
CREATE INDEX IF NOT EXISTS audit_resource_idx ON audit_event(resource, resource_id) WHERE resource_id IS NOT NULL;

-- Forbid updates/deletes on audit_event.
CREATE OR REPLACE FUNCTION audit_event_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_event is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_event_no_update ON audit_event;
CREATE TRIGGER audit_event_no_update
  BEFORE UPDATE OR DELETE ON audit_event
  FOR EACH ROW EXECUTE FUNCTION audit_event_immutable();
