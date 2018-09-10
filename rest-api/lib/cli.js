/**
 * Command Line Interface tasks.
 */
'use strict';

// Dependencies.
const readline = require('readline');
const util = require('util');
const debug = util.debuglog('cli');
const events = require('events');

const helpers = require('./helpers');

class _events extends events{};
const e = new _events();

// Instantiate the CLI module.
const cli = {};

// Input handlers
e.on('man', function(str) {
    cli.responders.help();
});

e.on('help', function(str) {
    cli.responders.help();
});

e.on('exit', function(str) {
    cli.responders.exit();
});

e.on('stats', function(str) {
    cli.responders.stats();
});

e.on('list users', function(str) {
    cli.responders.listUsers();
});

e.on('more user info', function(str) {
    cli.responders.moreUserInfo(str);   // --{userId}
});

e.on('list checks', function(str) {
    cli.responders.listChecks(str); // --up / --down
});

e.on('list logs', function(str) {
    cli.responders.listLogs();
});

e.on('more log info', function(str) {
    cli.responders.moreLogInfo(str);
});

e.on('more check info', function(str) {
    cli.responders.moreUserInfo(str);
});

// Responders
cli.responders = {};

// Help / Man
cli.responders.help = function() {
    console.log('You asked for help.');
};

cli.responders.exit = function() {
    console.log('You asked for exit.');
};

cli.responders.stats = function() {
    console.log('You asked for stats.');
};

cli.responders.listUsers = function() {
    console.log('You asked for listUsers.');
};

cli.responders.moreUserInfo = function(str) {
    console.log('You asked for moreUserInfo.', str);
};

cli.responders.listChecks = function(str) {
    console.log('You asked for listChecks.', str);
};

cli.responders.moreCheckInfo = function(str) {
    console.log('You asked for moreCheckInfo.', str);
};

cli.responders.listLogs = function() {
    console.log('You asked for listLogs.');
};

cli.responders.moreLogInfo = function(str) {
    console.log('You asked for moreLogInfo.', str);
};

// Input processing.
cli.processInput = function(str) {
    str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim(): false;
    if(str) {
        // Codify the unique strings that identify the unique qustions allowed.
        const uniqueInputs = [
            'man', 'help', 'exit', 'stats', 'list users', 'more user info',
            'list checks', 'more check info', 'list logs', 'more log info'
        ];

        // Go through the possible inputs, emit an event when a match if found.
        let matchFound = false;
        let counter = 0;
        uniqueInputs.some(input => {
            if(str.toLowerCase().indexOf(input) > -1) {
                matchFound = true;
                // Emit an event matching the unique input, and include the full string given.
                e.emit(input, str);
                return true;
            }
        });
        
        if(!matchFound) {
            console.log("Sorry, try again.");
        }
    }; // No else needed, since prompt will be re-displayed for next line.
};

cli.init = function() {
    // Send the start message to the console, in dark blue.
    console.log(helpers.ansiColorString.BLUE, 'The CLI is now running');

    // Start the interfact
    const _interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'cli> '
    });

    // Create an initial Prompt.
    _interface.prompt();

    // Handle each line of input separately.
    _interface.on('line', function(str) {
        cli.processInput(str);
        // Re-initialize the prompt afterwards.
        _interface.prompt();
    });

    // If the user stops the CLI, kill the associated process.
    _interface.on('close', function() {
        process.exit(0); // 0 Status code for proper exit.
    })
};

module.exports = cli;
