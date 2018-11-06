/*
 * Primary file for the API.
 */

// Dependencies.
let server = require('./lib/server');
let workers = require('./lib/workers');
let exampleDebuggingProblem = require('./lib/exampleDebuggingProblem');

// Declare the app.
const app = {};

app.init = function() {
    debugger;
    // Start the server.
    server.init();
    debugger;

    // Start the workers.
    workers.init();

    // Compress all the logs immediately.
    workers.rotateLogs();

    // Call the compression loop.
    workers.logRotationLoop();

    console.log('foo defined.');
    debugger;

    let foo = 1;
    foo++;
    foo = foo * foo;
    debugger;
    foo = foo.toString();

    debugger;
    exampleDebuggingProblem.init();
    debugger;
};

app.init();

module.exports = app;   // For testing.