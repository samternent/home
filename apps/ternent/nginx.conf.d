server {
    root /var/www/ternent.dev/html;

    index index.html index.htm index.nginx-debian.html;

    gzip on;
    gzip_types text/html application/javascript application/json text/css;

    server_name ternent.dev;
    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(?:css|js|jpg|svg|png)$ {
        expires 1y;
        add_header Cache-Control "public";
    }

    location /api/ {
        proxy_pass http://localhost:4005;
    }

    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/www.ternent.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.ternent.dev/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
server {
    #listen 80 is default
    server_name www.ternent.dev;
    return 301 $scheme://ternent.dev$request_uri;


    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/www.ternent.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.ternent.dev/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
server {
    if ($host = ternent.dev) {
        return 301 https://$host$request_uri;
    }


    listen 80;
    listen [::]:80;

    server_name ternent.dev;
    return 404;
}
server {
    if ($host = www.ternent.dev) {
        return 301 https://$host$request_uri;
    }

    server_name www.ternent.dev;
    listen 80;
    return 404;
}
