/**
 * Handler for Users.
 */
'use strict';

// Dependencies.
const debug = require('util').debuglog('users');
const helpers = require('./helpers');
const _data = require('./data'); 
const tokens = require('./tokens');

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

users.get = function(data, callback) {
    const email = helpers.validate(data.queryStringObject.email, {type: 'string'});
    if(email) {
        const id = helpers.md5(email);
        if(id) {
            _data.read('users', id, (err, user) => {
                if(!err && user) {
                    delete user.hashedPassword; // Remove password part before responding to client request.
                    callback(200, {...user, id});   // Returning ID as well.
                } else {
                    callback(404);  // 404 - Not Found
                }
            });
        } else {
            callback(500, {'Error': 'Failed to compute user ID.'});
        }
    }
}

users.put = function(data, callback) {
    const email = helpers.validate(data.queryStringObject.email, {type: 'string'});
    const address = helpers.validate(data.payload.address, {type: 'string'});
    /**
     * Ok here this is really doesn't make much sense but rather it's just
     * for demonstrating purposes to handle multiple optional fields update.
     * And since I don't want to allow email change as it would require complicated logic
     * to handle the chained reaction on the ID change, I would like to allower users
     * to change their name.... yep.
     */
    const name = helpers.validate(data.payload.name, {type: 'string'});

    if(email) {
        if(address || name) {
            const userId = helpers.md5(email);
            if(userId) {
                const tokenId = helpers.validate(data.headers.token, {type: 'string'});
                if(tokenId) {
                    tokens.validate({userId, tokenId}, err => {
                        if(!err) {
                            _data.read('users', userId, (err, user) => {
                                if(!err && user) {
                                    if(address) user.address = address;
                                    if(name) user.name = name;
                                    _data.update('users', userId, user, err => {
                                        if(!err) {
                                            delete user.hashedPassword;
                                            callback(200, user);
                                        } else {
                                            callback(500, {'Error': 'Failed to udpate user record.'});
                                        }
                                    })
                                } else {
                                    callback(404);  // 404 - not found.
                                }
                            })
                        } else {
                            callback(400, {'Error': 'User could only delete their own record.'});
                        }
                    })
                } else {
                    callback(400, {'Error': 'Token is not present.'});
                }          
            } else {
                callback(500, {'Error': 'Failed to compute user ID.'});
            }
        } else {
            callback(400, {'Error': 'Mising required field(s).'});
        }
    } else {
        callback(400, {'Error': 'Mising required field(s).'});
    }

}

/**
 * Delete function for user to delete her OWN user record.
 * @requires token to presence as Logged in.
 * @param data data.queryStringObject.email
 * @param callback 
 */
users.delete = function(data, callback) {
    const email = helpers.validate(data.queryStringObject.email, {type: 'string'});
    if(email) {
        const userId = helpers.md5(email);
        if(userId) {
            const tokenId = helpers.validate(data.headers.token, {type: 'string'});
            if(tokenId) {
                tokens.validate({userId, tokenId}, err => {
                    if(!err) {
                        _data.delete('users', userId, err => {
                            if(!err) {
                                // TODO: Clean up all the carts, orders.
                                callback(200);
                            } else {
                                callback(500, {'Error': 'Failed to delete user record.'});
                            }
                        })
                    } else {
                        callback(400, {'Error': 'User could only delete their own record.'});
                    }
                })
            } else {
                callback(400, {'Error': 'Token is not present.'});
            }          
        } else {
            callback(500, {'Error': 'Failed to compute user ID.'});
        }
    } else {
        callback(400, {'Error': 'Mising required field(s).'});
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
