FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY libs ./libs
COPY services/alarm-service ./services/alarm-service
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm --filter @elecscan/alarm-service build

FROM gcr.io/distroless/nodejs20-debian12:nonroot AS runner
WORKDIR /app
COPY --from=builder /app/services/alarm-service/dist ./dist
COPY --from=builder /app/services/alarm-service/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
USER nonroot
EXPOSE 4007
CMD ["dist/main.js"]
