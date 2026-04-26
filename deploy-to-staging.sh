#!/bin/bash
set -e

MODE=staging

echo "${HOME} Deploying Astro in ${MODE} mode... at ${STAGING_BUILD_PATH}"

if [ -n "${STAGING_BUILD_PATH:-}" ] && [ -d "${STAGING_BUILD_PATH}" ]; then
    npm install
    rm -rf ./dist
    export MODE STAGING_BUILD_PATH
    export BACKUP_TARGET=staging
    export BACKUP_SOURCE_DIR="${STAGING_BUILD_PATH}"
    export ASTRO_BUILD_BACKUP=1
    npm run maybe:backup:build
    npm run build:site
    find "${STAGING_BUILD_PATH}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    cp -a ./dist/. "${STAGING_BUILD_PATH}/"
    chmod -R a+rwX "${STAGING_BUILD_PATH}"
else
    echo "STAGING_BUILD_PATH not set or missing. Skipping Astro build."
fi

