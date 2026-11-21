FROM nginx:1.27-alpine

# remove the original default configuration file
RUN rm -rf /etc/nginx/conf.d/default.conf

# copy the root nginx conf file
COPY ./nginx.conf /etc/nginx/conf.d/nginx.conf

# copy the backends file
COPY ./servers.conf /etc/nginx/servers.conf

# copy the API route definitions
COPY ./api_conf.d /etc/nginx/api_conf.d

# copy the JSON error responses
COPY ./json_errors.conf /etc/nginx/json_errors.conf

COPY ./html /usr/share/nginx/html

EXPOSE 80
