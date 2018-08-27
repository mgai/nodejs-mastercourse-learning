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
};

app.init();

module.exports = app;   // For testing.