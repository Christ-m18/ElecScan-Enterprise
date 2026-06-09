# Contributing

## Local setup

```
pnpm install
pnpm prepare              # installs lefthook git hooks
cp .env.example .env
pnpm compose:up           # postgres, redis, nats, minio, observability
pnpm build
pnpm typecheck
pnpm test
```

## Commit messages

Conventional Commits enforced by commitlint. Format:

```
<type>(<scope>): <subject>
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`, `revert`.
Allowed scopes are listed in `commitlint.config.js`.

## Branches

- `main` is protected. Merges via PR only.
- Feature branches: `feat/<scope>-<short-description>`.
- Fixes: `fix/<scope>-<short-description>`.

## Definition of Done

See `docs/10-implementation-plan/01-implementation-plan.md` section 10.7.
