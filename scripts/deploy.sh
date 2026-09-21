#!/usr/bin/env bash
#
# Release script for cmngproperty.com. Run this ON THE SERVER.
#
#   ./deploy.sh              release the configured branch
#   ./deploy.sh --force      release even if the commit has not changed
#   ./deploy.sh --ref v1.2   release a specific branch, tag or SHA
#   ./deploy.sh rollback     switch back to the previous release
#   ./deploy.sh status       show what is currently live
#
# Layout it builds under APP_ROOT:
#
#   releases/20260921-104233-a1b2c3d/   one full build per release
#   current -> releases/...             symlink the service runs from
#   shared/.env.local                   secrets, symlinked into each release
#   deploy.log                          append-only history
#
# Releases are immutable and the symlink swap is atomic, so a rollback is
# instant and never rebuilds. Old releases are pruned to KEEP_RELEASES.
#
set -Eeuo pipefail
IFS=$'\n\t'

# ─────────────────────────────────────────────────────────── configuration
# Every value can be overridden by an env var or by /etc/cmngproperty.env.
CONFIG_FILE="${CONFIG_FILE:-/etc/cmngproperty.env}"
# shellcheck disable=SC1090
[[ -f "$CONFIG_FILE" ]] && source "$CONFIG_FILE"

APP_NAME="${APP_NAME:-cmngproperty}"
APP_ROOT="${APP_ROOT:-/srv/cmngproperty}"
REPO_URL="${REPO_URL:-git@github.com:edwinng24/cmngproperty.git}"
BRANCH="${BRANCH:-main}"
PORT="${PORT:-3000}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
HEALTH_PATH="${HEALTH_PATH:-/}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-90}"
# systemd | pm2 | pidfile | auto
SERVICE_MANAGER="${SERVICE_MANAGER:-auto}"
NODE_ENV=production
export NODE_ENV

RELEASES_DIR="$APP_ROOT/releases"
SHARED_DIR="$APP_ROOT/shared"
CURRENT_LINK="$APP_ROOT/current"
LOG_FILE="$APP_ROOT/deploy.log"
LOCK_FILE="$APP_ROOT/.deploy.lock"

# ──────────────────────────────────────────────────────────────── plumbing
log()  { printf '%s  %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*" | tee -a "$LOG_FILE" >&2; }
step() { printf '\n\033[1;32m==>\033[0m \033[1m%s\033[0m\n' "$*" >&2; log "STEP $*"; }
warn() { printf '\033[1;33mwarning:\033[0m %s\n' "$*" >&2; log "WARN $*"; }
die()  { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; log "ERROR $*"; exit 1; }

on_error() {
  local line=$1
  warn "failed at line $line"
  # A release that never went live is just clutter — bin it.
  if [[ -n "${RELEASE_DIR:-}" && -z "${SWAPPED:-}" && -d "${RELEASE_DIR:-}" ]]; then
    warn "discarding unpromoted release $(basename "$RELEASE_DIR")"
    rm -rf "$RELEASE_DIR"
  fi
  # If we already swapped the symlink, put it back before giving up.
  if [[ -n "${PREVIOUS_RELEASE:-}" && -n "${SWAPPED:-}" ]]; then
    warn "rolling back to $(basename "$PREVIOUS_RELEASE")"
    ln -sfn "$PREVIOUS_RELEASE" "$CURRENT_LINK"
    restart_service || warn "rollback restart failed — service may be down"
  fi
  die "release aborted"
}
trap 'on_error $LINENO' ERR

detect_service_manager() {
  if [[ "$SERVICE_MANAGER" != auto ]]; then echo "$SERVICE_MANAGER"; return; fi
  if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files 2>/dev/null | grep -q "^${APP_NAME}.service"; then
    echo systemd
  elif command -v pm2 >/dev/null 2>&1; then
    echo pm2
  else
    echo pidfile
  fi
}

restart_service() {
  local mgr; mgr=$(detect_service_manager)
  case "$mgr" in
    systemd)
      log "systemctl restart $APP_NAME"
      sudo -n systemctl restart "$APP_NAME" 2>/dev/null || systemctl restart "$APP_NAME"
      ;;
    pm2)
      log "pm2 reload $APP_NAME"
      # --update-env so a changed .env.local is picked up.
      pm2 describe "$APP_NAME" >/dev/null 2>&1 \
        && pm2 reload "$APP_NAME" --update-env \
        || (cd "$CURRENT_LINK" && pm2 start npm --name "$APP_NAME" -- start)
      pm2 save >/dev/null 2>&1 || true
      ;;
    pidfile)
      local pidfile="$APP_ROOT/$APP_NAME.pid"
      if [[ -f "$pidfile" ]] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
        log "stopping pid $(cat "$pidfile")"
        kill "$(cat "$pidfile")" 2>/dev/null || true
        for _ in $(seq 1 20); do
          kill -0 "$(cat "$pidfile")" 2>/dev/null || break
          sleep 0.5
        done
        kill -9 "$(cat "$pidfile")" 2>/dev/null || true
      fi
      log "starting on port $PORT"
      ( cd "$CURRENT_LINK" && PORT="$PORT" nohup npm start >>"$APP_ROOT/app.log" 2>&1 & echo $! >"$pidfile" )
      ;;
  esac
}

