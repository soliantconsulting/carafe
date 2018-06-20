#!/bin/sh

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

recipe_name="$1"
delete_existing=${2:-false}

root_path=$( cd "$parent_path/../" ; pwd -P )

public_path="${root_path}/public/"
html_filename="${public_path}${recipe_name}.html"
json_filename="${public_path}${recipe_name}JsonData.js"

carafe_packages="$root_path/carafe-packages-src/"
package_path="${carafe_packages}${recipe_name}"

if $delete_existing ; then
    echo "Deleting files - " $package_path
    rm -Rf "$package_path"
fi

#
# create the Package.js file
#
if [[ -d "${carafe_packages}" && ! -L "${carafe_packages}" && ! -f "{$package_path}/Package.js" ]] ; then
    echo "Creating $package_path/Package.js"
    mkdir "$package_path"
    cat > "$package_path/Package.js" << END_TEXT
"use strict";

import 'jquery';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';

import ExampleData from './ExampleData.json';
window.ExampleData = ExampleData;
END_TEXT
fi

#
# create the app ExampleData.json file
#
if [[ -d "${carafe_packages}" && ! -L "${carafe_packages}" && ! -f "{$package_path}/ExampleData.json" ]] ; then
    echo "Creating $package_path/ExampleData.json"
    cat > "$package_path/ExampleData.json" << END_TEXT
[]
END_TEXT
fi

#
# create the Template.html file
#
if [[ -d "${carafe_packages}" && ! -L "${carafe_packages}" && ! -f "{$package_path}/Template.html" ]] ; then
    echo "Creating $package_path/Template.html"
    cat > "$package_path/Template.html" << END_TEXT
<!doctype html>

<html lang="en">
    <head>
        <meta charset="utf-8">
        <!-- carafeZoneStart -->
        <link rel="stylesheet" type="text/css" href="./${recipe_name}.css">
        <script src="./${recipe_name}.bundle.js"></script>
        <!-- carafeZoneEnd  -->
    </head>
    <body>
        <div class="container ">
            <div class="row">
                <div class="col-12">
                    <div class="text-center">
                        <h2>New Package</h2>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <div class="log text-danger" id="log"></div>
                </div>
            </div>
        </div>
    </body>
</html>
END_TEXT
fi

