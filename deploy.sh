#!/usr/bin/zsh
cd home

# pull for latest server code
git pull origin main
pnpm i

# start/restart node server
NODE_ENV=production pm2 startOrReload ecosystem.config.cjs

# Copy nginx config to server
sudo rm -rf  /etc/nginx/sites-enabled/*
sudo rm -rf  /etc/nginx/sites-available/*

# api.ternent.dev
sudo cp -r apps/ternent/nginx.conf.d /etc/nginx/sites-available/ternent.dev
sudo ln -s /etc/nginx/sites-available/ternent.dev /etc/nginx/sites-enabled/

# api.footballsocial.app
sudo cp -r apps/footballsocial/nginx.conf.d /etc/nginx/sites-available/footballsocial.app
sudo ln -s /etc/nginx/sites-available/footballsocial.app /etc/nginx/sites-enabled/

# api.concords.app
sudo cp -r apps/concords/nginx.conf.d /etc/nginx/sites-available/concords.app
sudo ln -s /etc/nginx/sites-available/concords.app /etc/nginx/sites-enabled/

echo "restart NGINX"
# restart nginx
sudo systemctl restart nginx
