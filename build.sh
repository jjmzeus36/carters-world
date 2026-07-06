#!/usr/bin/env bash
# Builds index.html from src/ — run after any edit, then git push to deploy.
set -e
cd "$(dirname "$0")"
cat src/game_core.js src/game_logic.js > .build_check.js
node --check .build_check.js || { echo "SYNTAX ERROR - not built"; rm -f .build_check.js; exit 1; }
rm -f .build_check.js
{
  cat src/head.html
  echo '<script>'
  cat src/three.min.js
  echo '</script>'
  echo '<script>'
  cat src/GLTFLoader.js
  echo '</script>'
  cat src/glb_chunk.html
  cat src/qr_chunk.html
  echo '<script>'
  cat src/game_core.js src/game_logic.js
  echo '</script>'
} > index.html
echo "Built index.html ($(du -h index.html | cut -f1)) - commit & push to deploy"
