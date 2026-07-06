#!/usr/bin/env bash
# Builds index.html from src/ — run after any edit, then git push to deploy.
set -e
cd "$(dirname "$0")"
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
node --check <(cat src/game_core.js src/game_logic.js) 2>/dev/null \
  && echo "syntax OK" || { echo "SYNTAX ERROR — not deployed"; exit 1; }
echo "Built index.html ($(du -h index.html | cut -f1)) — commit & push to deploy"
