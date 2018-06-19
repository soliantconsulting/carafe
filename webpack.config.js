const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const glob = require("glob");

let packagesToBuild = {
    'CarafeHomePage': 'app/CarafeHomePage.js',
};

glob.sync(path.join(__dirname, "carafe-packages/**/Package.js")).forEach((filePath) => {
    packagesToBuild[filePath.replace('/Package.js', '').replace(/\\/g,'/').replace( /.*\//, '' )] = filePath;
});

module.exports = {
    entry: packagesToBuild,
    resolve: {
        modules: [
            path.join(__dirname, "es6"),
            path.join(__dirname, "carafe-packages"),
            "node_modules"
        ]
    },
    output: {
        path: path.resolve(__dirname, 'public/carafe-packages-build'),
        filename: '[name]/[name].bundle.js',
        publicPath: '/',
    },
    plugins: [
        new CleanWebpackPlugin(['public/carafe-packages-build']),
        new MiniCssExtractPlugin({
            filename: "[name]/[name].css",
            chunkFilename: "[id].css"
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
                    "css-loader"
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