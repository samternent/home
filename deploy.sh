#!/usr/bin/zsh
# # export NVM_DIR="$HOME/.nvm"
# [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
# [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
# npm install -g pnpm pm2

whoami

# TODO: Rename repo in git to "home" and reeflect here
cd footballsocial

# pull for latest server code
git pull origin main
pnpm i

echo "start node servers"
# start/restart node server
NODE_ENV=production pm2 startOrReload ecosystem.config.cjs

cd ~

# echo "build nginx configs"
# # Copy nginx config to server
sudo rm -rf  /etc/nginx/sites-enabled/*
sudo rm -rf  /etc/nginx/sites-available/*

for app in api.ternent.dev api.footballsocial.app api.concords.app;
do
  set -- $app;
  sudo cp -r footballsocial/apps/$2/nginx.conf.d /etc/nginx/sites-available/$2.$3
  sudo ln -s /etc/nginx/sites-available/$2.$3 /etc/nginx/sites-enabled/
  # Configure SSL
done
IFS=$OLDIFS

# echo 1 | sudo certbot -d footballsocial.app -d api.footballsocial.app
# echo 1 | sudo certbot -d concords.app -d api.concords.app
# echo 1 | sudo certbot -d ternent.dev -d hub.ternent.dev

echo "restart NGINX"
# restart nginx
sudo systemctl restart nginx
