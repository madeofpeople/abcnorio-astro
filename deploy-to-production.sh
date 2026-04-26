#!/bin/bash
set -e

MODE=production

echo "${HOME} Deploying Astro in ${MODE} mode... at ${PRODUCTION_BUILD_PATH}"

if [ -n "${PRODUCTION_BUILD_PATH:-}" ] && [ -d "${PRODUCTION_BUILD_PATH}" ]; then
    npm install
    rm -rf ./dist
    export MODE PRODUCTION_BUILD_PATH
    export BACKUP_TARGET=production
    export BACKUP_SOURCE_DIR="${PRODUCTION_BUILD_PATH}"
    export ASTRO_BUILD_BACKUP=1
    npm run maybe:backup:build
    npm run build:site
    find "${PRODUCTION_BUILD_PATH}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    cp -R ./dist/. "${PRODUCTION_BUILD_PATH}/"
    chmod -R a+rwX "${PRODUCTION_BUILD_PATH}"
else
    echo "PRODUCTION_BUILD_PATH not set or missing. Skipping Astro build."
fi

