-- 0001_tenancy.sql
-- Multitenant base: tenants, customers, sites.
-- Row-level security policies se introducen en 0005_rls.sql (M5).

CREATE TABLE IF NOT EXISTS tenant (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  plan        TEXT        NOT NULL DEFAULT 'standard',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  contact_email TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_tenant_idx ON customer(tenant_id);

CREATE TABLE IF NOT EXISTS site (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID        NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
  tenant_id    UUID        NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  address      TEXT,
  -- PostGIS point. NULL until M8 geo work fills it.
  geo_point    geography(Point, 4326),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS site_customer_idx ON site(customer_id);
CREATE INDEX IF NOT EXISTS site_tenant_idx ON site(tenant_id);
CREATE INDEX IF NOT EXISTS site_geo_idx ON site USING gist(geo_point);
