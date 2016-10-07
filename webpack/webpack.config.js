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
    entry: root + 'src/index.tsx',
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
                loader: "ts-loader"
            },
            {
                test: /\.scss/,
                loader: ExtractTextPlugin.extract('style-loader', 'css?sourceMap&camelCase&modules&importLoaders=1&&localIdentName=[local]-[hash:base64:2]!sass?sourceMap'),
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

    plugins: [
        new ExtractTextPlugin(styleBundleName),
        // new HtmlWebpackPlugin(htmlPluginConfig),
    ],
};