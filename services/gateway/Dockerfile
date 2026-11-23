FROM nginx:1.27-alpine

# remove the original default configuration file
RUN rm -rf /etc/nginx/conf.d/default.conf

# nginx's own entrypoint envsubst's *.template files here into /etc/nginx/conf.d/*.conf at startup
COPY ./templates /etc/nginx/templates

# sourced before envsubst runs, so it can export RESOLVER_IP for the template above
COPY ./docker-entrypoint.d/19-resolver.envsh /docker-entrypoint.d/19-resolver.envsh
RUN chmod +x /docker-entrypoint.d/19-resolver.envsh

# copy the JSON error responses
COPY ./json_errors.conf /etc/nginx/json_errors.conf

COPY ./html /usr/share/nginx/html

# sane local defaults; override per-environment (see docker-compose.yml / Render env vars).
# Must include a scheme (http/https) - on Render these point at the other
# services' public *.onrender.com URLs, since private service-to-service
# DNS between regular Web Services isn't reliably resolvable.
ENV AUTH_SERVICE_HOST=http://auth-service:4002
ENV USER_SERVICE_HOST=http://user-service:4003
ENV CORS_ORIGIN=http://localhost:5173

EXPOSE 80
