/**
 * General helper functions.
 */

// Dependencies.
const crypto = require('crypto');

const config = require('../config');

// Container.
let helpers = {};

// Helpers.

// SHA256 hash.
helpers.hash = function(str) {
    if(typeof(str) == 'string' && str.length>0) {
        // Note: storing secret in config/src file is VERY bad practice.
        return crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    } else {
        return false;
    }
};

// Parse a JSON String to an object in ALL cases, without throwing error.
// That's why we are creating this wrapper, on top of JSON.parse()
helpers.parseJsonToObject  = function(str) {
    try {
        let obj = JSON.parse(str);
        return obj;
    } catch(e) {
        return {}; // Return empty object upon failure.
    }
}

// Generate random string for specified length.
// Mainly used for Token name.
helpers.createRandomString = function(len) {
    len = typeof(len) == 'number' && len > 0 ? len : false;
    if(len) {
        // Define all the possible characters that could go into a string.
        let possibleCharacters = 'abcdefghijklmnopqrstuvwxyz123456789';

        // Start the final string.
        let str = '';

        for (let i=0; i<len; i++) {
            str += possibleCharacters[Math.floor(Math.random()*possibleCharacters.length)];
        }

        return str;
    } else
        return false;
}

// Exports.
module.exports = helpers;