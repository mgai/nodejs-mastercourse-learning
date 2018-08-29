/**
 * Handler for Users.
 */
'use strict';

// Dependencies.
const debug = require('util').debuglog('users');
const helpers = require('./helpers');


// Container.
const users = {};

users.post = function(data, callback) {
    const name = helpers.validate(data.payload.name, {type: 'string'});
    const email = helpers.validate(data.payload.email, {type: 'string'});
    const address = helpers.validate(data.payload.address, {type: 'string'});
    const password = helpers.validate(data.payload.password, {type: 'string'});
    const hashedPassword = helpers.hash(password);

    
}


// Export.
module.exports = users;
