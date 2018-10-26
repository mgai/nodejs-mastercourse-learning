/**
 * Starting point.
 */
'use strict';
// Dependencies.
const server = require('./lib/server');
const cli = require('./lib/cli');

// Declare the app.
const app = {};

app.init = function() {
    server.init();
    setTimeout(function() {
        cli.init();
    },50);
};

app.init();

// Exports for testing.
module.exports = app;