#!/bin/sh
# This project lives in iCloud Drive. Folders ending in .nosync are not synced,
# so keep dependencies in node_modules.nosync and point node_modules at it.
# Run after any `npm install` (npm replaces the symlink with a real folder).
set -e
cd "$(dirname "$0")/.."
if [ -d node_modules ] && [ ! -L node_modules ]; then
  rm -rf node_modules.nosync
  mv node_modules node_modules.nosync
fi
[ -L node_modules ] || ln -s node_modules.nosync node_modules
echo "node_modules -> node_modules.nosync"
