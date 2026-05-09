#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_URL="https://KBC1026@github.com/KBC1026/buildtest.git"
PAGES_URL="https://KBC1026.github.io/buildtest/"
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
  git add index.html style.css main.js app.py README.md blueprint.md .idx .vscode deploy.sh
  git commit -m "$COMMIT_MESSAGE"
else
  echo "main에 커밋할 변경사항이 없습니다."
fi

git push origin main

tmp_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

cp index.html "$tmp_dir/index.html"
cp config.js "$tmp_dir/config.js"
cp style.css "$tmp_dir/style.css"
cp main.js "$tmp_dir/main.js"
touch "$tmp_dir/.nojekyll"

git -C "$tmp_dir" init
git -C "$tmp_dir" branch -M gh-pages
git -C "$tmp_dir" remote add origin "$REMOTE_URL"
git -C "$tmp_dir" add .
git -C "$tmp_dir" commit -m "Deploy static site"
git -C "$tmp_dir" push --force origin gh-pages

echo
echo "배포 완료: $PAGES_URL"
echo "참고: GitHub Pages는 정적 파일만 실행하므로 /api/chat 서버 기능은 별도 서버 배포가 필요합니다."
