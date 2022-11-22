# Football Social

A social discussions app for Football.

[footballsocial.app](https://footballsocial.app/leagues/WC)

## About 

Hey 👋

Over the summer (2022) I built a small full-stack football discussions app, mainly to sharpen a few regressing skills and learn a couple of new ones.
Now with the FIFA World Cup firmly underway I’d thought it the appropriate time open-source and “release” it.

## Technical

On the backend it’s made up from the free tier on [football-data.org](https://www.football-data.org/) , with a node proxy & redis free tier caching layer to limit requests. The server and frontend are served from a non-dedicated DigitalOcean linux droplet through NGINX and pm2m. 

It’s leveraging a free tier Supabase instance for login and discussion threads and the frontend is built on VueJS, Vite & tailwind with a flutter of open-source offerings used throughout and is all deployed to through Github actions and ssh.

---

**DigitalOcean is the only cost associated with the project at $5p/m. Although it's a shared droplet where I run all my personal projects through [ternent.dev](https://www.ternent.dev) and not a dedicated app cost.**
