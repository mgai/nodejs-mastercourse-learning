/**
 * General helper functions.
 */

// Dependencies.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const querystring = require('querystring');
const debug = require('util').debuglog('helpers');
// http and https modules do not work only to start a server, but also the functions for server communication.
const https = require('https');

const config = require('./config');

// Container.
let helpers = {};

// Helpers.

helpers.getANumber = function () { return 1; };

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

// Send an SMS message via Twilio.
helpers.sendTwilioSms = function(phone, msg, callback) {
    // Validate the params.
    phone = typeof(phone) == 'string' && phone.trim().length > 5 ? phone.trim() : false;

    // 1600 is the max length supported by Twilio.
    msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length < 1600 ? msg.trim(): false;

    if(phone && msg) {
        // Configure the request payload
        let payload = {
            'From': config.twilio.fromPhone,
            'To': '+86'+phone,
            'Body': msg,
        };

        // Stringify the payload.
        let stringPayload = querystring.stringify(payload);

        // Configure the request details.
        let requestDetails = {
            'protocol': 'https:',
            'hostname': 'api.twilio.com',
            'method': 'POST',
            'path': '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
            'auth': config.twilio.accountSid+':'+config.twilio.authToken,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload), // Buffer is globally available.
            }
        };

        // Instantiate the request.
        let req = https.request(requestDetails, function(res) {
            // Grab the status first.
            let status = res.statusCode;

            // Call back original caller if success.
            if(status === 200 || status === 201) {
                callback(false);    // Success, no error.
            } else {
                callback('Status code retured was: '+status);
            }
        });

        // Bind to the error event so it does not get thrown.
        req.on('error', function(e) {
            callback(e);
        });

        // Add the payload.
        req.write(stringPayload);

        // End the request - It will send it off.
        req.end();

    } else {
        callback(new Error('Given parameters were missing or invalid'));
    }

}

/**
 * Get the string content of a template.
 * @param templateName
 * @param data The key-value pairs for variable replacement in the template.
 * @param callback(err, templateStr) 
 */
helpers.getTemplate = function(templateName, data, callback) {
    templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
    data = typeof(data) == 'object' && data !== null ? data : {};

    if(templateName) {
        const templatesDir = path.join(__dirname, '/../templates/');
        fs.readFile(templatesDir + templateName + '.html', 'utf8', function(err, str) {
            if(!err && str && str.length > 0) {
                // Do interpolation on the string.
                let finalString = helpers.interpolate(str, data);
                callback(false, finalString);
            } else {
                debug(err);
                callback('No template could be found');
            }
        });
    } else {
        callback('A valid template name was not specified.');
    }
};

/**
 * Add the universal header and footer to a string (template),
 * pass the provided data object to the header and footer for interpolation. 
 */
helpers.addUniversalTemplates = function(str, data, callback) {
    str = typeof(str) == 'string' && str.length > 0 ? str : '';
    data = typeof(data) == 'object' && data !== null ? data : {};

    // Get the header.
    helpers.getTemplate('_header', data, function(err, headerString) {
        if(!err && headerString) {
            // Get the footer.
            helpers.getTemplate('_footer', data, function(err, footerString){
                if(!err && footerString) {
                    const fullString = headerString + str + footerString;
                    callback(false, fullString);
                } else {
                    debug(err);
                    callback('Could not find the footer template');
                }
            })
        } else {
            debug(err);
            callback('Could not find the header template');
        }
    });
}

/**
 * Take a given string and a data object, find/replace all the keys.
 * @param str The string for content to be replaced in.
 * @param data The data to be replaced INTO the str.
 */
helpers.interpolate = function(str, data) {
    str = typeof(str) == 'string' && str.length > 0 ? str : '';
    data = typeof(data) == 'object' && data !== null ? data : {};

    // Add the template globals to the data object.
    // prepending their key name with "global".
    for(let keyName in config.templateGlobals) {
        if(config.templateGlobals.hasOwnProperty(keyName)) {
            // We are not adding the global as an object, but rather a hard coded top level var.
            data['global.'+keyName] = config.templateGlobals[keyName];
        }
    };

    // For each key in the data object, insert its value into the string at the place.
    for(let key in data) {
        if(data.hasOwnProperty(key) && typeof(data[key]) == 'string') {
            let replace = data[key];
            let find = '{' + key + '}';
            // Single occurrence replacement with doing mere substr replacement.
            // str = str.replace(find, replace); 
            // For global replacement of every occurrence..
            let rx = new RegExp(find, 'g'); 
            str = str.replace(rx, replace);
        }
    }

    return str;
}

/**
 * Get the content of a static (public) asset.
 * @param fileName 
 * @param callback 
 */
helpers.getStaticAsset = function(fileName, callback) {
    fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName: false;
    if(fileName) {
        let publicDir = path.join(__dirname, '/../public/');
        fs.readFile(publicDir+fileName, function(err, data) {
            if(!err && data) {
                callback(false, data);
            } else {
                debug(err);
                callback('No file could be found.');
            }
        });
    } else {
        callback('A valid filename was not specified.');
    }
}

// Exports.
module.exports = helpers;