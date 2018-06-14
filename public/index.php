<!doctype html>

<html lang="en">
    <head>
        <meta charset="utf-8">
        <title></title>
        <link rel="stylesheet" type="text/css" href="./carafe-packages-build/CarafeHomePage/CarafeHomePage.css">
        <script src="./carafe-packages-build/CarafeHomePage/CarafeHomePage.bundle.js"></script>
        <meta name="description" content="Carafé Demo">
        <meta name="author" content="Jesse LaVere - Soliant Consulting">
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
            <h1 class="mt-5">Packages</h1>
            <p class="lead">Click a package below to view it in the browser.</p>
            <ul class="list-group list-group-flush">
                <?php
                $dir = new DirectoryIterator('./carafe-packages-build/');
                foreach ($dir as $fileinfo) {
                    if ($fileinfo->isDir() && !$fileinfo->isDot() && 'CarafeHomePage' !== $fileinfo->getFilename()) {
                        echo '<a href="/carafe-packages-build/' . $fileinfo->getFilename() . '/Template.html' . '">'.$fileinfo->getFilename().'</a><br>';
                    }
                }
                ?>
            </ul>
        </main>

        <footer class="footer">
            <div class="container">
                <span class="text-muted">Jesse LaVere - Soliant Consulting</span>
            </div>
        </footer>
    </body>
</html>
