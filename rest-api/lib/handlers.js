/*
 * Request handlers.
 */

// Dependencies
const debug = require('util').debuglog('handlers');
const _data = require('./data');
const helpers = require('./helpers');

const tokenHandlers = require('./handlers.tokens');
const checkHandlers = require('./handlers.checks');

// Define the handlers.
const handlers = {};

/**
 * HTML Handlers.
 */
handlers.index = function(data, callback) {
    // Handle only GET method.
    if(data.method === 'get') {
        // Prepare data for interpolation.
        let templateData = {
            'head.title': 'This is the title',
            'head.description': 'We offer free, simple uptime montioring of your sites. When down, we will send you a text.',
            'body.class': 'index'
        };
        // Read in a template as a string.
        helpers.getTemplate('index', templateData, function(err, str) {
            if(!err && str) {
                // Add the universal header and footer
                helpers.addUniversalTemplates(str, templateData, function(err, str) {
                    if(!err && str) {
                        callback(200, str, 'html');
                    } else {
                        debug('Failed when addUniversalTemplates', err, str);
                        callback(500, undefined, 'html');
                    }
                });
            } else {
                debug('Failed whem getTemplate', err, str);
                callback(500, undefined, 'html');
            }
        });
    } else {
        callback(405, undefined, 'html');   // 405 - Not allowed.
    }
}

/**
 * Favicon handler.
 * @param data the request object.
 * @param callback (code, data, type)
 */
handlers.favicon = function(data, callback) {
    if(data.method === 'get') {
        // Read in the favicon data.
        helpers.getStaticAsset('favicon.ico', function(err, data) {
            if(!err && data) {
                callback(200, data, 'favicon');
            } else {
                debug(err);
                callback(500);
            }
        })
    } else {
        callback(405);  // Reject any other HTTP methods.
    }
}

/**
 * Public static asset handler.
 * @param data the request object.
 * @param callback (code, data, type)
 */
handlers.public = function(data, callback) {
    if(data.method === 'get') {
        // Read in the data.
        let trimmedAssetName = data.trimmedPath.replace('public/', '').trim();
        if(trimmedAssetName.length > 0) {
            helpers.getStaticAsset(trimmedAssetName, function(err, data) {
                if(!err && data) {
                    // Determine the content type. (default to plain text).
                    let contentType = 'plain';
                    if(trimmedAssetName.indexOf('.css') > -1) {
                        contentType = 'css';
                    }
                    if(trimmedAssetName.indexOf('.png') > -1) {
                        contentType = 'png';
                    }
                    if(trimmedAssetName.indexOf('.jpg') > -1) {
                        contentType = 'jpg';
                    }
                    if(trimmedAssetName.indexOf('.ico') > -1) {
                        contentType = 'favicon';
                    }

                    callback(200, data, contentType);
                } else {
                    debug(err);
                    callback(404);  // Not found.
                }
            })
        } else {
            callback(404);
        }
    } else {
        callback(405);  // Reject any other HTTP methods.
    }
}


handlers._tokens = tokenHandlers;
handlers._checks = checkHandlers;

/*
 * data - Captures all the data in the request.
 * Callback - the function to call after handling done., with a http status code, and a payload.
 */
handlers.sample = function(data, callback) {
    // HTTP 406 Statust code - Not acceptable
    callback(406, {'name': 'sample handler'});
};
handlers.notFound = function(data, callback) {
    callback(404);
};

// Ping hanlder.
handlers.ping = function(data, callback) {
    callback(200);
}

// Hello handler - Homework #1
handlers.hello = function(data, callback) {
    callback(200, {'message': 'Hello my friend.'});
}


// Conatiner for users sub methods.
handlers._users = {};
/**
 * Post to create new user.
 * @requires data {fistName, lastName, phone, password, tosAgreement}
 */
handlers._users.post = function(data, callback) {
    let firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    let lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length > 0 ? data.payload.phone.trim() : false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 5 ? data.payload.password.trim() : false;
    let tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement; // False if not filled. - same as set to false.

    if(firstName && lastName && phone && password && tosAgreement) {
        // Since we are going to SMS user, we care about the phone number, and it should be unique.
        _data.read('users', phone, function(err, data) {
            if(err) { // Note, we proceed only if `read` failed.
                // Hash the password.
                let hashedPassword = helpers.hash(password);

                if(hashedPassword) {
                    // Create the user object.
                    let userObject = { firstName, lastName, phone, hashedPassword, tosAgreement };
                    _data.create('users', phone, userObject, function(err){
                        if(!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error': 'Could not create new user.'});
                        }
                    })
                } else {
                    console.log(JSON.stringify(data, ' '));
                    callback(500, {'Error': 'Could not hash user password.'});
                }

                
            }  else {
                callback(400, {'Error': 'User with phone number already exists.'});
            }
        });
    } else {
        console.log('-----------------');
        console.log(firstName, lastName, phone, password, tosAgreement);
        console.log('-----------------');
        callback(400, {'Error': 'Missing required fields'});
    }
};

