# #!/bin/bash
# export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# TODO: Rename repo in git and reeflect here
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

# # Copy build assets for nginx
OLDIFS=$IFS; IFS='.';
for app in footballsocial.app teamconcords.com concords.app gzip.app;
do
  set -- $app;
  sudo cp -r dist/$1/* /var/www/$1.$2/html
  sudo cp -r footballsocial/apps/$1/nginx.conf.d /etc/nginx/sites-available/$1.$2
  sudo ln -s /etc/nginx/sites-available/$1.$2 /etc/nginx/sites-enabled/

  # Configure SSL
done
IFS=$OLDIFS

for app in hub.ternent.dev;
do
  set -- $app;
  sudo cp -r footballsocial/apps/$2/nginx.conf.d /etc/nginx/sites-available/$2.$3
  sudo ln -s /etc/nginx/sites-available/$2.$3 /etc/nginx/sites-enabled/
  # Configure SSL
done
IFS=$OLDIFS

echo 1 | sudo certbot -d footballsocial.app -d www.footballsocial.app
echo 1 | sudo certbot -d teamconcords.com -d www.teamconcords.com
echo 1 | sudo certbot -d concords.app -d www.concords.app
echo 1 | sudo certbot -d gzip.app -d www.gzip.app
echo 1 | sudo certbot -d ternent.dev -d hub.ternent.dev

echo "restart NGINX"
# restart nginx
sudo systemctl restart nginx
