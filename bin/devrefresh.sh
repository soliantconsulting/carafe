#!/bin/bash

if [ "$1" = "--hard" ]; then
    docker pull php:7.2-apache
    docker pull node:8.1
fi

docker-compose build
docker-compose run --rm build yarn install
docker-compose run --rm build webpack --mode development
docker-compose up -d
docker-compose exec web composer install
docker-compose restart

read -r -d '' Heredoc_var <<'Heredoc_var'
\x1b[0m
                 )
                (
    __========__ )
 .-'------------ /
( C|/\/\/\/\/\/\|
 '-./\/\/\/\/\/\|
   '____________'
    '----------'

 Smells Delicious!
\x1b[0m
Heredoc_var
echo -e "$Heredoc_var"

echo 'Carafe refresh complete. Get a taste at http://0.0.0.0:8000'
