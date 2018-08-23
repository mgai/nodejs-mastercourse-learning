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

// Exports.
module.exports = helpers;