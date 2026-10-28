FROM node:22-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm@10

COPY pnpm-lock.yaml* pnpm-workspace.yaml package.json ./
COPY packages/ packages/

RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/core/dist ./packages/core/dist/
COPY --from=builder /app/packages/providers/package.json ./packages/providers/
COPY --from=builder /app/packages/providers/dist ./packages/providers/dist/
COPY --from=builder /app/packages/adapters/node/package.json ./packages/adapters/node/
COPY --from=builder /app/packages/adapters/node/dist ./packages/adapters/node/dist/

EXPOSE 3000

CMD ["node", "packages/adapters/node/dist/server.js"]
