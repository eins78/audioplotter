# Dockerfile for CI/testing and optional local development
# Production deployment is handled by Vercel (automatic Vite detection)
# This image is used by docker-compose for running E2E tests with Selenium

# Build stage
FROM node:24-alpine AS builder
WORKDIR /app

# Enable corepack for pnpm
RUN npm i -g corepack && corepack enable && pnpm -v

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code and build
COPY . .
RUN pnpm build

# Production stage with nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx files
RUN rm -rf ./*

# Copy built files from builder
COPY --from=builder /app/dist .

# Copy nginx configuration (optional - nginx serves SPA by default)
# For SPA routing, we need to ensure all routes fall back to index.html
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
