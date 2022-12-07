server {
    root /var/www/teamconcords.com/html;

    index index.html index.htm index.nginx-debian.html;

    gzip on;
    gzip_types text/html application/javascript application/json text/css;

    server_name teamconcords.com;
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
    ssl_certificate /etc/letsencrypt/live/www.teamconcords.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.teamconcords.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
server {
    #listen 80 is default
    server_name www.teamconcords.com;
    return 301 $scheme://teamconcords.com$request_uri;


    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/www.teamconcords.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.teamconcords.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
server {
    if ($host = teamconcords.com) {
        return 301 https://$host$request_uri;
    }


    listen 80;
    listen [::]:80;

    server_name teamconcords.com;
    return 404;
}
server {
    if ($host = www.teamconcords.com) {
        return 301 https://$host$request_uri;
    }

    server_name www.teamconcords.com;
    listen 80;
    return 404;
}
