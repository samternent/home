#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# TODO: Rename repo in git and reeflect here
cd footballsocial

# pull for latest server code
git pull origin main
pnpm i

echo "start node servers"
# start/restart node server
NODE_ENV=production pm2 startOrReload ecosystem.config.cjs --only ternent

cd ~

echo "build nginx configs"
# Copy nginx config to server
sudo rm -rf  /etc/nginx/sites-enabled/ternent.dev
sudo rm -rf  /etc/nginx/sites-available/ternent.dev

# Copy build assets for nginx
OLDIFS=$IFS; IFS='.';
sudo cp -r dist/ternent/* /var/www/ternent.dev/html
sudo cp -r footballsocial/apps/ternent/nginx.conf.d /etc/nginx/sites-available/ternent.dev
sudo ln -s /etc/nginx/sites-available/ternent.dev /etc/nginx/sites-enabled/

# Configure SSL
echo 1 | sudo certbot -d ternent.dev -d hub.ternent.dev
IFS=$OLDIFS

echo "restart NGINX"
# restart nginx
sudo systemctl restart nginx
