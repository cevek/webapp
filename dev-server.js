const WebpackDevServer = require("webpack-dev-server");
const webpack = require("webpack");
const wpConfig = require('./webpack/webpack.config.client.js');

const server = new WebpackDevServer(webpack(wpConfig), {
    publicPath: wpConfig.output.publicPath,
    hot: true,
    historyApiFallback: true,
    // proxy: {
    //     "*": "http://localhost:3000/",
    // },
    stats: {
        // minimal logging
        assets: false,
        colors: true,
        version: false,
        hash: false,
        timings: false,
        chunks: false,
        chunkModules: false,
        children: false
    }
});
server.listen(8020);
