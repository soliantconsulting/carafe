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

// folders inside carafe-packages with a Package.js file will be added to the object listing
glob.sync(path.join(__dirname, 'carafe-packages/**/Package.js')).forEach((filePath) => {
    packagesToBuild[filePath.replace('/Package.js', '').replace(/\\/g,'/').replace( /.*\//, '' )] = filePath;
});

module.exports = {
    entry: packagesToBuild,
    resolve: {
        modules: [
            path.join(__dirname, 'es6'),
            path.join(__dirname, 'carafe-packages'),
            'node_modules'
        ]
    },
    output: {
        path: path.resolve(__dirname, 'public/carafe-packages-build'),
        filename: '[name]/[name].bundle.js',
        publicPath: '/',
    },
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                cache: true,
                parallel: true,
                sourceMap: true // set to true if you want JS source maps
            }),
            new OptimizeCssAssetsPlugin({})
        ]
    },
    plugins: [
        new CleanWebpackPlugin(['public/carafe-packages-build']),
        new MiniCssExtractPlugin({
            filename: '[name]/[name].css',
            chunkFilename: '[id].css'
        }),
        new CopyWebpackPlugin([{
            context: './carafe-packages/',
            from: '**/Template.html',
            to: '.',
            force: true
        }]),
        new CopyWebpackPlugin([{
            context: './carafe-packages/',
            from: '**/*.json',
            to: '.',
            force: true
        }], {
            copyUnmodified: true
        }),
        new UglifyJsPlugin({
            test: /\.js($|\?)/i
        }),
        new OptimizeCssAssetsPlugin({
            assetNameRegExp: /\.css$/g,
            cssProcessor: require('cssnano'),
            cssProcessorOptions: { safe: true, discardComments: { removeAll: true } },
            canPrint: true
        })
    ],
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
                    'css-loader'
                ]
            },
            // process png, jpg, gif, svg imports
            {
                test: /\.(jpe?g|png|ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
                loader: 'url-loader',
            },
            // process html imports - excluding out default template
            { test: /Template\.html$/, loader: 'ignore-loader' },
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
};