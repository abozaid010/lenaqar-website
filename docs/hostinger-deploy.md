# lenaqar.com on the Hostinger VPS

Moved from Vercel on 2026-11-28 (Vercel returned `402 DEPLOYMENT_DISABLED`).

## Layout
| What | Where |
| --- | --- |
| VPS | `root@76.13.144.250` (srv2029194.hstgr.cloud), shared with lenaai.net |
| Source | `/opt/lenaai/src/lenaqar` (previous: `lenaqar.prev`) |
| Env (build + runtime) | `/opt/lenaai/secrets/lenaqar.env` (600) |
| Compose | `/opt/lenaai/compose/docker-compose.lenaqar.yml` (copy of `.deploy/`) |
| Containers | `lenaqar-web-blue` → 127.0.0.1:3010, `lenaqar-web-green` → 127.0.0.1:3011 |
| Live color | `/opt/lenaai/lenaqar_active_color` |
| nginx | site `/etc/nginx/sites-available/lenaqar` (= `.deploy/nginx/lenaqar.conf`), upstream `/etc/nginx/conf.d/lenaqar_upstream.conf` |
| TLS | Let's Encrypt `/etc/letsencrypt/live/lenaqar.com/`, webroot `/var/www/certbot`, `certbot.timer` renews, deploy hook reloads nginx |
| DNS | Namecheap: `@` A and `www` A → 76.13.144.250. MX/SPF (Private Email) untouched |

## Deploy
Merging `main` runs `.github/workflows/deploy-hostinger.yml`: upload `git archive` → build on the VPS
under `/opt/lenaai/.deploy.lock` → start the inactive color → `/api/version` must report the SHA →
switch the upstream → check through nginx → stop the old color → keep 3 images.

Repo secrets: `HOSTINGER_HOST`, `HOSTINGER_SSH_USER`, `HOSTINGER_SSH_KEY`.

One command (from any checkout):
```bash
npm run deploy                  # GitHub Actions deploy of origin/main, waits until live
npm run deploy -- --local       # build this checkout's HEAD on the VPS from this Mac (no CI)
npm run deploy -- --local REF   # a branch, tag or sha
npm run deploy -- --status      # live sha, build time, color
```
`scripts/deploy-hostinger.sh` ends by checking `https://www.lenaqar.com/api/version` reports the new sha.
Vercel auto-deploys are off (`vercel.json` `git.deploymentEnabled: false`).

Verify: `curl -s https://www.lenaqar.com/api/version` and `node scripts/seo-health.mjs`.

## Rollback (seconds)
```bash
# on the VPS: OLD = the color that is not in lenaqar_active_color
docker start lenaqar-web-$OLD
sed -i "s/127.0.0.1:30[0-9][0-9]/127.0.0.1:$PORT_OF_OLD/" /etc/nginx/conf.d/lenaqar_upstream.conf  # blue 3010, green 3011
nginx -t && systemctl reload nginx && echo $OLD > /opt/lenaai/lenaqar_active_color
```

## Env changes
Edit `/opt/lenaai/secrets/lenaqar.env`. `NEXT_PUBLIC_*` are inlined at build: redeploy (re-run the
workflow). Server-only values: `docker compose -p lenaqar-<color> -f /opt/lenaai/compose/docker-compose.lenaqar.yml up -d --force-recreate`
with `LENAQAR_COLOR`, `LENAQAR_HOST_PORT`, `LENAQAR_IMAGE` set, or just redeploy.
`BFF_SECRET` and `REQUIREMENTS_REVALIDATE_SECRET` must equal the backend's values in `agent.env`.

## TLS
`certbot renew --dry-run` tests renewal. Re-issue on a fresh box: install `.deploy/nginx/lenaqar-bootstrap.conf`,
then `certbot certonly --webroot -w /var/www/certbot -d lenaqar.com -d www.lenaqar.com`, then `lenaqar.conf`.
