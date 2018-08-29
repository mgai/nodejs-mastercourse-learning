/**
 * Starting point.
 */
'use strict';
// Dependencies.
const server = require('./lib/server');

// Declare the app.
const app = {};

app.init = function() {
    server.init();
};

app.init();

// Exports for testing.
module.exports = app;