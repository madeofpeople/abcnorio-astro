#!/bin/bash
set -e

MODE=development

echo "${HOME} Deploying static Astro in ${MODE} mode... at ${DEV_BUILD_PATH}"

if [ -n "${DEV_BUILD_PATH:-}" ] && [ -d "${DEV_BUILD_PATH}" ]; then
    npm install
    rm -rf ./dist
    export MODE DEV_BUILD_PATH
    export BACKUP_TARGET=dev
    export BACKUP_SOURCE_DIR="${DEV_BUILD_PATH}"
    export ASTRO_BUILD_BACKUP=1
    npm run maybe:backup:build
    npm run build:site
    find "${DEV_BUILD_PATH}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    cp -a ./dist/. "${DEV_BUILD_PATH}/"
    chmod -R a+rwX "${DEV_BUILD_PATH}"
else
    echo "DEV_BUILD_PATH not set or missing. Skipping Astro build."
fi

