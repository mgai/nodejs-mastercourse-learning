/*
 * Primary file for the API.
 */

// Dependencies.
const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');

const cluster = require('cluster');
const os = require('os');

// Declare the app.
const app = {};

app.init = function(callback) {
    if(cluster.isMaster) {
        // -- Non clustered --

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
            callback(); // This is for the testing purpose.
        }, 50);

        // For processes.
        for(let i=0; i<os.cpus().length; i++) {
            cluster.fork(); // Entry file will be triggered again, with isMaster = false;
        }

    } else {
        // -- Clustered --
        // Start the server.
        server.init();
    }
};

// Self invoking only if required.
if(require.main === module) {   // This will be triggered ONLY when the file itself is being executed. Not in require().
    app.init(()=>{});
}

module.exports = app;   // For testing.