const uw = require('universal-webpack');
const settings = require('./universal-webpack-settings');
const configuration = require('./webpack.config.js');

module.exports = uw.server_configuration(configuration, settings);