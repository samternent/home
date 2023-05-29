server {
    gzip on;
    gzip_types application/json;

    listen 80;
    server_name hub.ternent.dev;

    location / {
        proxy_pass http://localhost:4005;
    }
}
