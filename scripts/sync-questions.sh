#!/usr/bin/env bash
# data/questions.json(単一ソース)を Web / iOS の各アプリへ配布する。
# 問題データを編集したら必ずこのスクリプトを実行すること(docs/RULES.md 参照)。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/data/questions.json"

python3 -c "import json,sys; json.load(open('$SRC'))" || { echo "ERROR: questions.json が不正な JSON です"; exit 1; }

# Web: file:// で開いても CORS に阻まれないよう JS として埋め込む
{
  printf '// 自動生成ファイル — 直接編集禁止。data/questions.json を編集して scripts/sync-questions.sh を実行すること。\n'
  printf 'window.QUIZ_DATA = '
  cat "$SRC"
  printf ';\n'
} > "$ROOT/web/data/questions.js"

# iOS: バンドルリソースとしてコピー
cp "$SRC" "$ROOT/ios/AWSStudy.swiftpm/Resources/questions.json"

echo "OK: web/data/questions.js と ios/AWSStudy.swiftpm/Resources/questions.json を更新しました"
