#!/bin/bash
#
# Deploy to production. Run on the server from anywhere:
#   /var/www/cmngproperty/release.sh
#
# set -e matters here: without it a failed pull or a failed build carries on to
# the pm2 restart, which cheerfully brings the *old* .next/ back up and reports
# success. A deploy that changes nothing should be loud, not silent.
set -euo pipefail

APP=cmngproperty
PORT=3002          # 3000 is foonhay's Express, 3001 is zpane's
DIR=/var/www/cmngproperty

cd "$DIR"

echo "==> Pulling main"
git pull origin main

echo "==> Installing dependencies"
# --include=dev is not optional. Tailwind and TypeScript are devDependencies
# but they are what *produces* the production build; with NODE_ENV=production
# set, a plain `npm ci` skips them and the build dies on
# "Cannot find module '@tailwindcss/postcss'".
npm ci --include=dev --no-audit --no-fund

echo "==> Building"
npm run build

echo "==> Restarting"
# --update-env so a changed .env.local is picked up. The || branch covers the
# very first deploy, when the process does not exist yet.
pm2 restart "$APP" --update-env \
  || PORT="$PORT" pm2 start npm --name "$APP" -- start
pm2 save >/dev/null

echo "==> Checking it came up"
# pm2 reports "online" the moment node starts, which is before Next is
# listening — and well before it has failed to boot. Ask the app itself.
for i in $(seq 1 20); do
  # -s not -sS: a refused connection on the first attempt or two is normal
  # while Next boots, and printing curl's error there makes a healthy deploy
  # look broken. The failure case below is the one worth being loud about.
  if curl -fs -o /dev/null "http://127.0.0.1:$PORT/"; then
    echo "    healthy on :$PORT (attempt $i)"
    break
  fi
  if [ "$i" = 20 ]; then
    echo "    NOT RESPONDING on :$PORT after 40s"
    curl -sS -o /dev/null "http://127.0.0.1:$PORT/" || true   # show why
    echo "    pm2 logs $APP --lines 50"
    exit 1
  fi
  sleep 2
done

echo "==> Done: $(git log --oneline -1)"
