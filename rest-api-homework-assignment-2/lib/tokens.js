/**
 * Handler for Users.
 */
'use strict';

// Dependencies.
const debug = require('util').debuglog('tokens');
const helpers = require('./helpers');
const _data = require('./data'); 


// Container.
const tokens = {};

tokens.get = (data, callback) => {
    const id = helpers.validate(data.queryStringObject.id, {type:'string'});
    if(id) {
        _data.read('tokens', id, (err, token) => {
            if(!err && token) {
                callback(200, token);
            } else {
                callback(404);
            }
        })
    }
};

/**
 * tokens.post to create a token, also it implies user login.
 * @param data - to provide {email, password}
 * @param callback 
 */
tokens.post = (data, callback) => {
    const email = helpers.validate(data.payload.email, { type: 'string'});
    const password = helpers.validate(data.payload.password, { type: 'string'});
    if(email && password) {
        const userId = helpers.md5(email);
        if(userId) {
            _data.read('users', userId, (err, user) => {
                if(!err && user) {
                    const hashedPassword = helpers.hash(password);
                    if(hashedPassword == user.hashedPassword) {
                        const id = helpers.createRandomString(20);
                        const expires = Date.now() + 1000 * 3600; // One hour.
                        const token = {userId, expires};
                        _data.create('tokens', id, token, function(err) {
                            if(!err) {
                                callback(200, {...token, id});
                            } else {
                                callback(500, {'Error': 'Failed to create token.'});
                            }
                        })
                    } else {
                        callback(404, {'Error': 'Invalid user ID or password.'});
                    }
                } else {
                    callback(404, {'Error': 'User is not found'});
                }
            });
        } else {
            callback(500, {'Error': 'Failed to retrieve user id via email.'});
        }
    } else {
        callback(400, {'Error': 'Missing required field(s).'});
    }
}

/**
 * Check if the provided token is valid for the user.
 * @param {tokenId, userId}
 * @param callback (200 when valid, 400/404 otherwise.)
 */
tokens.validate = function({tokenId, userId}, callback) {
    tokenId = helpers.validate(tokenId, {type: 'string'});
    userId = helpers.validate(userId, {type: 'string'});
    if(tokenId && userId) {
        _data.read('tokens', tokenId, (err, token) => {
            if(!err) {
                if(token.userId === userId && token.expires > Date.now()) {
                    callback(false); // No error.
                } else {
                    debug('Invalid token for user, ', token.userId === userId, token.expires > Date.now());
                    callback(400, {'Error': 'Invalid token for user.'});
                }
            } else {
                callback(404); // NOT Found.
            }
        })
    } else {
        debug('Invalid token ID(s) received for validation check.', tokenId, userId);
        callback(400, {'Error': 'Missing or invalid fields.'});
    }
}

// Users routing check.
tokens.routing = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        tokens[data.method](data, callback);
    } else {
        callback(405); // HTTP 405 - Method not allowed.
    }
}

// Export.
module.exports = tokens;
