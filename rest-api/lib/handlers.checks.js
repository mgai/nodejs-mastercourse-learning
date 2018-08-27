/**
 * Handlers for checks.
 */

// Dependencies.
const _data = require('./data');
const _tokens = require('./handlers.tokens');
const config = require('./config');
const helpers = require('./helpers');

// General container.
const checkHandler = {};

// Logic body.

/**
 * Checks post.
 * @requires {protocol, url, method, successCodes, timeoutSeconds}
 * @requires {token} in header.
 */
checkHandler.post = function(data, callback) {
    let protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    let url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    let method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    let successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    // % 1 === 0 -> To check it's a whole number.
    let timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >=1 && data.payload.timeoutSeconds <=5 ? data.payload.timeoutSeconds : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        let tokenId = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;

        _data.read('tokens', tokenId, function(err, token){
            if(!err && token) {
                let phone = token.phone;
                _data.read('users', phone, function(err, user){
                    if(!err && user) {
                        let checks = typeof(user.checks) == 'object' && user.checks instanceof Array ? user.checks : [];
                        // Check against max check.
                        if (checks.length < config.maxChecks) {
                            let checkId = helpers.createRandomString(20);
                            // Create the check object, with user phone included as a ref to the user.
                            let check = {
                                'id': checkId,
                                'userPhone': user.phone,
                                protocol, url, method, successCodes, timeoutSeconds
                            };

                            // Save the object to disk.
                            _data.create('checks', checkId, check, function(err) {
                                if(!err) {
                                    // Add the check ID to the user's object.
                                    user.checks = checks;
                                    user.checks.push(checkId);  // We keep the ref ID only.
                                    // Save the udpate.
                                    _data.update('users', user.phone, user, function(err){
                                        if(!err) {
                                            // Return the check to the user.
                                            callback(200, check);
                                        } else {
                                            callback(500, {'Error': 'Could not update the user with the new check.'})
                                        }
                                    });
                                } else {
                                    callback(500, {'Error': 'Could not create the new check'});
                                }
                            });
                        } else {
                            callback(400, {'Error': `User already has maximum number of checks.[${config.maxChecks}]`});
                        }
                    } else {
                        callback(403); 
                    }
                });
            } else {
                callback(403); // HTTP 403 - Not Authorized.
            }
        })
    } else {
        callback(400, {'Error':'Missing required inputs, or inputs are invalid.'});
    }
}

/**
 * Checks get.
 * @requires {id}
 * @requires {token} in header.
 */
checkHandler.get = function(data, callback) {
    let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id) {
        // Look up the check.
        _data.read('checks', id, function(err, check) {
            if(!err && check) {
                // Get the token from the headers.
                let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                // Verify the token is valid for the user in the check.
                _tokens.verifyToken(token, check.userPhone, function(tokenIsValid) {
                    if(tokenIsValid) {
                        // Return the check data.
                        callback(200, check);
                    } else {
                        callback(403);
                    }
                })
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field.'});
    }
}

/**
 * Checks put. - Allow to update the check.
 * @requires {token} in the header for authentication.
 * @requires {id}
 */
checkHandler.put = function(data, callback) {
    let id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

    let protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    let url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    let method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    let successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    // % 1 === 0 -> To check it's a whole number.
    let timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >=1 && data.payload.timeoutSeconds <=5 ? data.payload.timeoutSeconds : false;

    _data.read('checks', id, function(err, check) {
        if(!err && check) {
            let token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;

        } else {
            callback(403);
        }
    });

};

// Export.
module.exports = checkHandler;
