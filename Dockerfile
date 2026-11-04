# Coolify: select Dockerfile build strategy at repository root.
# Only the generated modern bundle is copied into the runtime image.
FROM node:22-alpine AS build
WORKDIR /src/app

COPY app/package.json app/package-lock.json ./
# Bootstrap while the committed lockfile is stale.
# Switch to npm ci once app/package-lock.json is synchronized.
RUN npm install --no-audit --no-fund

COPY app/ ./
RUN npm run typecheck && npm run test && npm run build

FROM nginx:stable-alpine AS runtime
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/app/dist/ /usr/share/nginx/html/

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
