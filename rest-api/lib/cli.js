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

cli.horizontalLine = function() {
    // Get the available screen size.
    let width = process.stdout.columns;

    let line = '';
    for (let i=0; i<width; i++) {
        line += '-';
    }
    console.log(line);
};

cli.centered = function(str) {
    str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : '';
    // Get the available screen size.
    let width = process.stdout.columns;

    let leftPadding = Math.floor((width - str.length) /2);
    let line = '';
    for(let i=0; i<leftPadding; i++) {
        line +=' ';
    };
    line += str;
    console.log(line);
};

cli.verticalSpace = function(lines) {
    lines = typeof(lines) == 'number' && lines > 0 ? lines : 1;
    for(let i=0; i<lines; i++) {
        console.log('');    // Simply putting in new lines.
    }
};

// Help / Man
cli.responders.help = function() {
    let commands =  {
        'exit': 'Kill the CLI and the rest of the application.',
        'man': 'Show this help.',
        'help': 'Alias of the "man" command',
        'stats': 'Get the stats of the underlyhing system and resource utilization.',
        'list users': 'Show a list of all the registered (undeleted) users in the system',
        'more user info --{userId}': 'Show details of the specific user (userId provided)',
        'list checks [--<up|down>]': 'Show a list of all the active checks in the system, with optional filtering to up/down per specified',
        'more check info --{checkId}': 'Show details of the specific check (checkId provided)',
        'list logs': 'Show a list of all the logs',
        'more log info --{logId}': 'Show details of the specific log file.'
   };

   cli.horizontalLine();
   cli.centered('CLI Manual');
   cli.horizontalLine();
   cli.verticalSpace(2);

   // Show each command, followed by its explanation, in while and yellow respectively.
   for(let key in commands) {
       if(commands.hasOwnProperty(key)) {
           let value = commands[key];
           let line = helpers.ansiColorString.YELLOW.replace('%s', key);

           // Add padding to same width - 60 char.
           let padding = 60 - line.length;
           for (let i=0; i<padding; i++) {
               line+=' ';
           };
           line += value;

           console.log(line);
           cli.verticalSpace(1);
       }
   }

   cli.verticalSpace(1);
   // End with another horizontal line.
   cli.horizontalLine();
};

cli.responders.exit = function() {
    process.exit(0);    // Properly exit the program.
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
