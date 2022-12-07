#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Copy build assets for nginx
sudo cp -r dist/footballsocial/* /var/www/footballsocial.app/html

cd footballsocial

# pull for latest server code
git pull origin main
pnpm i

# Copy nginx config to server
sudo rm -rf  /etc/nginx/sites-enabled/footballsocial.app
sudo rm -rf  /etc/nginx/sites-available/footballsocial.app
sudo cp -r apps/footballsocial/nginx.conf.d /etc/nginx/sites-available/footballsocial.app
sudo ln -s /etc/nginx/sites-available/footballsocial.app /etc/nginx/sites-enabled/

# start/restart node server
pnpm --filter @concords/footballsocial start -- --port=4002

# check certification
echo 1 1 | sudo certbot certonly -d footballsocial.app -d www.footballsocial.app

# restart nginx
sudo systemctl restart nginx