# Polls until the app answers 2xx/3xx, or gives up.
wait_for_health() {
  local url=$1 deadline=$((SECONDS + HEALTH_TIMEOUT)) code
  while (( SECONDS < deadline )); do
    code=$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 5 "$url" 2>/dev/null || echo 000)
    if [[ "$code" =~ ^[23] ]]; then
      log "health OK $url -> $code"
      return 0
    fi
    sleep 2
  done
  warn "health check never passed for $url (last code ${code:-none})"
  return 1
}

free_port() {
  # A scratch port to smoke-test the new build before it goes live.
  local p
  for p in $(seq 34000 34099); do
    if ! (command -v lsof >/dev/null 2>&1 && lsof -i ":$p" >/dev/null 2>&1) \
       && ! (command -v ss   >/dev/null 2>&1 && ss -ltn 2>/dev/null | grep -q ":$p "); then
      echo "$p"; return 0
    fi
  done
  die "no free scratch port in 34000-34099"
}

# ───────────────────────────────────────────────────────────── subcommands
cmd_status() {
  printf 'app          : %s\n' "$APP_NAME"
  printf 'root         : %s\n' "$APP_ROOT"
  printf 'service      : %s\n' "$(detect_service_manager)"
  printf 'port         : %s\n' "$PORT"
  if [[ -L "$CURRENT_LINK" ]]; then
    printf 'current      : %s\n' "$(basename "$(readlink "$CURRENT_LINK")")"
    printf 'commit       : %s\n' "$(cat "$CURRENT_LINK/RELEASE_SHA" 2>/dev/null || echo unknown)"
  else
    printf 'current      : (nothing deployed)\n'
  fi
  printf 'releases     : %s\n' "$(ls -1 "$RELEASES_DIR" 2>/dev/null | wc -l | tr -d ' ')"
  local code
  code=$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:$PORT$HEALTH_PATH" 2>/dev/null || echo 000)
  printf 'health       : %s\n' "$code"
}

cmd_rollback() {
  [[ -L "$CURRENT_LINK" ]] || die "nothing is deployed yet"
  local current previous
  current=$(basename "$(readlink "$CURRENT_LINK")")
  previous=$(ls -1 "$RELEASES_DIR" | sort | grep -v "^${current}$" | tail -n 1 || true)
  [[ -n "$previous" ]] || die "no previous release to roll back to"

  step "Rolling back: $current -> $previous"
  PREVIOUS_RELEASE="$RELEASES_DIR/$current"
  ln -sfn "$RELEASES_DIR/$previous" "$CURRENT_LINK"
  SWAPPED=1
  restart_service
  wait_for_health "http://127.0.0.1:$PORT$HEALTH_PATH" \
    || die "rolled-back release is not healthy either — investigate $APP_ROOT/app.log"
  log "ROLLBACK ok now=$previous"
  step "Rolled back to $previous"
}

