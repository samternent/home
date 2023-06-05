server {
    gzip on;
    gzip_types text/html application/javascript application/json text/css;

    server_name gzip.app;

    location /api/ {
        proxy_pass http://localhost:4007;
    }
}
