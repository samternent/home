server {
    root /var/www/footballsocial.app/html;

    index index.html index.htm index.nginx-debian.html;

    gzip on;
    gzip_types text/html application/javascript application/json text/css;

    server_name footballsocial.app;
    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(?:css|js|jpg|svg|png)$ {
        expires 1y;
        add_header Cache-Control "public";
    }

    location /api/ {
        proxy_pass http://localhost:4002;
    }

    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/www.footballsocial.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.footballsocial.app/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
server {
    #listen 80 is default
    server_name www.footballsocial.app;
    return 301 $scheme://footballsocial.app$request_uri;


    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/www.footballsocial.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.footballsocial.app/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
server {
    if ($host = footballsocial.app) {
        return 301 https://$host$request_uri;
    }


    listen 80;
    listen [::]:80;

    server_name footballsocial.app;
    return 404;
}
server {
    if ($host = www.footballsocial.app) {
        return 301 https://$host$request_uri;
    }

    server_name www.footballsocial.app;
    listen 80;
    return 404;
}
