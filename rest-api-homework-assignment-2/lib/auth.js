/**
 * Authentication Handler. Mainly to wrap functsion that need valid token for current user.
 * Mandatory info required - 
 * @requires data.headers.token Token ID
 * @requires data.queryStringObject.email User Email.
 */
'use strict';

// Dependencies.
const debug = require('util').debuglog('auth');
const users = require('./users');
const tokens = require('./tokens');
const helpers = require('./helpers');
const _data = require('./data');

function auth(data, handler, callback) {
    const email = helpers.validate(data.queryStringObject.email, {type: 'string'});
    const tokenId = helpers.validate(data.headers.token, {type: 'string'});
    if(email && tokenId) {
        const userId = helpers.md5(email);
        if(userId) {
            tokens.validate({tokenId, userId}, err => {
                if(!err) {
                    // Authentication passed. Passing to actual handler.
                    handler(data, callback);
                } else {
                    callback(403); // 403 Forbidden.
                }
            });
        } else {
            debug('Error computing user ID.');
            callback(500, {'Error': 'Failed to compute user ID.'});
        }
    } else {
        callback(401, {'Error': 'Auth - Email and Token must be present.'});  // 401 Unauthorized.
    }
};

/**
 * New authentication method
 * It requires token to be present in the header.
 * The token must be valid.
 * Upon authentication check, user would be added to the data.payload.
 */
function authNew(data, handler, callback) {
    debug(helpers.ansiColorString.GREEN, 'New auth is now called.');
    const tokenId = helpers.validate(data.headers.token, {type: 'string'});
    if(tokenId) {
        tokens.isValid(tokenId, (err, token) => {
            if(!err && token) {
                data.payload.token = token;
                _data.read('users', token.userId, (err, user) => {
                    if(!err && user) {
                        delete user.hashedPassword;
                        data.payload.user = user;
                        debug(data.payload);
                        handler(data, callback);
                    } else {
                        debug(helpers.ansiColorString.CYAN, err, user);
                        callback(500);
                    }
                })
            } else {
                callback(401, {'Error': 'Token is not valid.'});
            }
        })
    } else {
        callback(401, {'Error': 'Token is not present.'});
    }
}

function withUserId(data, handler, callback) {
    const email = helpers.validate(data.queryStringObject.email, {type:'string'});
    if(email) {
        const userId = helpers.md5(email);
        if(userId) {
            data.payload.userId = userId; // Append userId.
            handler(data, callback);
        } else {
            callback(500, {'Error': 'Failed to compute user ID.'});
        }
    } else {
        callback(400, {'Error': 'Missing required field(s).', 'Extra': 'Email shoudl be presend in queryStringObject.'});
    }
}

module.exports = {
    'auth': authNew,
    withUserId
}