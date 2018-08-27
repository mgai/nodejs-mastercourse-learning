/**
 * General helper functions.
 */

// Dependencies.
const crypto = require('crypto');
const querystring = require('querystring');
// http and https modules do not work only to start a server, but also the functions for server communication.
const https = require('https');

const config = require('./config');

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
            'hstname': 'api.twilio.com',
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

// Exports.
module.exports = helpers;