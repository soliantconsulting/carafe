// helpers
const glob = require('glob');
const path = require('path');
const webpack = require('webpack');

// plugins
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

// build a dynamic object listing the packages to be processed
let packagesToBuild = {
    'CarafeHomePage': 'app/CarafeHomePage.js',
};

// folders inside carafe-packages-src with a Package.js file will be added to the object listing
glob.sync(path.join(__dirname, 'carafe-packages-src/**/Package.js')).forEach((filePath) => {
    packagesToBuild[filePath.replace('/Package.js', '').replace(/\\/g, '/').replace(/.*\//, '')] = filePath;
});

module.exports = (env, options) => {
    let outputPath = path.resolve(__dirname, 'public/carafe-packages-build');

    let plugins = [
        new MiniCssExtractPlugin({
            filename: '[name]/[name].css',
            chunkFilename: '[id].css'
        }),
        new CopyWebpackPlugin([{
            context: './carafe-packages-src/',
            from: '**/Template.html',
            to: '.',
            force: true
        }]),
        new CopyWebpackPlugin([{
            context: './carafe-packages-src/',
            from: '**/*.json',
            to: '.',
            force: true
        }], {
            copyUnmodified: true
        })
    ];

    if (options.mode === 'production') {
        outputPath = path.resolve(__dirname, './carafe-package/');
        plugins.push(
            new OptimizeCssAssetsPlugin({
                assetNameRegExp: /\.css$/g,
                cssProcessor: require('cssnano'),
                cssProcessorOptions: { safe: true, discardComments: { removeAll: true } },
                canPrint: true
            })
        );
    }

    plugins.unshift(new CleanWebpackPlugin([outputPath]));

    return {
        entry: packagesToBuild,
        devtool: 'source-map',
        resolve: {
            modules: [
                path.join(__dirname, 'es6'),
                path.join(__dirname, 'carafe-packages-src'),
                'node_modules'
            ]
        },
        output: {
            path: outputPath,
            filename: '[name]/[name].bundle.js',
            publicPath: '/',
        },
        plugins: plugins,
        module: {
            rules: [
                // process js imports
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                    query: {
                        cacheDirectory: true,
                    },
                },
                // process css imports
                {
                    test: /\.(scss|css)$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',
                        'sass-loader'
                    ]
                },
                // process png, jpg, gif, svg imports
                {
                    test: /\.(jpe?g|png|ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
                    loader: 'url-loader',
                },
                // process html imports - excluding out default template
                {
                    test: /Template\.html$/, loader: 'ignore-loader'
                },
                {
                    test: /\.html$/,
                    loader: ['html-loader']
                },
                // expose jquery to the window object
                {
                    test: require.resolve('jquery'),
                    use: [
                        {loader: 'expose-loader', options: 'jQuery'},
                        {loader: 'expose-loader', options: '$'}
                    ]
                },
            ]
        }
    }
};