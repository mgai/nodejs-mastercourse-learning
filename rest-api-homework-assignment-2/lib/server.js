/**
 * Server module.
 */
'use strict';

// Dependencies.
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

const debug = require('util').debuglog('server');

const config = require('./config');
const helpers = require('./helpers');

const users = require('./users');
const tokens = require('./tokens');

// Server container.
const server = {};

// Server logic for both http and https
server.unifiedServer = function(req, res) {
    // Processing the request.
    const parsedUrl = url.parse(req.url, true);   // true to parse QueryString.
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');
    const queryStringObject = parsedUrl.query;
    const method = req.method.toLowerCase();
    const headers = req.headers;

    // Processing Payload if any.
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    // data event is optional, as it will be emitted only if there is payload.
    req.on('data', data => buffer += decoder.write(data));
    /**
     * end event is ALWAYS emitted, upon end of the payload processing.
     * this marks we have received all the data, hence we could then start
     * the actual logic to route and handle the request accordingly.
     */
    req.on('end', () => {
        buffer += decoder.end();
        // Prepare the data object to send to the handler.
        const data = {
            trimmedPath, queryStringObject, method, headers,
            'payload': helpers.parseJsonToObject(buffer)
        };
        // Routing.
        const chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : server.router.notfound;

        chosenHandler(data, (statusCode, payload) => {
            // Default to 200 - OK.
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            // Convert the payload to string for returning.
            const payloadString = JSON.stringify(payload);

            // Response to client.
            res.setHeader('Content-Type', 'application/json'); // Returns JSON.
            res.writeHead(statusCode);
            res.end(payloadString);

            // TODO: Logging.
        });
    })
};

// Initiate the HTTP server.
server.httpServer = http.createServer(server.unifiedServer);
// Instantiate the HTTPS server.
server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsServerOptions, server.unifiedServer);

// In strict mode, definition must come BEFORE reference.
// server.notfound must be defined before server.router.
server.notfound = function(data, callback) {
    callback(404, {'Error': 'Invalid route.'});
}

// TODO: Define the routers.
server.router = {
    'users': users.routing,
    'tokens': tokens.routing,
    'items': null,
    'carts': null,
    'notfound': server.notfound
};

server.init = function() {
    server.httpServer.listen(config.httpPort, () => {
        console.log(helpers.ansiColorString.GREEN, `Server is listening on port ${config.httpPort} now in ${config.envName} mode.`);
    });
    server.httpsServer.listen(config.httpsPort, () => {
        console.log(helpers.ansiColorString.GREEN, `Server is listening on port ${config.httpsPort} now in ${config.envName} mode.`);
    });
}

// Export the module.
module.exports = server;
