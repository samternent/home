server {
    root /var/www/footballsocial.app/html;
    index index.html index.htm index.nginx-debian.html;

    gzip on;
    gzip_types application/json;

    listen 80;
    server_name api.footballsocial.app;

    location / {
        proxy_pass http://localhost:4002;
    }
}
