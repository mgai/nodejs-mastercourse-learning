/**
 * Helper methods.
 */
'use strict';

// Dependencies
const debug = require('util').debuglog('helpers');
const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

// Container
const helpers = {};

/**
 * Answer colored string for colorful output in logging.
 * Use with console.log or debug.
 * E.g. 
 *  console.log(ansiColorString.RED, "This text should be red.");
 *  debug(ansiColorString.YELLOW, "This text should be yellow.");
 */
helpers.ansiColorString = {
    'RED': '\x1b[31m%s\x1b[0m',
    'GREEN': '\x1b[32m%s\x1b[0m',
    'YELLOW': '\x1b[33m%s\x1b[0m',
    'BLUE': '\x1b[34m%s\x1b[0m',
    'MAGENTA': '\x1b[35m%s\x1b[0m',
    'CYAN': '\x1b[36m%s\x1b[0m',
};

/**
 * Parse String to JSON object.
 * @param buffer String representation of the JSON object. 
 * @returns The JSON Object, or {} if parse failure.
 */
helpers.parseJsonToObject = function(buffer) {
    try {
        return JSON.parse(buffer);
    } catch(e) {
        debug('Invalid string received for JSON parsing. Returning {}', e);
        return {};
    }
};

helpers.hash = function(str) {
    if(typeof(process.env.NODE_SECRET) !== 'undefined' && process.env.NODE_SECRET.length > 0) {
        if(typeof(str) == 'string' && str.length > 0) {
            return crypto.createHmac('sha256', process.env.NODE_SECRET).update(str).digest('hex');
        } else {
            debug('Invalid content provided for hashing. Non-zero length string expected.');
            return false;
        }
    } else {
        console.warn(helpers.ansiColorString.RED, 'Missing NODE_SECRET for hashing');
        return false;
    }
};

helpers.md5 = function(str) {
    str = helpers.validate(str, {type: 'string'});
    if(str) {
        return crypto.createHash('md5').update(str).digest('hex');
    } else {
        debug('Empty string received., skipping.');
        return false;
    }
}

/**
 * Generate random string for specified length.
 * Mainly used for Token name.
 * NOTE: This is completely copied from the course source code.
 * @param len Integer for string length.
 */
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

/**
 * Validator.
 * @param data The date for validation check.
 * @param {type, length} rule - type:[number|string|object], length is used for string only.
 */
helpers.validate = function(data, {type, length=0}) {
    switch (type) {
        case 'number':
            return typeof(data) === 'number' && data % 1 === 0 ? data : false;
        case 'string':
            return typeof(data) === 'string' && data.trim().length > length ? data.trim() : false;
        case 'array':
            return typeof(data) === 'object' && data instanceof Array && data.length > 0 ? data : [];
        case 'object':
            return typeof(data) === 'object' ? data : false;
        default:
            return false;
    }
}

/**
 * Psuedo order price calculator.
 * For simplicity, let's return a fixed number - say $28.83.
 */

helpers.calculateOrderPrice = order => 2883;    // In Stripe minimum currency unit.

/**
 * Charge user credit card via Stripe
 * @param card Psuedo credit card info.
 * @param order order to charge.
 * @param callback callback(err)
 */
helpers.charge = function(card, order, callback) {
    const requestDetails = {
        protocol: 'https:',
        hostname: 'api.stripe.com',
        method: 'POST',
        path: '/v1/charges',
        auth: 'sk_test_4eC39HqLyjWDarjtT1zdp7dc:'
    };

    const payload = {
        amount: helpers.calculateOrderPrice(order),
        currency: 'usd',    // Assume USD for simplicity.
        description: 'Pizza order bill',
        source: 'tok_visa'
    };

    const stringPayload = querystring.stringify(payload);

    // Instantiate the request.
    const req = https.request(requestDetails, res => {
        const status = res.statusCode;

        if(status === 200 || status === 201) {
            debug(helpers.ansiColorString.GREEN, 'Charge sent');
            callback(false);    // Success, no error.
        } else {
            callback(status);
        }
    });

    req.on('error', callback);

    req.write(stringPayload);
    req.end();
};

/**
 * Build the Invoice Email content.
 * TODO: Make it nice...
 * @param order 
 */
helpers.buildInvoiceEmail = function(order) {
    return JSON.stringify(order);
}

/**
 * Send Invoice to user via email.
 * @param user for email.
 * @param order order for invoice generation
 * @param callback callback(err)
 */
helpers.sendInvoice = function(user, order, callback) {
    const requestDetails = {
        protocol: 'https:',
        hostname: 'api.mailgun.net',
        method: 'POST',
        path: '/v3/sandbox807d0c62555d4036914bed63fcbdfa93.mailgun.org/messages',
        auth: 'api:4332d91e697e30c5b60430cbfba827ae-f45b080f-ec41e890'
    };

    const payload = {
        from: 'Mailgun Sandbox <postmaster@sandbox807d0c62555d4036914bed63fcbdfa93.mailgun.org>',
        to: user.email,
        subject: 'Invoice from Pizza shop',
        text: helpers.buildInvoiceEmail(order)
    };

    debug(helpers.ansiColorString.CYAN, JSON.stringify(payload));

    const stringPayload = querystring.stringify(payload);

    requestDetails.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
    };

    // Instantiate the request.
    const req = https.request(requestDetails, res => {
        const status = res.statusCode;

        if(status === 200 || status === 201) {
            debug(helpers.ansiColorString.GREEN, 'Invoice sent.');
            callback(false);    // Success, no error.
        } 
        else {
            callback(status);
        }
    });

    req.on('error', (err) => {
        debug(helpers.ansiColorString.CYAN, err);
        callback(err);
    });

    req.write(stringPayload);
    req.end();
};

// Export
module.exports = helpers;