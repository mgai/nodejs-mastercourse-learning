/**
 * Items hander - Only guarded GET with a fixed list is provided for simplicity.
 */
'use strict';

// Dependencies.
const debug = require('util').debuglog('items');
const tokens = require('./tokens');
const helpers = require('./helpers');

const items = {};

items.fullList = [
    {'id': 1, 'name': 'Cheesy Smiley', 'price': 9.99},
    {'id': 2, 'name': 'Hot Spicy', 'price': 12.99},
    {'id': 3, 'name': 'Meat Lover', 'price': 13.99},
    {'id': 4, 'name': 'Classic', 'price': 11.99},
];

items.get = (data, callback) => {
    const email = helpers.validate(data.queryStringObject.email, {type: 'string'});
    if(email) {
        const tokenId = helpers.validate(data.headers.token, {type: 'string'});
        if(tokenId) {
            const userId = helpers.md5(email);
            if(userId) {
                tokens.validate({tokenId, userId}, err => {
                    if(!err) {
                        callback(200, items.fullList);
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