#!/bin/bash
#
# Deploy to production. Run on the server from anywhere:
#   /var/www/foonhay/release.sh
#
# set -e matters here: without it a failed pull or a failed build carries on to
# the pm2 restart, which cheerfully brings the *old* dist/ back up and reports
# success. A deploy that changes nothing should be loud, not silent.
set -euo pipefail

cd /var/www/foonhay

echo "==> Pulling main"
git pull origin main

echo "==> Installing dependencies"
pnpm install

echo "==> Building"
pnpm build

echo "==> Applying database migrations"
DATABASE_URL='mysql://foonhay_app:Wency2006!$@localhost:3306/foonhay' pnpm db:push

echo "==> Restarting"
pm2 restart ecosystem.config.cjs

echo "==> Done: $(git log --oneline -1)"
