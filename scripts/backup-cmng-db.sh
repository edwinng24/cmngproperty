#!/bin/bash
#
# Backs up the cmngproperty database AND .env.local, encrypts the archive, and
# ships it to the Oracle box — the same shape as backup-foonhay-db.sh.
#
#   ./backup-cmng-db.sh              back up and transfer
#   ./backup-cmng-db.sh --local      back up, skip the transfer
#   ./backup-cmng-db.sh --verify F   check an archive decrypts and is complete
#   ./backup-cmng-db.sh --restore F  restore from an archive (asks first)
#
# WHY THIS ONE IS ENCRYPTED AND FOONHAY'S IS NOT
#
# The archive holds two things that must not travel together in the clear:
#   - the database: applicants' names, dates of birth, employment, addresses,
#     and their SSNs as ciphertext
#   - .env.local: APP_ENCRYPTION_KEY, which decrypts exactly those SSNs
#
# Keeping them together is right for disaster recovery — a database you cannot
# decrypt is not a backup — but it makes the archive as sensitive as both
# combined. So it is encrypted under a passphrase stored in neither of them.
#
# Put BACKUP_PASSPHRASE in a password manager. Not on this server, not on the
# Oracle box. Lose it and every archive is landfill.
#
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
# Override any of these in /etc/cmngproperty-backup.env (chmod 600).
CONFIG="${CONFIG:-/etc/cmngproperty-backup.env}"
# shellcheck disable=SC1090
[[ -f "$CONFIG" ]] && source "$CONFIG"

APP_DIR="${APP_DIR:-/var/www/cmngproperty}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/cmngproperty}"
ORACLE_USER="${ORACLE_USER:-ubuntu}"
ORACLE_HOST="${ORACLE_HOST:-144.24.30.249}"
ORACLE_DIR="${ORACLE_DIR:-/home/ubuntu/backups/cmngproperty}"
SSH_KEY="${SSH_KEY:-/root/.ssh/foonhay_backup_key}"
KEEP_DAYS="${KEEP_DAYS:-7}"
BACKUP_PASSPHRASE="${BACKUP_PASSPHRASE:-}"
# ──────────────────────────────────────────────────────────────────────────────

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BASENAME="cmngproperty_db_${TIMESTAMP}"
FILEPATH="${BACKUP_DIR}/${BASENAME}.tar.gz.enc"

say() { echo "[$(date)] $*"; }
die() { echo "[$(date)] error: $*" >&2; exit 1; }

WORK=""
trap '[[ -n "$WORK" && -d "$WORK" ]] && rm -rf "$WORK"' EXIT

