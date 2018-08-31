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
                    callback()
                }
            });
        } else {
            debug('Error computing user ID.');
            callback(500, {'Error': 'Failed to compute user ID.'});
        }
    } else {
        callback(401, {'Error': 'Auth - Email and Token must be present.'});  // 401 Unauthorized.
    }
}