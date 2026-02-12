#!/bin/bash
ASTRO_SOURCE="/home/madeofpeople/abcnorio-astro"
GIT_DIR="/home/madeofpeople/repos/abcnorio-astro.git"
PATH="/home/madeofpeople/.nvm/versions/node/v25.5.0/bin:/usr/bin"
NODEV=$(node -v)
YARNV=$(yarn -v)

while read oldrev newrev ref
do
    if [ -z $ref ]; then
        echo "No ref set. Exisitng."
        exit 1
    else
        if [ "$ref" = "refs/heads/production" ]; then
            $BRANCH= "production"
            $CMD= "build"
        elif [ "$ref" = "refs/heads/staging" ]; then
            $BRANCH= "staging"
            $CMD= yarn build-staging
        elif [ "$ref" = "refs/heads/development" ]; then
            $BRANCH= "development"
            $CMD= "build-dev"
        fi

        if [ -z $CMD ]; then
            echo "Ref doesnt match production, staging, or development, exisitng."
            exit 1
        else 
            echo "░▒▓███████▓▒░░▒▓████████▓▒░▒▓███████▓▒░░▒▓█▓▒░      ░▒▓██████▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓███████▓▒░ ░▒▓██████▓▒░"
            echo "░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░     ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░"
            echo "░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░     ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░ "
            echo "░▒▓█▓▒░░▒▓█▓▒░▒▓██████▓▒░ ░▒▓███████▓▒░░▒▓█▓▒░     ░▒▓█▓▒░░▒▓█▓▒░░▒▓██████▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒▒▓███▓▒░"
            echo "░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░     ░▒▓█▓▒░░▒▓█▓▒░  ░▒▓█▓▒░   ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░"
            echo "░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░     ░▒▓█▓▒░░▒▓█▓▒░  ░▒▓█▓▒░   ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░"
            echo "░▒▓███████▓▒░░▒▓████████▓▒░▒▓█▓▒░      ░▒▓████████▓▒░▒▓██████▓▒░   ░▒▓█▓▒░   ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░░▒▓██████▓▒░"
            echo "---------------------------------------------------------------------------------------------------------------"
            echo "Running deployment script for itztlacoliuhqui.org"
            echo "Ref: ${ref} | Branch: ${BRANCH}"
            echo "Source: ${ASTRO_SOURCE} | Command: ${CMD}"
            echo "Node version: ${NODEV}, Yarn version ${YARNV}"
            echo "---------------------------------------------------------------------------------------------------------------"

        	# git --work-tree=$ASTRO_SOURCE --git-dir=$GIT_DIR checkout -f $BRANCH
            # cd $ASTRO_SOURCE
        	# yarn install
        	# yarn $(CMD)
        fi
    fi
done
