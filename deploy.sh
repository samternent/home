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
  echo 1 | sudo certbot -d $1.$2 -d www.$1.$2
done
IFS=$OLDIFS

for app in hub.ternent.dev;
do
  set -- $app;
  sudo cp -r dist/$2/* /var/www/$2.$3/html
  sudo cp -r footballsocial/apps/$2/nginx.conf.d /etc/nginx/sites-available/$2.$3
  sudo ln -s /etc/nginx/sites-available/$2.$3 /etc/nginx/sites-enabled/
  # Configure SSL
  echo 1 | sudo certbot -d $2.$3 -d $1.$2.$3
done
IFS=$OLDIFS

echo "restart NGINX"
# restart nginx
sudo systemctl restart nginx
