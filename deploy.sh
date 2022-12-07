#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Copy build assets for nginx
sudo cp -r dist/footballsocial/* /var/www/footballsocial.app/html
sudo cp -r dist/teamconcords/* /var/www/teamconcords.com/html
sudo cp -r dist/concords/* /var/www/concords.app/html
sudo cp -r dist/ternent/* /var/www/ternent.dev/html

# TODO: Rename repo in git and reeflect here
cd footballsocial

# pull for latest server code
git pull origin main
pnpm i

# Copy nginx config to server
sudo rm -rf  /etc/nginx/sites-enabled/*
sudo rm -rf  /etc/nginx/sites-available/*

sudo cp -r apps/footballsocial/nginx.conf.d /etc/nginx/sites-available/footballsocial.app
sudo cp -r apps/teamconcords/nginx.conf.d /etc/nginx/sites-available/teamconcords.com
sudo cp -r apps/concords/nginx.conf.d /etc/nginx/sites-available/concords.app
sudo cp -r apps/ternent/nginx.conf.d /etc/nginx/sites-available/ternent.dev

sudo ln -s /etc/nginx/sites-available/footballsocial.app /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/teamconcords.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/concords.app /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/ternent.dev /etc/nginx/sites-enabled/

# start/restart node server
pnpm --filter @concords/footballsocial start -- --port=4002
pnpm --filter @concords/teamconcords start -- --port=4003
pnpm --filter @concords/concords start -- --port=4004
pnpm --filter @concords/ternent start -- --port=4005

# check certification
echo 1 | sudo certbot -d footballsocial.app -d www.footballsocial.app
echo 1 | sudo certbot -d teamconcords.com -d www.teamconcords.com
echo 1 | sudo certbot -d concords.app -d www.concords.app
echo 1 | sudo certbot -d ternent.dev -d www.ternent.dev

# restart nginx
sudo systemctl restart nginx
