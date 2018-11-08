/**
 * Handlers for Tokens.
 * Export to be loaded in handlers._tokens
 */

// Dependencies.
const _data = require('./data');
const helpers = require('./helpers');

const _performance = require('perf_hooks').performance;
const PerformanceObserver = require('perf_hooks').PerformanceObserver;
const util = require('util');
const debug = util.debuglog('performance'); // We want to have performance logged only when debugging.


// Contanier for export.
const tokenHandlers = {};

/**
 * TokenHandlers: Get
 * @requires { id } 
 */
tokenHandlers.get = function(data, callback) {
    // Check the tokenId number is valid.
    let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id) {
        _data.read('tokens', id, function(err, token){
            if(!err && token) {
                callback(200, token);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field.'});
    }

};
/**
 * Post to create new token.
 * @requires data {phone, password}
 */
tokenHandlers.post = function(data, callback) {
    const obs = new PerformanceObserver((list) => {
        debug('Observer in action');
        const measurements = list.getEntries();
        measurements.forEach(m => {
            console.log('\x1b[33m%s\x1b[0m', m.name,  m.duration);
        });
    })
    obs.observe({entryTypes: ['measure'], buffered: true});

    debug('TokenHandlers.post in action.');
    _performance.mark('entered function');
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length > 0 ? data.payload.phone.trim() : false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 5 ? data.payload.password.trim() : false;
    _performance.mark('input validated');
    if(phone && password) {
        _performance.mark('beginning user lookup');
        // Look up by phone.
        _data.read('users', phone, function(err, user){
            _performance.mark('user lookup completed');
            if(!err && user) {
                _performance.mark('beginning password hashing');
                let hashedPassword = helpers.hash(password);
                _performance.mark('password hashing completed');
                if (hashedPassword == user.hashedPassword) {
                    // Create a new token witha random name.
                    // Set expiration date 1 hour in the future.
                    _performance.mark('creating data for token');
                    let tokenId = helpers.createRandomString(20);
                    let expires = Date.now() + 1000 * 60 * 60; // 1hr from now.
                    let tokenObject = {
                        'id': tokenId,
                        expires,
                        phone
                    };

                    _performance.mark('beginning storing token');
                    _data.create('tokens', tokenId, tokenObject, function(err) {
                        _performance.mark('storing token completed');

                        // Gather all the measurements.
                        _performance.measure('Beginning to end', 'entered function', 'storing token completed');
                        _performance.measure('Validating user input', 'entered function', 'input validated');
                        _performance.measure('User lookup', 'beginning user lookup', 'user lookup completed');
                        _performance.measure('Password hashing', 'beginning password hashing', 'password hashing completed');
                        _performance.measure('Token data creation', 'creating data for token', 'beginning storing token');
                        _performance.measure('Token data storing', 'beginning storing token', 'storing token completed');

                        if(!err) callback(200, tokenObject);
                        else callback(500, {'Error': 'Could not create new token.'});
                    });
                } else {
                    callback(400, {'Error': 'Invalid user phone or password provided.'});
                }
            } else {
                callback(400, {'Error': 'User error.'})
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field(s).'})
    }
};

/**
 * Token Hanlders. PUT to update the token - Renew.
 * It will extend the token for one hour from now.
 * Only the current valid token will be extended.
 * @requires {id, extend}  
 */
tokenHandlers.put = function(data, callback) {
    // Check the tokenId number is valid.
    let id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    let extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend;

    // We only need to work on extend:true.
    if(id && extend) {
        _data.read('tokens', id, function(err, token){
            if(!err && token) {
                if(token.expires > Date.now()) {
                    token.expires = Date.now() + 1000 * 3600;
                    _data.update('tokens', id, token, function(err) {
                        if(!err) {
                            callback(200, token);
                        } else {
                            callback(500, {'Error': 'Failed to extend the token.'});
                        }
                    })
                } else {
                    callback(400, {'Error': 'Token already expired.'})
                }
            } else {
                callback(400, {'Error': 'Token does not exist.'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field(s) or invalid.'});
    }
};

/**
 * 
 * @requires {id}  
 */
tokenHandlers.delete = function(data, callback) {
    // Check the id number is valid.
    let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 5 ? data.queryStringObject.id : false;
    if(id) {
        _data.read('tokens', id, function(err, data){
            if(!err && data) {
                // Remove hashedPassword from the object to be returned.
                delete data.hashedPassword;

                _data.delete('tokens', id, function(err){
                    if(!err) {
                        callback(200);
                    } else {
                        callback(500, {'Error':'Could not delete the specified token.'});
                    }
                });
            } else {
                callback(400, {'Error': 'Could not find the specified token.'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field.'});
    }

};

// Verify if a given token id is currently valid for a given user.
tokenHandlers.verifyToken = function(id, phone, callback) {
    // Look up for the token.
    _data.read('tokens', id, function(err, token){
        if(!err && token) {
            if(token.phone == phone && token.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
}

module.exports = tokenHandlers;