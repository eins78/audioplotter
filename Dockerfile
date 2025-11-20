# Install dependencies only when needed
FROM node:22-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable corepack for pnpm
RUN npm i -g corepack && pnpm -v

# first, install deps (seperate step for caching)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# build app
FROM node:22-alpine AS builder
WORKDIR /app

# Enable corepack for pnpm
RUN npm i -g corepack && pnpm -v

# Copy package files before installing
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --production=true

COPY . .
# disable build telemetry, see https://nextjs.org/telemetry
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm run build

# Production image, copy all the files and run next
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# disable runtime telemetry, see https://nextjs.org/telemetry
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# You only need to copy next.config.js if you are NOT using the default configuration
# COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
