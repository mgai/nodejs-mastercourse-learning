/**
 * Command Line Interface tasks.
 */
'use strict';

// Dependencies.
const os = require('os');
const v8 = require('v8');
const readline = require('readline');
const util = require('util');
const debug = util.debuglog('cli');
const events = require('events');

const helpers = require('./helpers');
const _data = require('./data');

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
    cli.responders.moreCheckInfo(str);
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
    // Compile an object of stats.
    const stats = {
        'Load Average': os.loadavg().join(' '),
        'CPU Count': os.cpus().length,
        'Free Memory': os.freemem(),
        'Current Malloced Memory': v8.getHeapStatistics().malloced_memory,
        'Peak Malloced Memory': v8.getHeapStatistics().peak_malloced_memory,
        'Allocated Heap Used (%)': Math.round(v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size * 100),
        'Avalable Heap Allocated (%)': Math.round(v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit * 100),
        'Uptime': os.uptime() + ' seconds'
    };

    // Create a header for the stats.
    cli.horizontalLine();
    cli.centered('System Statistics');
    cli.horizontalLine();
    cli.verticalSpace(2);

    // Log out each stat.
    for(let key in stats) {
        if(stats.hasOwnProperty(key)) {
            let value = stats[key];
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

cli.responders.listUsers = function() {
    _data.list('users', function(err, userIds) {
        if(!err && userIds && userIds.length > 0) {
            cli.verticalSpace();
            userIds.forEach(userId => {
                _data.read('users', userId, function(err, userData) {
                    if(!err && userData) {
                        let line = 'Name: ' + userData.firstName + ' ' + userData.lastName + ' Phone: ' + userData.phone + ' Checks: ';
                        let numberOfChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array && userData.checks.length > 0 ? userData.checks.length: 0;
                        line += numberOfChecks;
                        console.log(line);
                        cli.verticalSpace();
                    } // else ignored.
                })
            });
        }
    });
};

cli.responders.moreUserInfo = function(str) {
    // Get the ID from the string
    let arr = str.split('--');
    let userId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
    if(userId) {
        // Look up the user
        _data.read('users', userId, function(err, userData) {
            if(!err && userData) {
                // Remove the hashed password - NEVER display hashed password.
                delete userData.hashedPassword;
                // Print the JSON object with text highlighting.
                cli.verticalSpace();
                console.dir(userData, {'colors': true});
                cli.verticalSpace();
            }
        })
    }
};

cli.responders.listChecks = function(str) {
    _data.list('checks', function(err, checkIds) {
        if(!err && checkIds && checkIds.length > 0) {
            cli.verticalSpace();
            checkIds.forEach(checkId => {
                _data.read('checks', checkId, function(err, checkData) {
                    if(!err && checkData) {
                        let includeCheck = false;
                        let lowerString = str.toLowerCase();
    
                        // Get the state, default do down. this is used for the parameter comparison, and we include missing state, i.e. unknown for down case.
                        let state = typeof(checkData.state) == 'string' ? checkData.state: 'down';
                        // This is the actual state retrieved from the record for display, either Up, Down or unkown.
                        let stateOrUnkown = typeof(checkData.state) == 'string' ? checkData.state: 'unkown';
                        if(lowerString.indexOf('--'+ state) > -1 || (lowerString.indexOf('--down') == -1 && lowerString.indexOf('--up') == -1 )) {
                            let line = 'ID: ' + checkData.id + ' ' + checkData.method.toUpperCase() + ' ' + checkData.protocol + '://' + checkData.url + ' State:' + stateOrUnkown;
                            console.log(line);
                            cli.verticalSpace();
                        }
                    }
                });
            })
        }
    })
};

cli.responders.moreCheckInfo = function(str) {
    // Get the ID from the string
    let arr = str.split('--');
    let checkId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
    if(checkId) {
        // Look up the user
        _data.read('checks', checkId, function(err, checkData) {
            if(!err && checkData) {
                // Remove the hashed password - NEVER display hashed password.
                delete checkData.hashedPassword;
                // Print the JSON object with text highlighting.
                cli.verticalSpace();
                console.dir(checkData, {'colors': true});
                cli.verticalSpace();
            }
        })
    }
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
