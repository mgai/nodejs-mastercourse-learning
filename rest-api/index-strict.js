'use strict';

// Or, you can always use - node --use_strict <file> to run the command in strict mode.

/*
 * Primary file for the API.
 */

// Dependencies.
let server = require('./lib/server');
let workers = require('./lib/workers');

// Declare the app.
const app = {};

app.init = function() {
    // Start the server.
    server.init();

    // Start the workers.
    workers.init();

    // Compress all the logs immediately.
    workers.rotateLogs();

    // Call the compression loop.
    workers.logRotationLoop();
};

app.init();

module.exports = app;   // For testing.