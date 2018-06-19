# Carafe Build Package Script

## create-package-for.sh

Run the create script with a package name and an optional second parameter to delete existing files. If the second parameter is not passed or is not true, existing files will not be overwritten.

After running, your package should show up in the list at http://localhost:8000/

```
./bin/create-package-for.sh packageName deleteExisting? 

./bin/create-package-for.sh myPackage true
```


## delete-package.sh

Run the create script with a package name and files will be deleted from default locations.

After running, your package should be removed from the list at http://localhost:8000/

```
./bin/delete-package.sh packageName 

./bin/delete-package.sh myPackage
```


