#!/bin/sh

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

recipe_name="$1"
delete_existing=${2:-false}

root_path=$( cd "$parent_path/../" ; pwd -P )

carafe_packages="$root_path/carafe-packages-src/"
package_path="${carafe_packages}${recipe_name}/"

echo "Deleting files - " $package_path
rm -Rf "$package_path"
