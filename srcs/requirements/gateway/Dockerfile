FROM debian:bookworm

RUN apt-get update && apt-get upgrade -y \
	&& apt-get install -y \
	nginx \
	curl

COPY ./requirements/gateway/nginx/nginx.conf /etc/nginx/sites-enabled/

RUN ls -la ./etc/nginx/nginx.conf

RUN chmod 644 ./etc/nginx/nginx.conf

RUN mkdir -p /app/data

CMD ["nginx", "-g", "daemon off;"]
