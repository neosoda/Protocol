# Coolify — Protocol.techsentinel.fr.
# Stage 1 checks and builds the Vite app; stage 2 serves the static output with Nginx.
FROM node:22-alpine AS build
WORKDIR /workspace/app
COPY app/package.json app/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY app/ ./
# Brand tests read both root READMEs relative to app/; keep Docker and local layout identical.
COPY README.md README.en.md /workspace/
RUN npm run typecheck && npm test && npm run build

FROM nginx:stable-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/app/dist/ /usr/share/nginx/html/
RUN test -s /usr/share/nginx/html/index.html && nginx -t
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
