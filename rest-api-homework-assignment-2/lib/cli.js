/**
 * CLI - mostly referred from the course source code.
 */
'use strict';

// Dependencies.
const readline = require('readline');
const util = require('util');
const debug = util.debuglog('cli');
const events = require('events');

const helpers = require('./helpers');
const _data = require('./data');
const users = require('./users');

/**
 * Extends the event class is the recommended way
 * of defining new event handler.
 */
class _events extends events{};
const e = new _events();

const cli = {};

// Input handlers.
e.on('man', _ => {
    cli.responders.help();
});

e.on('help', _ => {
    cli.responders.help();
});

e.on('exit', _ => {
    cli.responders.exit();
});

e.on('list items', _ => {
    cli.responders.listItems();
})

e.on('list new users', _ => {
    cli.responders.listUsers();
})

e.on('more user info', (str) => {
    cli.responders.moreUserInfo(str);
})

e.on('list new orders', _ => {
    cli.responders.listOrders();
})

e.on('more order info', (str) => {
    cli.responders.moreOrderInfo(str);
})

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
    let width = process.stdout.columns;

    let leftPadding = Math.floor((width - str.length) / 2);
    let line = '';
    for (let i=0; i<leftPadding; i++) {
        line += ' ';
    };
    line += str;
    console.log(line);
};

cli.verticalSpace = function(lines) {
    lines = typeof(lines) == 'number' && lines > 0 ? lines : 1;
    for (let i=0; i< lines;  i++) {
        console.log('');
    }
};

cli.responders.help = function() {
    let commands = {
        'exit': 'Kill the CLI and the rest of the application',
        'man':  'Show this help.',
        'help': 'Alias of the "mand command.',
        'list items':   'List all the items available for order.',
        'list new orders':  'List out all the new orders within last 24 hours.',
        'more order info --{orderId}':  'Show details of a specific order by ID.',
        'list new users':   'List out all the new users signed up within last 24 hours',
        'more user info --{userId}':    'Show details of a specific user by ID.' 
    };

    cli.horizontalLine();
    cli.centered('CLI Manual');
    cli.horizontalLine();
    cli.verticalSpace(2);

    for(let key in commands) {
        if(commands.hasOwnProperty(key)) {
            let value = commands[key];
            let line = helpers.ansiColorString.YELLOW.replace('%s', key);

            // Add padding to the same width - 60 char.
            let padding = 60 - line.length;
            for (let i=0; i<padding; i++) {
                line +=' ';
            };
            line +=value;
            console.log(line);
            cli.verticalSpace(1);
        }
    };

    cli.verticalSpace(1);
    cli.horizontalLine();
};

cli.responders.exit = function() {
    process.exit(0);    // Properly exit the program.
}

cli.responders.listItems = function() {
    const fullList = require('./all-items.json');
    cli.verticalSpace();
    console.dir(fullList, { 'color': true });
    cli.verticalSpace();
}

cli.responders.listUsers = function() {
    _data.list('users', function(err, userIDs) {
        if(!err && userIDs) {
            cli.verticalSpace();
            let count = 0;
            for(let i=0, j=userIDs.length; i<j; i++) {
                _data.read('users', userIDs[i], (err, user) => {
                    if(!err && user) {
                        if(user.createdAt && Date.now() - 1000 * 3600 * 24 < user.createdAt) {
                            console.log(userIDs[i]);
                            count += 1;
                        }
                    }
                })
            }
            if(!count) {
                console.log("No user has registered in last 24 hours.");
            }
            cli.verticalSpace();
        }
    });
}

cli.responders.moreUserInfo = function(str) {
    let arr = str.split('--');
    let userId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim(): false;
    
    if(userId) {
        _data.read('users', userId, function(err, user) {
            if(!err && user) {
                delete user.hashedPassword;
                cli.verticalSpace();
                console.dir(user, {'colors': true});
                cli.verticalSpace();
            }
        })
    }
}

cli.responders.listOrders = function () {
    /**
     * Here I need to use a nested loop to walk through the /user/order tree.
     */
    _data.list('orders', function(err, userIDs) {
        if(!err && userIDs) {
            let count = 0;
            for(let i=0, j = userIDs.length; i<j; i++) {
                let currUserId = userIDs[i];
                _data.list(`orders/${currUserId}`, function(err, orders) {
                    orders.forEach(order => {
                        if(order.createdAt && Date.now() - 1000 * 3600 * 24 < order.createdAt) {
                            count++;
                            console.log(`${currUserId}/${order}`);
                        }
                    })
                })
            }

            if(!count) {
                console.log('No new orders placed within last 24 hours.');
            }
        }
    })
}

cli.responders.moreOrderInfo = function (str) {
    let arr = str.split('--');
    debug(arr);
    let userOrderId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;

    if (userOrderId) {
        _data.read('orders', userOrderId, function(err, order) {
            if(!err && order) {
                cli.verticalSpace();
                console.dir(order, {'color': true});
                cli.verticalSpace();
            } else {
                debug(err);
            }
        })
    }
}

// Input processing.
cli.processInput = function(str) {
    str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : false;
    if(str) {
        const uniqueInputs = [
            'man', 'help', 'exit', 'list items', 
            'list new orders', 'more order info',
            'list new users', 'more user info'
        ];

        let matchFound = false;
        uniqueInputs.some(input => {
            if(str.toLowerCase().indexOf(input) > -1) {
                matchFound = true;
                e.emit(input, str);
                return true;
            }
        })

        if(!matchFound) {
            console.log("Sorry I don't understand. Please try again.");
        }
    }
}

cli.init = function() {
    console.log(helpers.ansiColorString.BLUE, 'The CLI is now running');

    const _interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'cli> '
    });

    _interface.prompt();

    _interface.on('line', function(str) {
        cli.processInput(str);
        _interface.prompt();
    });

    _interface.on('close', function() {
        process.exit(0);
    });
};

module.exports = cli;
