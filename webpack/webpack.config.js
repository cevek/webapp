const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const styleBundleName = 'style.css';
const root = __dirname + '/../';

const htmlPluginConfig = {
    template: 'src/index.html',
    inject: true,
    chunks: true,
};


module.exports = {
    entry: './src/index.tsx',
    output: {
        path: root + 'dist',
        publicPath: '/',
        filename: "bundle.js",
    },
    context: root,
    devtool: "source-map",
    resolve: {
        extensions: ["", ".ts", ".tsx", ".js"]
    },
    module: {
        loaders: [
            {
                test: /\.tsx?$/,
                loader: "autocss!ts-loader"
            },
            {
                test: /\.scss/,
                loader: ExtractTextPlugin.extract('style-loader', 'css?sourceMap!resolve-url!sass?sourceMap'),
            },
            {
                test: /\.(png|svg|gif|woff2|woff|ttf)$/,
                loader: "url-loader?limit=100000"
            },
            {
                test: /\.jpg$/,
                loader: "file-loader"
            },
        ],
    },

    autoCssLoader: {
        syntax: 'scss',
        excludes: [require('autocss-loader/bootstrap-classnames').v4]
    },

    plugins: [
        new ExtractTextPlugin(styleBundleName),
        // new HtmlWebpackPlugin(htmlPluginConfig),
    ],
};