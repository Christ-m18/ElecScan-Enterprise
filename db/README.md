# Database migrations

Source of truth para el esquema de Postgres. Dividido en dos carpetas:

- `migrations/relational/` SQL puro versionado, usado por Postgres directamente
  o vehicalizado por Prisma migrate en una fase posterior (M5+). Tablas OLTP,
  RLS, indices, vistas.
- `migrations/timescale/` SQL puro para hipertablas, continuous aggregates,
  politicas de compresion y retencion. Prisma migrate no maneja esto: se
  ejecuta con `psql` o `pg-migrate` aparte.

## Convencion de nombres

`NNNN_descripcion-corta.sql` donde `NNNN` es secuencial cero-padded a 4 digitos.
Cada archivo debe ser idempotente (`IF NOT EXISTS`) hasta donde sea posible.

## Aplicacion en dev

El compose dev monta `infra/compose/initdb/` que crea las extensiones en el
primer boot. Las migraciones se aplican a continuacion con:

```
psql "$DATABASE_URL" -f db/migrations/relational/0001_tenancy.sql
psql "$DATABASE_URL" -f db/migrations/relational/0002_identity.sql
psql "$DATABASE_URL" -f db/migrations/relational/0003_devices.sql
psql "$DATABASE_URL" -f db/migrations/relational/0004_audit.sql
psql "$DATABASE_URL" -f db/migrations/timescale/0001_hypertables.sql
psql "$DATABASE_URL" -f db/migrations/timescale/0002_policies.sql
```

En M5 se introduce Prisma migrate para el bloque relacional. Las hipertablas
seguiran como SQL puro.

## Reset en dev

```
pnpm compose:down
docker volume rm elecscan-dev_postgres_data
pnpm compose:up
```
