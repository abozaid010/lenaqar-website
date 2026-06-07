#!/bin/bash
# Sync the VM working copy to the latest remote main branch.
# Fails loudly on any git error — never deploy stale code.

set -Eeuo pipefail
trap 'echo "❌ sync-repo failed on line $LINENO"; exit 1' ERR

REPO_PATH="${REPO_PATH:-$HOME/lenaai-website}"
REPO_URL="${REPO_URL:-git@github-website:abozaid010/lenaai-website.git}"
BRANCH="${BRANCH:-main}"
GIT_SSH_IDENTITY="${GIT_SSH_IDENTITY:-$HOME/.ssh/id_ed25519_website}"

if [ -f "$GIT_SSH_IDENTITY" ]; then
  export GIT_SSH_COMMAND="ssh -i ${GIT_SSH_IDENTITY} -o IdentitiesOnly=yes"
fi

echo "📦 Syncing repository..."
echo "   Path:   $REPO_PATH"
echo "   Remote: $REPO_URL"
echo "   Branch: $BRANCH"

git_safe() {
  git -c safe.directory="$REPO_PATH" "$@"
}

if [ -d "$REPO_PATH/.git" ]; then
  cd "$REPO_PATH"
  echo "🔄 Fetching latest from origin/$BRANCH..."
  git_safe remote -v
  git_safe fetch origin "$BRANCH" --prune --tags
  git_safe checkout "$BRANCH"
  git_safe reset --hard "origin/$BRANCH"
  git_safe clean -fd
else
  if [ -e "$REPO_PATH" ]; then
    echo "⚠️  $REPO_PATH exists but is not a git repo — removing..."
    rm -rf "$REPO_PATH"
  fi
  echo "📥 Cloning repository..."
  mkdir -p "$(dirname "$REPO_PATH")"
  git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$REPO_PATH"
  cd "$REPO_PATH"
fi

DEPLOYED_SHA="$(git_safe rev-parse HEAD)"
echo "📌 VM commit: $DEPLOYED_SHA"
git_safe log -1 --oneline

if [ -n "${EXPECTED_SHA:-}" ]; then
  echo "📌 Expected commit (GitHub push): $EXPECTED_SHA"
  if [ "$DEPLOYED_SHA" != "$EXPECTED_SHA" ]; then
    echo "❌ Commit mismatch — refusing to deploy outdated code."
    exit 1
  fi
  echo "✅ VM matches the pushed commit"
fi
