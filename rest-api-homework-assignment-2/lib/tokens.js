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
