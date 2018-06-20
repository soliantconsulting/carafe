# Carafe

## Development

To run the project in development, you need to have [Docker](https://www.docker.com/) and
[Docker Compose](https://docs.docker.com/compose/) installed.

### Development Quick Start (See devrefresh for more info)
  - Shorthand Development Environment Refresh
    - Runs a subset of above commands to quickly refresh dev after changes have been made.
      - `./bin/devrefresh.sh`
    - To force all the Docker images to update, you can run it with the `--hard` switch
      - `./bin/devrefresh.sh --hard`

You can now preview all the Carafe packages at [http://localhost:8000](http://localhost:8000).

# Docker Development Environment

This application is running on a stock `apache2/php7.2` Docker container.
PHP dependencies are managed with Composer in `/composer.json`.
JavaScript and CSS dependencies are managed with NPM in `/package.json`.

## Developing in the /carafe-packages-src directory

While working on Carafe packages, you generally have to call webpack after every edit.
Instead you can run the following command, which will watch the directory for changes and rebuild when required:

```
docker-compose run --rm build webpack --mode development --watch
```

Development changes are output to public, so you can view them in the

## Publishing Packages
When a package is ready to be released, run webpack in mode production to minify js and css files and deploy to `/carafe-package`.

```
docker-compose run --rm build webpack --mode production
```
