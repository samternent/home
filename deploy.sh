# #!/usr/bin/zsh
# # # export NVM_DIR="$HOME/.nvm"
# # [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
# # [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
# # npm install -g pnpm pm2

# # TODO: Rename repo in git to "home" and reeflect here
# cd footballsocial

# # pull for latest server code
# git pull origin main
# pnpm i

# echo "start node servers"
# # start/restart node server
# NODE_ENV=production pm2 startOrReload ecosystem.config.cjs
# cd ~

# # # Copy nginx config to server
# sudo rm -rf  /etc/nginx/sites-enabled/*
# sudo rm -rf  /etc/nginx/sites-available/*

# # api.ternent.dev
# sudo cp -r footballsocial/apps/ternent/nginx.conf.d /etc/nginx/sites-available/ternent.dev
# sudo ln -s /etc/nginx/sites-available/ternent.dev /etc/nginx/sites-enabled/

# # api.footballsocial.app
# sudo cp -r footballsocial/apps/footballsocial/nginx.conf.d /etc/nginx/sites-available/footballsocial.app
# sudo ln -s /etc/nginx/sites-available/footballsocial.app /etc/nginx/sites-enabled/

# # api.concords.app
# sudo cp -r footballsocial/apps/concords/nginx.conf.d /etc/nginx/sites-available/concords.app
# sudo ln -s /etc/nginx/sites-available/concords.app /etc/nginx/sites-enabled/

# # echo 1 | sudo certbot -d footballsocial.app -d api.footballsocial.app
# # echo 1 | sudo certbot -d concords.app -d api.concords.app
# # echo 1 | sudo certbot -d ternent.dev -d hub.ternent.dev

# echo "restart NGINX"
# # restart nginx
# sudo systemctl restart nginx
