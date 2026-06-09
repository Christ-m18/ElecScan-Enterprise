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

-- Nota: el password hash de abajo es Argon2id de "demo-password-12345"
-- generado de forma deterministica. iam-service en M0 mantiene los users
-- en memoria, no en Postgres. Esta seed prepara el modelo de M5 cuando
-- el repositorio migre a Prisma.
-- En M0 el login se hace con POST /iam/auth/signup primero (ver RUN.md).