/**
 * Users.get
 * Only authenticated user access their object. No cross access other's。
 * Token shall be added in the request header part.
 * @requires data Reqest data, where phone is mandatory in the queryString.
 */
handlers._users.get = function(data, callback) {
    // Check the phone number is valid.
    let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim() > 5 ? data.queryStringObject.phone : false;
    if(phone) {

        // Get the token from the headers.
        let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Verify the token is valid for the given user.
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
            if(tokenIsValid) {
                _data.read('users', phone, function(err, data){
                    if(!err && data) {
                        // Remove hashedPassword from the object to be returned.
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403, {'Error': 'Missing required token in header or token is invalid.'});
            }
        })
    } else {
        callback(400, {'Error': 'Missing required field.'});
    }
};

/**
 * Users.put - To update the user details.
 * Token shall be added in the request header part.
 * @requires {phone} 
 */
handlers._users.put = function(data, callback) {
    // Check the phone number is valid.
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length > 0 ? data.payload.phone : false;

    // Check for the optional fields.
    let firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    let lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 5 ? data.payload.password.trim() : false;

    if(phone) {
        if(firstName||lastName||password) {
            // Get the token from the headers.
            let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
            // Verify the token is valid for the given user.
            handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
                if(tokenIsValid) {
                    _data.read('users', phone, function(err, data){
                        if(!err && data) {
                            // Update the fields necessary.
                            if(firstName) data.firstName = firstName;
                            if(lastName) data.lastName = lastName;
                            if(password) data.hashedPassword = helpers.hash(password);
        
                            _data.update('users', phone, data, function(err){
                                if(!err) {
                                    callback(200, data);
                                } else {
                                    console.log(err);
                                    // HTTP 500 here for valid user input but somethng wrong at the server side.
                                    callback(500, {'Error': 'Could not update the user.'});
                                }
                            });
                        } else {
                            // Also applies for 404, but some prefer not to have 404 in PUT.
                            callback(400, {'Error': 'The specified user does not exist.'});
                        }
                    });
                } else {
                    callback(403, {'Error': 'Missing required token in header or token is invalid.'});
                }
            });
        } else {
            callback(400, {'Error': 'Missing fields to update.'});
        }


        
    } else {
        callback(400, {'Error': 'Missing required field.'});
    }
};

/**
 * Users.delete
 * @requires {phone} 
 */
handlers._users.delete = function(data, callback) {
    // Check the phone number is valid.
    let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length > 0 ? data.queryStringObject.phone : false;
    if(phone) {
        // Get the token from the headers.
        let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Verify the token is valid for the given user.
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
            if(tokenIsValid) {
                _data.read('users', phone, function(err, data){
                    if(!err && data) {
                        // Remove hashedPassword from the object to be returned.
                        delete data.hashedPassword;
        
                        _data.delete('users', phone, function(err){
                            if(!err) {
                                let checks = typeof(data.checks) == 'object' && data.checks instanceof Array ? data.checks : false;
                                if(checks.length > 0) {
                                    // Counters for the async calls.
                                    let checksDeleted = 0;
                                    let checkDeletionError = false;
                                    for(let i=0, j=checks.length; i<j; i++) {
                                        _data.delete('checks', checks[0], function(err){
                                            if(err) {
                                                checkDeletionError = true;
                                            }
                                            checksDeleted++;
                                            // The following comparison is critical.
                                            // It makes use of the racing condition, so we work
                                            // only when it's the last one!
                                            if(checksDeleted == j) {
                                                if(checkDeletionError) {
                                                    callback(500, {'Error': 'Failed to delete attached checks.'});
                                                } else {
                                                    callback(200, data);
                                                }
                                            }
                                        })
                                    }
                                } else {
                                    // Return deleted user record.
                                    callback(200, data);
                                }
                            } else {
                                callback(500, {'Error':'Could not delete the specified user.'});
                            }
                        });
                    } else {
                        callback(400, {'Error': 'Could not find the specified user.'});
                    }
                });
            } else {
                callback(403, {'Error': 'Missing required token in header or token is invalid.'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field.'});
    }
};

// Checks
handlers.checks = function(data, callback) {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        // Here we will pass to sub handler.
        handlers._checks[data.method](data, callback);
    } else {
        callback(405); // HTTP 405 - Method not allowed.
    }
};

// Tokens
handlers.tokens = function(data, callback) {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        // Here we will pass to sub handler.
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405); // HTTP 405 - Method not allowed.
    }
};


// Users.
handlers.users = function(data, callback) {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        // Here we will pass to sub handler.
        handlers._users[data.method](data, callback);
    } else {
        callback(405); // HTTP 405 - Method not allowed.
    }
};

module.exports = handlers;
