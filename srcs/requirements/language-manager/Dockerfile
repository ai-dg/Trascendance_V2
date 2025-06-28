FROM debian:bookworm-slim

RUN apt-get update \
	&& apt-get install -y nginx curl \
	&& rm -rf /var/lib/apt/lists/*

RUN rm /etc/nginx/sites-enabled/default

COPY nginx/nginx.conf /etc/nginx/nginx.conf

RUN chmod 644 /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
