/**
 * Handler for Users.
 */
'use strict';

// Dependencies.
const debug = require('util').debuglog('users');
const helpers = require('./helpers');
const _data = require('./data'); 


// Container.
const users = {};

users.post = function(data, callback) {
    const name = helpers.validate(data.payload.name, {type: 'string'});
    const email = helpers.validate(data.payload.email, {type: 'string'});
    const address = helpers.validate(data.payload.address, {type: 'string'});
    const password = helpers.validate(data.payload.password, {type: 'string'});

    // We consider all fields are mandatory.
    if(name && email && address && password) {
        const id = helpers.md5(email);
        if(id) {
            _data.read('users', id, function(err, user) {
                if(err) { // Proceed only when failed to read record.
                    const hashedPassword = helpers.hash(password);
                    if(hashedPassword) {
                        const user = { name, email, address, hashedPassword };
                        _data.create('users', id, user, err => {
                            if(!err) {
                                callback(200);
                            } else {
                                debug(err);
                                callback(500, {'Error': 'Could not create new user'});
                            }
                        })
                    } else {
                        debug(JSON.stringify(user, ' '));;
                        callback(500, {'Error': 'Could not hash the user password.'});
                    }
                } else {
                    callback(400, {'Error': 'User already exists.'});
                }
            })
        } else {
            debug('Failed to create md5, for email: ', email);
            callback(500, {'Error': 'Error when generating the user ID.'});
        }
    } else {
        // Not printing plain password on screen when logging.
        debug(helpers.ansiColorString.CYAN, {
            name, email, address,
            'passwordProvided': password !== false,
        });
        callback(404, {'Error': 'Missing mandatory field(s).'})
    }
}

// Users routing check.
users.routing = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        users[data.method](data, callback);
    } else {
        callback(405); // HTTP 405 - Method not allowed.
    }
}

// Export.
module.exports = users;
