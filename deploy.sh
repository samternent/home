#!/usr/bin/zsh
cd home

# pull for latest server code
git pull origin main
pnpm i

# start/restart node server
NODE_ENV=production pm2 startOrReload ecosystem.config.cjs