cmd_deploy() {
  local ref="${REF:-$BRANCH}" force="${FORCE:-0}"

  step "Preflight"
  command -v git  >/dev/null || die "git not installed"
  command -v node >/dev/null || die "node not installed"
  command -v npm  >/dev/null || die "npm not installed"
  command -v curl >/dev/null || die "curl not installed"
  local node_major; node_major=$(node -p 'process.versions.node.split(".")[0]')
  (( node_major >= 20 )) || die "Next.js 16 needs Node 20+, this is $(node -v)"
  log "node $(node -v), npm $(npm -v), manager $(detect_service_manager)"

  mkdir -p "$RELEASES_DIR" "$SHARED_DIR"
  [[ -f "$SHARED_DIR/.env.local" ]] \
    || warn "$SHARED_DIR/.env.local missing — the contact form will refuse submissions in production"

  step "Fetching $ref from $REPO_URL"
  local work="$APP_ROOT/.repo"
  if [[ -d "$work/.git" ]]; then
    git -C "$work" remote set-url origin "$REPO_URL"
    git -C "$work" fetch --prune --tags origin
  else
    rm -rf "$work"
    git clone --quiet "$REPO_URL" "$work"
  fi
  git -C "$work" checkout --quiet --detach "origin/$ref" 2>/dev/null \
    || git -C "$work" checkout --quiet --detach "$ref"
  local sha short
  sha=$(git -C "$work" rev-parse HEAD)
  short=${sha:0:7}
  log "resolved $ref -> $sha"

  local live_sha=""
  [[ -f "$CURRENT_LINK/RELEASE_SHA" ]] && live_sha=$(cat "$CURRENT_LINK/RELEASE_SHA")
  if [[ "$sha" == "$live_sha" && "$force" != "1" ]]; then
    step "Already on $short — nothing to do (use --force to rebuild)"
    return 0
  fi

  local stamp release
  stamp="$(date -u '+%Y%m%d-%H%M%S')-$short"
  release="$RELEASES_DIR/$stamp"
  RELEASE_DIR="$release"
  step "Building release $stamp"

  # Export the tree rather than copying .git — releases stay small and immutable.
  mkdir -p "$release"
  git -C "$work" archive "$sha" | tar -x -C "$release"
  echo "$sha" >"$release/RELEASE_SHA"

  # Runtime secrets live outside the release and are shared across all of them.
  ln -sfn "$SHARED_DIR/.env.local" "$release/.env.local"

  # Reuse the previous node_modules when the lockfile is unchanged: npm ci
  # wipes and reinstalls from scratch, which is slow and needs the registry.
  PREVIOUS_RELEASE=""
  [[ -L "$CURRENT_LINK" ]] && PREVIOUS_RELEASE=$(readlink -f "$CURRENT_LINK" 2>/dev/null || readlink "$CURRENT_LINK")
  if [[ -n "$PREVIOUS_RELEASE" && -d "$PREVIOUS_RELEASE/node_modules" ]] \
     && cmp -s "$PREVIOUS_RELEASE/package-lock.json" "$release/package-lock.json"; then
    log "lockfile unchanged — reusing node_modules"
    cp -R "$PREVIOUS_RELEASE/node_modules" "$release/node_modules"
  else
    step "Installing dependencies (npm ci)"
    # --include=dev is required: NODE_ENV=production would otherwise skip
    # devDependencies, and @tailwindcss/postcss + typescript are build-time deps.
    ( cd "$release" && npm ci --include=dev --no-audit --no-fund )
  fi

  step "next build"
  ( cd "$release" && npm run build )

  step "Smoke-testing the new build before it goes live"
  local scratch; scratch=$(free_port)
  ( cd "$release" && PORT="$scratch" nohup npm start >"$release/smoke.log" 2>&1 & echo $! >"$release/smoke.pid" )
  local smoke_pid; smoke_pid=$(cat "$release/smoke.pid")
  local smoke_ok=0
  wait_for_health "http://127.0.0.1:$scratch$HEALTH_PATH" && smoke_ok=1 || true
  kill "$smoke_pid" 2>/dev/null || true
  sleep 1
  kill -9 "$smoke_pid" 2>/dev/null || true
  rm -f "$release/smoke.pid"
  if (( ! smoke_ok )); then
    warn "new build failed its smoke test; leaving the current release live"
    tail -n 30 "$release/smoke.log" >&2 || true
    die "release $stamp not promoted"
  fi

  step "Promoting $stamp"
  ln -sfn "$release" "$CURRENT_LINK"
  SWAPPED=1
  restart_service
  wait_for_health "http://127.0.0.1:$PORT$HEALTH_PATH" \
    || die "service unhealthy after restart"

  step "Pruning old releases (keeping $KEEP_RELEASES)"
  local current_base; current_base=$(basename "$release")
  # shellcheck disable=SC2012
  ls -1 "$RELEASES_DIR" | sort -r | tail -n +$((KEEP_RELEASES + 1)) | while read -r old; do
    [[ "$old" == "$current_base" ]] && continue
    log "removing old release $old"
    rm -rf "${RELEASES_DIR:?}/$old"
  done

  log "DEPLOY ok release=$stamp sha=$sha"
  step "Live: $stamp ($short) on port $PORT"
}

# ───────────────────────────────────────────────────────────────── dispatch
SUBCOMMAND=deploy
REF=""
FORCE=0
while (( $# )); do
  case "$1" in
    deploy|rollback|status) SUBCOMMAND=$1 ;;
    --ref)   REF="${2:?--ref needs a value}"; shift ;;
    --force) FORCE=1 ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) die "unknown argument: $1" ;;
  esac
  shift
done
export REF FORCE

mkdir -p "$APP_ROOT"
touch "$LOG_FILE"

# One release at a time.
exec 9>"$LOCK_FILE"
if command -v flock >/dev/null 2>&1; then
  flock -n 9 || die "another deploy is already running"
fi

case "$SUBCOMMAND" in
  deploy)   cmd_deploy ;;
  rollback) cmd_rollback ;;
  status)   cmd_status ;;
esac