# Reads one key from .env.local without sourcing it — the file holds values
# with $ and ! in them that a shell would expand or mangle.
env_get() {
  sed -n "s/^$1=//p" "$APP_DIR/.env.local" 2>/dev/null | head -1 |
    sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

need_pass() {
  [[ -n "$BACKUP_PASSPHRASE" ]] ||
    die "BACKUP_PASSPHRASE is not set — put it in $CONFIG (chmod 600)"
}

encrypt() { openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:BACKUP_PASSPHRASE; }
decrypt() { openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:BACKUP_PASSPHRASE; }

# NOTE: grep -a throughout. The dump contains binary (the encrypted SSN
# column), so plain grep treats the whole file as binary, matches nothing and
# exits 1 — a verification that silently passes on a broken archive.
unpack_to() {
  local file=$1 dest=$2
  decrypt <"$file" | tar -xz -C "$dest" ||
    die "could not decrypt $file — wrong passphrase, or corrupt"
  find "$dest" -maxdepth 1 -mindepth 1 -type d | head -1
}

verify_archive() {
  need_pass
  WORK="$(mktemp -d)"
  local dir; dir="$(unpack_to "$1" "$WORK")"
  [[ -f "$dir/database.sql" ]] || die "no database.sql in the archive"

  local tables
  tables=$(grep -a -c 'CREATE TABLE' "$dir/database.sql" || true)
  [[ "${tables:-0}" -ge 4 ]] || die "only ${tables:-0} tables in the dump — expected 4 or more"
  for t in admin_users applications properties admin_sessions; do
    grep -a -q "CREATE TABLE \`$t\`" "$dir/database.sql" || die "table $t missing from the dump"
  done
  [[ -f "$dir/env.local" ]] && say "  env.local present" || say "  WARNING: no env.local in this archive"
  grep -a -q 'APP_ENCRYPTION_KEY' "$dir/env.local" 2>/dev/null &&
    say "  APP_ENCRYPTION_KEY present — SSNs will be recoverable" ||
    say "  WARNING: no APP_ENCRYPTION_KEY — stored SSNs could NOT be read from this backup"
  say "  verified: $tables tables, $(du -h "$1" | cut -f1) encrypted"
}

restore_archive() {
  need_pass
  WORK="$(mktemp -d)"
  local dir; dir="$(unpack_to "$1" "$WORK")"
  local db; db=$(env_get DB_NAME) || die "cannot read DB_NAME from $APP_DIR/.env.local"

  echo "This REPLACES every table in \"$db\" on $(hostname)."
  read -r -p "Type the database name to confirm: " typed
  [[ "$typed" == "$db" ]] || die "aborted"

  local cnf="$WORK/my.cnf"
  printf '[client]\nuser=%s\npassword=%s\nhost=%s\nport=%s\n' \
    "$(env_get DB_USER)" "$(env_get DB_PASSWORD)" \
    "$(env_get DB_HOST || echo 127.0.0.1)" "$(env_get DB_PORT || echo 3306)" >"$cnf"
  chmod 600 "$cnf"
  mysql --defaults-extra-file="$cnf" "$db" <"$dir/database.sql"
  say "restored $db"
  say "env.local is in the archive at $dir/env.local — NOT copied over your live one"
}

do_backup() {
  local transfer=$1
  need_pass
  command -v mysqldump >/dev/null || die "mysqldump not installed"
  command -v openssl   >/dev/null || die "openssl not installed"

  local db; db=$(env_get DB_NAME) || die "cannot read DB_NAME from $APP_DIR/.env.local"
  [[ -n "$db" ]] || die "DB_NAME is empty in $APP_DIR/.env.local"

  mkdir -p "$BACKUP_DIR"
  WORK="$(mktemp -d)"
  local out="$WORK/$BASENAME"
  mkdir -p "$out"

  # A defaults-file, not -p"$PASS": the latter shows the password in `ps` to
  # every user on the box for as long as the dump runs.
  local cnf="$WORK/my.cnf"
  printf '[client]\nuser=%s\npassword=%s\nhost=%s\nport=%s\n' \
    "$(env_get DB_USER)" "$(env_get DB_PASSWORD)" \
    "$(env_get DB_HOST || echo 127.0.0.1)" "$(env_get DB_PORT || echo 3306)" >"$cnf"
  chmod 600 "$cnf"

  # --set-gtid-purged=OFF: a single-database dump otherwise carries the
  #   server's GTID set, which refuses to load into a server that has its own.
  # --skip-masking-policies: mysqldump 8.4+ tries to read a system table the
  #   app user cannot see and prints an error, though the dump still succeeds.
  # --column-statistics=0: histogram statements the restore does not need.
  local common=(--defaults-extra-file="$cnf" --routines --triggers
                --no-tablespaces --default-character-set=utf8mb4 --add-drop-table
                --set-gtid-purged=OFF --skip-masking-policies --column-statistics=0)

  # --single-transaction is the one we want: a consistent snapshot with no
  # locking. It needs RELOAD (or the narrower FLUSH_TABLES) because mysqldump
  # issues FLUSH TABLES first, and an application user scoped to one database
  # has neither. Fall back to the default table locking, which only needs the
  # LOCK TABLES grant the app user already has. Brief, and this database is small.
  if mysqldump "${common[@]}" --single-transaction "$db" >"$out/database.sql" 2>"$WORK/err"; then
    say "dumped $db (single-transaction, no locking)"
  else
    grep -q 'RELOAD\|FLUSH' "$WORK/err" ||
      { cat "$WORK/err" >&2; die "mysqldump failed"; }
    say "no RELOAD privilege — falling back to table locking"
    mysqldump "${common[@]}" --lock-tables "$db" >"$out/database.sql" ||
      die "mysqldump failed"
    say "dumped $db (lock-tables)"
  fi

  local tables
  tables=$(grep -a -c 'CREATE TABLE' "$out/database.sql" || true)
  [[ "${tables:-0}" -ge 4 ]] || die "dump has only ${tables:-0} tables — refusing to ship a bad backup"

  if [[ -f "$APP_DIR/.env.local" ]]; then
    cp "$APP_DIR/.env.local" "$out/env.local"
  else
    say "WARNING: no .env.local at $APP_DIR — SSNs in this backup would be unrecoverable"
  fi

  {
    echo "created:  $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo "host:     $(hostname)"
    echo "database: $db"
    echo "tables:   $tables"
    echo "commit:   $(git -C "$APP_DIR" rev-parse --short HEAD 2>/dev/null || echo unknown)"
  } >"$out/MANIFEST.txt"

  tar -cz -C "$WORK" "$BASENAME" | encrypt >"$FILEPATH"
  chmod 600 "$FILEPATH"
  say "Backup created: $FILEPATH ($(du -h "$FILEPATH" | cut -f1))"

  # Read it back before trusting it. A backup that has never been decrypted is
  # a hypothesis, not a backup.
  rm -rf "$WORK"; WORK=""
  verify_archive "$FILEPATH"
  rm -rf "$WORK"; WORK=""

  if [[ "$transfer" == "yes" ]]; then
    local ssh_opts=(-o StrictHostKeyChecking=no)
    [[ -f "$SSH_KEY" ]] && ssh_opts+=(-i "$SSH_KEY")
    ssh "${ssh_opts[@]}" "${ORACLE_USER}@${ORACLE_HOST}" "mkdir -p ${ORACLE_DIR}"
    scp "${ssh_opts[@]}" "$FILEPATH" "${ORACLE_USER}@${ORACLE_HOST}:${ORACLE_DIR}/"
    say "Transferred to ${ORACLE_HOST}:${ORACLE_DIR}/$(basename "$FILEPATH")"
    ssh "${ssh_opts[@]}" "${ORACLE_USER}@${ORACLE_HOST}" \
      "find ${ORACLE_DIR} -name 'cmngproperty_db_*.tar.gz.enc' -mtime +${KEEP_DAYS} -delete"
    say "Cleaned up Oracle backups older than ${KEEP_DAYS} days"
  fi

  find "$BACKUP_DIR" -name 'cmngproperty_db_*.tar.gz.enc' -mtime "+${KEEP_DAYS}" -delete
  say "Cleaned up local backups older than ${KEEP_DAYS} days"
}

case "${1:-}" in
  --verify)  [[ -n "${2:-}" ]] || die "usage: $0 --verify <archive>";  verify_archive "$2" ;;
  --restore) [[ -n "${2:-}" ]] || die "usage: $0 --restore <archive>"; restore_archive "$2" ;;
  --local)   do_backup no ;;
  "")        do_backup yes ;;
  -h|--help) sed -n '2,30p' "$0" ;;
  *)         die "unknown argument: $1" ;;
esac
