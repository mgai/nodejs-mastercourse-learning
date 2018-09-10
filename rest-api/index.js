/*
 * Primary file for the API.
 */

// Dependencies.
const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');

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

    // CLI needs to be started at LAST, since it will be into the interactive mode.
    // Putting in a delayed execution would make sure any screen output would be done first.
    setTimeout(function() {
        cli.init();
    }, 50);
};

app.init();

module.exports = app;   // For testing.