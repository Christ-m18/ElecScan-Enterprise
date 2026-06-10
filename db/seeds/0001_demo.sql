-- 0001_demo.sql
-- Seed minimo para desarrollo. Idempotente. Re-ejecutable.
--
-- Crea:
--  - 1 tenant demo
--  - 1 customer demo
--  - 1 site demo
--  - 1 usuario demo con password hash conocido para password "demo-password-12345"

INSERT INTO tenant (id, name, slug, plan)
VALUES ('11111111-1111-4111-8111-111111111111', 'ElecScan Demo', 'demo', 'standard')
ON CONFLICT (id) DO NOTHING;

INSERT INTO customer (id, tenant_id, name, contact_email)
VALUES (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'Demo Customer',
  'demo@elecscan.local'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO site (id, customer_id, tenant_id, name, address)
VALUES (
  '33333333-3333-4333-8333-333333333333',
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'Planta Demo',
  'Bogota, Colombia'
)
ON CONFLICT (id) DO NOTHING;

-- app_user rows below are for M5 when the repository migrates to Prisma.
-- In M0 the iam-service seeds these users in-memory via DevSeedService on startup.
-- Password hashes are Argon2id (m=65536, t=3, p=4).

-- demo@elecscan.local / demo-password-12345
INSERT INTO app_user (id, tenant_id, email, password_hash, status)
VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '11111111-1111-4111-8111-111111111111',
  'demo@elecscan.local',
  '$argon2id$v=19$m=65536,t=3,p=4$wqfn3HBQfhUDfUTLHaRTkA$Ek1aGRmXF9kJlqj3yJQdFcZt6QYTiWXCRl9jqZ+xkSo',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- christopherjesusrosario@gmail.com / MI550PQA
INSERT INTO app_user (id, tenant_id, email, password_hash, status)
VALUES (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  '11111111-1111-4111-8111-111111111111',
  'christopherjesusrosario@gmail.com',
  '$argon2id$v=19$m=65536,t=3,p=4$GoarLb9VJFEkhvwMDeT3TA$+3+Dgu+xJQQylk/B4D6oMUcFxHgHZ9omLFicpxKFuOA',
  'active'
)
ON CONFLICT (id) DO NOTHING;
