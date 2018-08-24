/**
 * Handlers for Tokens.
 * Export to be loaded in handlers._tokens
 */

// Dependencies.
const _data = require('./data');
const helpers = require('./helpers');

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
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length > 0 ? data.payload.phone.trim() : false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 5 ? data.payload.password.trim() : false;
    if(phone && password) {
        // Look up by phone.
        _data.read('users', phone, function(err, user){
            if(!err && user) {
                let hashedPassword = helpers.hash(password);
                if (hashedPassword == user.hashedPassword) {
                    // Create a new token witha random name.
                    // Set expiration date 1 hour in the future.
                    let tokenId = helpers.createRandomString(20);
                    let expires = Date.now() + 1000 * 60 * 60; // 1hr from now.
                    let tokenObject = {
                        'id': tokenId,
                        expires,
                        phone
                    };

                    _data.create('tokens', tokenId, tokenObject, function(err) {
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