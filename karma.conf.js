var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var styleBundleName = 'style.css';
const webpack = require('webpack');

const htmlPluginConfig = {
    // filename: './src/index.html',
    // inject: false,
};

module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: [
            'jasmine',
            'jasmine-expect-jsx'
        ],
        files: ['tests.ts'],
        preprocessors: {
            'tests.ts': ['webpack', 'sourcemap'],
        },
        webpack: {
            resolve: {
                extensions: ['', '.js', '.ts', '.tsx']
            },
            module: {
                loaders: [
                    {
                        test: /\.tsx?$/,
                        loader: 'ts-loader'
                    },
                    {
                        test: /\.scss/,
                        loader: ExtractTextPlugin.extract('style-loader', 'css?sourceMap&modules&&localIdentName=[local]-[hash:base64:2]!sass?sourceMap'),
                    },
                    {
                        test: /\.(png|svg|gif|woff2|woff|ttf)$/,
                        loader: "url-loader?limit=100000"
                    },
                    {
                        test: /\.jpg$/,
                        loader: "file-loader"
                    },
                ]
            },
            stats: {
                colors: true,
                modules: true,
                reasons: true,
                errorDetails: true
            },
            plugins: [
                new ExtractTextPlugin(styleBundleName),
                new HtmlWebpackPlugin(htmlPluginConfig),
                new webpack.SourceMapDevToolPlugin({
                    filename: null, // if no value is provided the sourcemap is inlined
                    test: /\.(ts|js)($|\?)/i, // process .js and .ts files only
                    moduleFilenameTemplate: '[resourcePath]',
                    fallbackModuleFilenameTemplate: 'ywo:///[resourcePath]?[hash]',
                })
            ],
            devtool: 'inline-source-map',
        },
        reporters: [
            'jasmine-expect-jsx',
            'progress',
        ],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: [],
        singleRun: false,
        concurrency: Infinity
    })
}

