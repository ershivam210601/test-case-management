FROM nginx:1.27-alpine

# remove the original default configuration file
RUN rm -rf /etc/nginx/conf.d/default.conf

# nginx's own entrypoint envsubst's *.template files here into /etc/nginx/conf.d/*.conf at startup
COPY ./templates /etc/nginx/templates

# copy the JSON error responses
COPY ./json_errors.conf /etc/nginx/json_errors.conf

COPY ./html /usr/share/nginx/html

# sane local defaults; override per-environment (see docker-compose.yml / Render env vars)
ENV AUTH_SERVICE_HOST=auth-service:4002
ENV USER_SERVICE_HOST=user-service:4003
ENV CORS_ORIGIN=http://localhost:5173

EXPOSE 80
