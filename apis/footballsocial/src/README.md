# Copy nginx config to server
sudo rm -rf  /etc/nginx/sites-enabled/*
sudo rm -rf  /etc/nginx/sites-available/*

# api.ternent.dev
sudo cp -r apps/footballsocial/nginx.conf.d /etc/nginx/sites-available/footballsocial.app
sudo ln -s /etc/nginx/sites-available/footballsocial.app /etc/nginx/sites-enabled/

certbot

echo "restart NGINX"
# restart nginx
sudo systemctl restart nginx
