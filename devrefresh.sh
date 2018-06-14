#!/bin/bash

if [ "$1" = "--hard" ]; then
    docker pull php:7.2-apache
    docker pull node:8.1
fi

docker-compose run --rm build yarn install
docker-compose run --rm build webpack --mode development
docker-compose exec web composer install
docker-compose up -d --build
docker-compose restart

read -r -d '' Heredoc_var <<'Heredoc_var'
\x1b[0m

\x1b[0m
Heredoc_var
echo -e "$Heredoc_var"

echo 'Soliant Carafe dev refresh complete and should now be running at http://localhost:8000'
