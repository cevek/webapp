const uw = require('universal-webpack');
const settings = require('../webpack/universal-webpack-settings');
const configuration = require('../webpack/webpack.config.js');
global.rootDir = __dirname + '/../';
uw.server(configuration, settings);
