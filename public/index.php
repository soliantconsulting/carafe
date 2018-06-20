<!doctype html>

<html lang="en">
    <head>
        <meta charset="utf-8">
        <title></title>
        <link rel="stylesheet" type="text/css" href="./carafe-packages-build/CarafeHomePage/CarafeHomePage.css">
        <script src="./carafe-packages-build/CarafeHomePage/CarafeHomePage.bundle.js"></script>
        <meta name="description" content="Carafé Demo">
        <meta name="author" content="Soliant Consulting">
    </head>

    <body>
        <header>
            <!-- Fixed navbar -->
            <nav class="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
                <a class="navbar-brand" href="#">Carafe</a>
            </nav>
        </header>

        <!-- Begin page content -->
        <main role="main" class="container">
            <h1 class="mt-5">Carafe Packages</h1>
            <p class="lead">Click a package below to view it in the browser.</p>
            <?php
            $dir = new DirectoryIterator('./carafe-packages-build/');
            foreach ($dir as $fileinfo) {
                if ($fileinfo->isDir() && ! $fileinfo->isDot() && 'CarafeHomePage' !== $fileinfo->getFilename()) {
                    echo '<div class="row">';
                    echo '<div class="col-4">';
                    echo '<span>' . $fileinfo->getFilename() . '</span>';
                    echo "</div>";
                    echo '<div class="col-4">';
                    echo ' <a href="/carafe-packages-build/' . $fileinfo->getFilename() . '/Template.html' . '" target="_blank">demo</a>';
                    echo "</div>";
                    echo '<div class="col-4">';
                    echo ' <a href="#" data-playground="jsfiddle" data-playground-from-group="' . $fileinfo->getFilename() . '" ' .
                        'data-playground-resources="' .
                            'http://localhost:8000/carafe-packages-build/' . $fileinfo->getFilename() . '/' . $fileinfo->getFilename() . '.bundle.js,' .
                            'http://localhost:8000/carafe-packages-build/' . $fileinfo->getFilename() . '/' . $fileinfo->getFilename() . '.css">JS Fiddle</a>';
                    echo "<div style='display:none;'>";
                    echo "<pre data-playground-type='html' data-playground-group='" . $fileinfo->getFilename() . "'>";
                    echo htmlentities(file_get_contents('./carafe-packages-build/' . $fileinfo->getFilename() . '/Template.html'));
                    echo '</pre>';
                    echo "</div>";
                    echo "</div>";
                    echo "</div>";
                }
            }
            ?>
        </main>

        <footer class="footer">
            <div class="container">
                <span class="text-muted">Soliant Consulting</span>
            </div>
        </footer>
    </body>
</html>
