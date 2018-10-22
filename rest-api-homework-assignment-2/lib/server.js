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
const items = require('./items');
const carts = require('./carts');
const orders = require('./orders');
const handlers = require('./handlers');

// Server container.
const server = {};

server.responseToClient = function(statusCode, payload, contentType, res) {
    // Default to JSON is not specified or invalid contentType.
    // Default is commented out since it'll be assigned in the default switch case.
    // contentType = typeof(contentType) == 'string' ? contentType: 'json';
    // Default to status 200 if not specified or invalid.
    statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

    let payloadString='';
    switch(contentType) {
        case 'html':
            res.setHeader('Content-Type', 'text/html');
            payloadString = typeof(payload) == 'string' ? payload : '';
            break;
        case 'css':
            res.setHeader('Content-Type', 'text/css');
            payloadString = typeof(payload) !== 'undefined' ? payload : '';
            break;
        case 'favicon' :
            res.setHeader('Content-Type', 'image/x-icon');
            payloadString = typeof(payload) !== 'undefined' ? payload : '';
            break;
        case 'png':
            res.setHeader('Content-Type', 'image/png');
            payloadString = typeof(payload) !== 'undefined' ? payload : '';
            break;
        case 'jpg':
            res.setHeader('Content-Type', 'image/jpeg');
            payloadString = typeof(payload) !== 'undefined' ? payload : '';
            break;
        case 'plain':
            res.setHeader('Content-Type', 'text/plain');
            payloadString = typeof(payload) !== 'undefined' ? payload : '';
            break;
        // case 'json':
        default:
            res.setHeader('Content-Type', 'application/json');
            payload = typeof(payload) == 'object' ? payload: {};
            payloadString = JSON.stringify(payload);
    }

    res.writeHead(statusCode);
    res.end(payloadString);

}

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

        debug(helpers.ansiColorString.BLUE, 'Dumping request info extracted');
        debug(data);
        debug(helpers.ansiColorString.BLUE, 'End of request dump');
    
        
        // Routing.
        let chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : server.router.notfound;
        // Here we need to enhance the handler for public, so that it supports wildcard 'public/*'.
        chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;
        
        chosenHandler(data, function (statusCode, payload, contentType) {
            server.responseToClient(statusCode, payload, contentType, res);
        });
    });
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
    // Front-end routers.
    '': handlers.index,
    'favicon.ico': handlers.favicon,
    'public': handlers.public,
    'items': handlers.items,
    // Sign Up page.
    'account/create': handlers.accountCreate,
    'account/edit': handlers.accountEdit,
    'account/deleted': handlers.accountDeleted,
    // Log on.
    'session/create': handlers.sessionCreate,
    // Log out.
    'session/deleted': handlers.sessionDeleted,
    'carts': handlers.cartsEdit,
    'order/checkout': handlers.orderCheckout,
    'order/edit': handlers.orderEdit,
    'order/sent': handlers.orderSent,
    // API routers.
    'api/users': users.routing,
    'api/tokens': tokens.routing,
    'api/items': items.routing,
    'api/carts': carts.routing,
    'api/orders': orders.routing,
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
