server {
    root /var/www/ternent.dev/html;
    index index.html index.htm index.nginx-debian.html;

    gzip on;
    gzip_types application/json;

    listen 80;
    server_name api.ternent.dev;

    location / {
        proxy_pass http://localhost:4005;
    }
}
