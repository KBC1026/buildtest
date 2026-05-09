#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_URL="https://KBC1026@github.com/KBC1026/buildtest.git"
COMMIT_MESSAGE="${1:-Update site}"

export GIT_ASKPASS=
export GIT_TERMINAL_PROMPT=1

cd "$ROOT_DIR"

current_branch="$(git branch --show-current)"
if [[ "$current_branch" != "main" ]]; then
  echo "현재 브랜치가 main이 아닙니다: $current_branch"
  exit 1
fi

git remote set-url origin "$REMOTE_URL"

if [[ -n "$(git status --porcelain)" ]]; then
  git add index.html config.js style.css main.js app.py README.md blueprint.md .idx .vscode functions package.json wrangler.toml render.yaml requirements.txt deploy.sh .gitignore
  git commit -m "$COMMIT_MESSAGE"
else
  echo "main에 커밋할 변경사항이 없습니다."
fi

git push origin main

echo
echo "main push 완료."
echo "Cloudflare Pages에 GitHub 저장소가 연결되어 있으면 자동 배포됩니다."
echo "수동 배포가 필요하면 npm run deploy:cloudflare 를 실행하세요."
