# Web app

Next.js 15 + React 19 + Tailwind con el tema "MI550 Original" (ver `docs/08-ux-ui`).

Dev:

```
pnpm --filter @elecscan/web dev
```

Build:

```
pnpm --filter @elecscan/web build
pnpm --filter @elecscan/web start
```

Env:

- `NEXT_PUBLIC_IAM_BASE_URL` (default `http://localhost:4001`)

En M0 hay dos pantallas: home placeholder y login. La integracion completa con `api-gateway` aterriza en M1.
