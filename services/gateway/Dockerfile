FROM nginx:1.27-alpine

# remove the original default configuration file
RUN rm -rf /etc/nginx/conf.d/default.conf

# nginx's own entrypoint envsubst's *.template files here into /etc/nginx/conf.d/*.conf at startup
COPY ./templates /etc/nginx/templates

# copy the JSON error responses
COPY ./json_errors.conf /etc/nginx/json_errors.conf

COPY ./html /usr/share/nginx/html

# sane local defaults; override per-environment (see docker-compose.yml / Render env vars).
# AUTH_SERVICE_HOST/USER_SERVICE_HOST must include a scheme (http/https) - on
# Render these point at the other services' public *.onrender.com URLs, since
# private service-to-service DNS between regular Web Services isn't reliably
# resolvable. RESOLVER_IP must then be a resolver that can resolve public
# internet hostnames (e.g. 1.1.1.1), not just local/private names - Docker
# Compose's embedded DNS (127.0.0.11, the default below) can't do that, so
# Render's env vars override it explicitly.
ENV AUTH_SERVICE_HOST=http://auth-service:4002
ENV USER_SERVICE_HOST=http://user-service:4003
ENV CORS_ORIGIN=http://localhost:5173
ENV RESOLVER_IP=127.0.0.11

EXPOSE 80
