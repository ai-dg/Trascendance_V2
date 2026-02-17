FROM debian:latest


RUN apt-get update && apt-get install -y \
build-essential \
g++ \
cmake \
git \
pkg-config \
libyajl-dev \
libxml2-dev \
openssl \
libtool \
flex \
bison \
autotools-dev \
automake \
libcurl4-openssl-dev \
ca-certificates \
wget \
curl \
python3 \
python3-pip \
libgeoip-dev \
libmaxminddb-dev \
liblmdb-dev \
libfuzzy-dev \
lua5.3 \
liblua5.3-dev \
libpcre2-dev \
iputils-ping \
netcat-openbsd


COPY ./services/security/modsecurity/libinjection/src/libinjection.h /usr/local/include/
COPY ./services/security/modsecurity/libinjection/src/libinjection.a /usr/local/lib/


WORKDIR /opt

RUN git clone https://github.com/SpiderLabs/ModSecurity.git 
WORKDIR /opt/ModSecurity
RUN git submodule init && git submodule update && ./build.sh && ./configure && make && make install
WORKDIR /


# RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
# -keyout /etc/nginx/ssl/nginx.key \
# -out /etc/nginx/ssl/nginx.crt \
# -subj "/C=FR/ST=IDF/L=Paris/O=42/OU=42/CN=localhost" \
# && chmod 644 /etc/nginx/ssl/nginx.crt \
# && chmod 644 /etc/nginx/ssl/nginx.key

# RUN chmod 644 /etc/nginx/ssl/nginx.key /etc/nginx/ssl/nginx.crt


    # Cloner le connecteur ModSecurity pour Nginx
RUN git clone --depth 1 https://github.com/SpiderLabs/ModSecurity-nginx.git /opt/ModSecurity-nginx

# Télécharger Nginx depuis les sources
WORKDIR /opt
RUN curl -O http://nginx.org/download/nginx-1.28.0.tar.gz && \
    tar -zxvf nginx-1.28.0.tar.gz


RUN apt-get update && \
    apt-get install -y libssl-dev

WORKDIR /opt/nginx-1.28.0
RUN ./configure \
    --prefix=/etc/nginx \
    --sbin-path=/usr/sbin/nginx \
    --conf-path=/etc/nginx/nginx.conf \
    --error-log-path=/var/log/nginx/error.log \
    --http-log-path=/var/log/nginx/access.log \
    --with-http_ssl_module \
    --with-http_v2_module \
    --add-module=/opt/ModSecurity-nginx && \
    make && \
    make install


# RUN apt-get remove -y build-essential g++ cmake git pkg-config flex bison autotools-dev automake libtool \
# libyajl-dev libpcre3-dev libxml2-dev libcurl4-openssl-dev python3 python3-pip wget curl \
# && apt-get autoremove -y \
# && apt-get clean \
# && rm -rf /var/lib/apt/lists/* /opt/*


RUN mkdir -p /etc/nginx/sites-enabled/
COPY ./services/security/modsecurity/conf/pong.conf /etc/nginx/sites-available/default.conf
COPY ./services/security/modsecurity/conf/pong.conf /etc/nginx/sites-enabled/default.conf
COPY ./services/security/modsecurity/conf/nginx.conf /etc/nginx/nginx.conf
COPY ./services/security/modsecurity/conf/modsecurity.conf /etc/modsecurity/modsecurity.conf
COPY ./services/security/modsecurity/conf/crs-setup.conf /etc/modsecurity/crs/crs-setup.conf
COPY ./services/security/modsecurity/conf/unicode.mapping /etc/modsecurity/unicode.mapping


RUN mkdir -p /etc/modsecurity/crs/rules/
COPY ./services/security/modsecurity/conf/rules/* /etc/modsecurity/crs/rules/
# RUN mkdir -p /etc/nginx/sites-enabled/
# RUN ln -s /etc/nginx/sites-available/default.conf /etc/nginx/sites-enabled/

RUN mkdir -p /etc/nginx/ssl

 COPY ./certs/cert.pem /etc/nginx/ssl/cert.pem
 COPY ./certs/key.pem /etc/nginx/ssl/key.pem



CMD ["nginx", "-g", "daemon off;"]