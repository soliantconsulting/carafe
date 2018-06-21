<?php
if (php_sapi_name() == "cli") {
    // In cli-mode
    ob_start();
}
?><!doctype html>

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
            $dir = new DirectoryIterator('./carafe-package/');
            foreach ($dir as $fileinfo) {
                if ($fileinfo->isDir() && ! $fileinfo->isDot() && 'CarafeHomePage' !== $fileinfo->getFilename()) {
                    echo '<div class="row row-striped">';
                    echo '<div class="col-3">';
                    echo '<span><h4>' . $fileinfo->getFilename() . '</h4></span>';
                    echo "</div>";
                    echo '<div class="col-2">';
                    echo ' <a href="/carafe-packages-build/' . $fileinfo->getFilename() . '/Template.html' . '" target="_blank">View Example</a>';
                    echo "</div>";
                    echo '<div class="col-7">';
                    echo ' <a href="#" data-playground="jsfiddle" data-playground-from-group="' . $fileinfo->getFilename() . '" ' .
                        'data-playground-resources="' .
                            'https://cdn.rawgit.com/soliantconsulting/carafe/master/carafe-package/' . $fileinfo->getFilename() . '/' . $fileinfo->getFilename() . '.bundle.js,' .
                            'https://cdn.rawgit.com/soliantconsulting/carafe/master/carafe-package/' . $fileinfo->getFilename() . '/' . $fileinfo->getFilename() . '.css">Edit in JS Fiddle</a>';
                    echo "<div style='display:none;'>";
                    echo "<pre data-playground-type='html' data-playground-group='" . $fileinfo->getFilename() . "'>";
                    echo htmlentities(file_get_contents($fileinfo->getPathname() . '/Template.html'));
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
<?php
if (php_sapi_name() == "cli") {
    // In cli-mode
    $html = ob_get_contents();
    ob_end_clean();
    file_put_contents(realpath(__DIR__ . '/../public/') . '/index.html', $html);
    file_put_contents(realpath(__DIR__ . '/../docs/') . '/index.html', $html);
    echo "index.html has been generated\n";
}
