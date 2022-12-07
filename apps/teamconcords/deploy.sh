#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

cd footballsocial/apps/teamconcords

# Copy build assets for nginx
sudo cp -r dist/* /var/www/teamconcords.com/html

ls
# Copy nginx config to server
sudo rm -rf  /etc/nginx/sites-enabled/teamconcords.com
sudo rm -rf  /etc/nginx/sites-available/teamconcords.com
sudo cp -r nginx.conf.d /etc/nginx/sites-available/teamconcords.com
sudo ln -s /etc/nginx/sites-available/teamconcords.com /etc/nginx/sites-enabled/

# pull for latest server code
git pull origin main

# start/restart node server
pnpm i
pnpm --filter @concords/teamconcords start -- --port=4003

# check certification
echo 1 1 | sudo certbot certonly -d teamconcords.com -d www.teamconcords.com

# restart nginx
sudo systemctl restart nginx
