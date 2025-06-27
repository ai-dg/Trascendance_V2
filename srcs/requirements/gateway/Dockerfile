FROM debian:bookworm

RUN apt-get update && apt-get upgrade -y \
	&& apt-get install -y \
	nginx \
	curl

COPY ./requirements/gateway/nginx/nginx.conf /etc/nginx/sites-enabled/

RUN mkdir -p /app/data

CMD ["nginx", "-g", "daemon off;"]
