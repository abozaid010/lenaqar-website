#!/usr/bin/env bash
# Deploy lenaqar.com to the Hostinger VPS (production). Vercel is no longer used.
#
#   npm run deploy                 # run the GitHub Actions deploy for origin/main and wait for it
#   npm run deploy -- --local      # deploy this checkout's HEAD straight from this Mac over SSH
#   npm run deploy -- --local REF  # deploy a branch/tag/sha straight from this Mac
#   npm run deploy -- --status     # show what is live (sha, build time, color)
#
# Both paths run .deploy/hostinger-lenaqar-deploy.sh on the VPS: build -> start the
# inactive color -> health check -> switch nginx -> stop the old color. If a check
# fails before the switch, the live site is untouched. Runbook: docs/hostinger-deploy.md
#
# Env overrides: LENAQAR_VPS (default root@76.13.144.250),
#                LENAQAR_VPS_KEY (default ~/workspace/LENAAI-Agent/migration/id_hostinger_lenaai)
set -Eeuo pipefail

REPO="abozaid010/lenaqar-website"
WORKFLOW="deploy-hostinger.yml"
SITE="https://www.lenaqar.com"
VPS="${LENAQAR_VPS:-root@76.13.144.250}"
KEY="${LENAQAR_VPS_KEY:-$HOME/workspace/LENAAI-Agent/migration/id_hostinger_lenaai}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

die() { echo "ERROR: $*" >&2; exit 1; }
ssh_vps() { ssh -i "$KEY" -o IdentitiesOnly=yes -o BatchMode=yes -o ConnectTimeout=15 -o ServerAliveInterval=30 "$VPS" "$@"; }

live_sha() { curl -fsS --max-time 15 "$SITE/api/version" 2>/dev/null | sed -n 's/.*"sha":"\([^"]*\)".*/\1/p'; }

wait_live() { # wait_live <short-sha>
  local want="$1" got=""
  for _ in $(seq 1 20); do
    got="$(live_sha || true)"
    if [ "$got" = "$want" ]; then echo "LIVE: $SITE is serving $want"; return 0; fi
    sleep 6
  done
  die "$SITE/api/version reports '${got:-nothing}', expected $want"
}

status() {
  echo "live: $(curl -fsS --max-time 15 "$SITE/api/version" || echo unreachable)"
  if [ -f "$KEY" ]; then
    ssh_vps 'echo "color: $(cat /opt/lenaai/lenaqar_active_color)"; docker ps --filter name=lenaqar-web --format "{{.Names}}  {{.Image}}  {{.Status}}"'
  fi
}

deploy_ci() {
  command -v gh >/dev/null || die "GitHub CLI (gh) is required"
  git fetch -q origin main
  local sha; sha="$(git rev-parse origin/main | cut -c1-7)"
  echo "==> GitHub Actions deploy of origin/main ($sha)"
  local before; before="$(gh run list -R "$REPO" -w "$WORKFLOW" -L 1 --json databaseId -q '.[0].databaseId' 2>/dev/null || true)"
  gh workflow run "$WORKFLOW" -R "$REPO" --ref main
  local run=""
  for _ in $(seq 1 20); do
    sleep 3
    run="$(gh run list -R "$REPO" -w "$WORKFLOW" -L 1 --json databaseId -q '.[0].databaseId')"
    [ -n "$run" ] && [ "$run" != "$before" ] && break
  done
  [ -n "$run" ] && [ "$run" != "$before" ] || die "could not find the new workflow run"
  echo "run: https://github.com/$REPO/actions/runs/$run"
  gh run watch "$run" -R "$REPO" --exit-status --interval 20 >/dev/null || {
    gh run view "$run" -R "$REPO" --log-failed | tail -40
    die "deploy workflow failed (live site unchanged unless the log says it switched)"
  }
  wait_live "$sha"
}

deploy_local() {
  local ref="${1:-HEAD}"
  [ -f "$KEY" ] || die "SSH key not found: $KEY (set LENAQAR_VPS_KEY)"
  git rev-parse --verify -q "$ref^{commit}" >/dev/null || die "unknown ref: $ref"
  if [ "$ref" = "HEAD" ] && [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    die "uncommitted changes: commit them first (git archive ships committed files only)"
  fi
  local sha tag; sha="$(git rev-parse "$ref^{commit}" | cut -c1-7)"
  tag="$(date -u +%Y%m%d%H%M)-$sha"
  echo "==> upload $ref ($sha) to $VPS:/opt/lenaai/src/lenaqar"
  git archive --format=tar "$ref" | gzip | ssh_vps '
    set -Eeuo pipefail
    S=/opt/lenaai/src
    rm -rf "$S/lenaqar.new" && mkdir -p "$S/lenaqar.new"
    tar -xz -C "$S/lenaqar.new"
    rm -rf "$S/lenaqar.prev"
    if [ -d "$S/lenaqar" ]; then mv "$S/lenaqar" "$S/lenaqar.prev"; fi
    mv "$S/lenaqar.new" "$S/lenaqar"'
  echo "==> build + blue/green deploy $tag (about 5 minutes)"
  # The deploy script comes from the same ref, not from the working tree.
  git show "$ref:.deploy/hostinger-lenaqar-deploy.sh" | ssh_vps "TAG=$tag GIT_SHA=$sha bash -s"
  wait_live "$sha"
}

case "${1:-}" in
  ""|--ci) deploy_ci ;;
  --local) deploy_local "${2:-HEAD}" ;;
  --status) status ;;
  -h|--help) sed -n '2,15p' "$0" ;;
  *) die "unknown option: $1 (see --help)" ;;
esac
