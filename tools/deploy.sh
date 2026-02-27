#!/usr/bin/env bash
set -euo pipefail

PROJECT="${1:?Project required (e.g. clpr-x)}"
MESSAGE="${2:?Commit message required}"
TAG="${3:-${PROJECT}-prod}"
PATH_IN_REPO="${4:-projects/${PROJECT}/site.js}"
DO_PURGE="${5:-true}"  # true/false

REMOTE="$(git remote get-url origin)"

# Parse OWNER/REPO
if [[ "$REMOTE" =~ github\.com[:/](.+)/(.+?)(\.git)?$ ]]; then
  OWNER="${BASH_REMATCH[1]}"
  REPO="${BASH_REMATCH[2]}"
else
  echo "Could not parse OWNER/REPO from remote: $REMOTE" >&2
  exit 1
fi

OWNER_REPO="${OWNER}/${REPO}"

git add .
git commit -m "$MESSAGE"
git push

git tag -f "$TAG"
git push -f origin "$TAG"

CDN_URL="https://cdn.jsdelivr.net/gh/${OWNER_REPO}@${TAG}/${PATH_IN_REPO}"
SCRIPT_TAG="<script src=\"${CDN_URL}\"></script>"
PURGE_URL="https://purge.jsdelivr.net/gh/${OWNER_REPO}@${TAG}/${PATH_IN_REPO}"

echo ""
echo "Webflow script tag (stable):"
echo "$SCRIPT_TAG"
echo ""
echo "Purge URL:"
echo "$PURGE_URL"
echo ""

if [[ "$DO_PURGE" == "true" ]]; then
  curl -s "$PURGE_URL" > /dev/null
  echo "Purge triggered!"
fi