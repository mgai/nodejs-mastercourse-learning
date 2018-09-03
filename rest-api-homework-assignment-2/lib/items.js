/**
 * Items hander - Only guarded GET with a fixed list is provided for simplicity.
 */
'use strict';

// Dependencies.
const debug = require('util').debuglog('items');
const tokens = require('./tokens');
const helpers = require('./helpers');

const items = {};

/**
 * Place holder function to mimic the API call feeling,
 * which currently directly retrieve the full list from
 * the hard coded file all-items.json
 * @param callback 
 */
items._getFullList = (callback) => {
    const fullList = require('./all-items.json');
    if(fullList) {
        callback(false, fullList);
    } else {
        callback(new Error('Failed to retrieve the list.'));
    }
}

items.get = (data, callback) => {
    const email = helpers.validate(data.queryStringObject.email, {type: 'string'});
    if(email) {
        const tokenId = helpers.validate(data.headers.token, {type: 'string'});
        if(tokenId) {
            const userId = helpers.md5(email);
            if(userId) {
                tokens.validate({tokenId, userId}, err => {
                    if(!err) {
                        items._getFullList((err, fullList) => {
                            if(!err) {
                                callback(200, fullList);
                            } else {
                                callback(500, {'Error': err.message});
                            }
                        })
                    } else {
                        callback(401, {'Error': 'Token is invalid.'});
                    }
                });
            } else {
                callback(500, {'Error': 'Failed to compute user ID.'});
            }
        } else {
            callback(401, {'Error': 'Token is not present.'});
        }
    } else {
        callback(400, {'Error': 'Missing required field(s).'});
    }
}

items.routing = (data, callback) => {
    const acceptableMethods = ['get']; // Still an array just to keep future compatible if other methods are supported.
    if(acceptableMethods.indexOf(data.method) > -1) {
        items[data.method](data, callback);
    } else {
        callback(405); // HTTP 405 - Method not allowed.
    }
}

module.exports = items;