#!/usr/bin/env bash
# Uso:
#   scripts/db.sh local <start|stop|reset|status|studio>   DB local (Docker, Supabase CLI)
#   scripts/db.sh prod  <push|status|repair> [args...]     Proyecto de producción
# PROD_DB_URL se lee de .env.supabase (no se commitea).
set -euo pipefail
cd "$(dirname "$0")/.."

env="${1:-}"; cmd="${2:-}"; shift 2 || true

case "$env" in
  local)
    case "$cmd" in
      start)
        if ! grep -qE '^SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=.+' supabase/.env 2>/dev/null; then
          echo "⚠️  Falta supabase/.env con las credenciales de Google (ver supabase/.env.example)."
          echo "    El login con Google no va a funcionar en local."
        fi
        npx supabase start "$@" ;;
      stop)   npx supabase stop "$@" ;;
      reset)  npx supabase db reset "$@" ;;   # re-aplica migraciones + seed.sql
      status) npx supabase status "$@" ;;
      studio) xdg-open http://127.0.0.1:54323 >/dev/null 2>&1 || echo "Studio: http://127.0.0.1:54323" ;;
      *) echo "Comando local: start | stop | reset | status | studio"; exit 1 ;;
    esac ;;
  prod)
    [ -f .env.supabase ] || { echo "Falta .env.supabase (copiar de .env.supabase.example)"; exit 1; }
    set -a; . ./.env.supabase; set +a
    url="${PROD_DB_URL:?PROD_DB_URL vacío}"
    case "$cmd" in
      push)   npx supabase db push --remote="$url" "$@" ;;
      status) npx supabase migration list --remote="$url" "$@" ;;
      repair) npx supabase migration repair --remote="$url" "$@" ;;
      *) echo "Comando prod: push | status | repair"; exit 1 ;;
    esac ;;
  *) echo "Uso: scripts/db.sh <local|prod> <comando>"; exit 1 ;;
esac
