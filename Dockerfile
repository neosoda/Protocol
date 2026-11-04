# Coolify — rollback of the original visual experience.
# Restore the exact historical HTML and its prebuilt animation bundles.
# Keep the deploy simple: no Node runtime, no Vite rebuild. The v5 "Studio"
# skin (assets/studio.css) is a plain stylesheet layered over the bundle.
FROM nginx:stable-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY app/index.html /usr/share/nginx/html/index.html
COPY app/public/ /usr/share/nginx/html/
RUN test -s /usr/share/nginx/html/index.html \
    && test -s /usr/share/nginx/html/assets/index-l76eMM6E.js \
    && test -s /usr/share/nginx/html/assets/index-C1vckX_Q.css \
    && test -s /usr/share/nginx/html/assets/studio.css \
    && nginx -t
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
