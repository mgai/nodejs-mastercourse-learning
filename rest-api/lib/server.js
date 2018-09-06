'use strict';
/**
 * Server related tasks.
 */

// Dependencies.
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const StringDecoder = require('string_decoder').StringDecoder;

const util = require('util');
const debug = util.debuglog('server');

const config = require('./config'); // Default to load `config.js`.
const _data = require('./data');    // require data.js
const handlers = require('./handlers');
const helpers = require('./helpers');
const path = require('path');

// Instantiate the server module object.
const server = {};

// All the server logic for both http and https.
server.unifiedServer = function(req, res) {
    // Get the URL and Parse it.
    let parsedUrl = url.parse(req.url, true); // true means to call QueryString to parse the query.

    // Get the path of the URL.
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object.
    const queryStringObject = parsedUrl.query;

    // Get the HTTP method.
    const method = req.method.toLowerCase();

    // Get the headers as an object.
    const headers = req.headers;

    // Get the payload, if any.
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    // Data event would ONLY be called IF Payload exists.
    req.on('data', function(data){
        buffer += decoder.write(data);
    });
    // End event will be called ALWAYS.
    req.on('end', function(){
        buffer += decoder.end();

        // Choose the handler this request should go to.
        let chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;
        
        // Here we need to enhance the handler for public, so that it supports wildcard 'public/*'.
        chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;
        
        // Construct the data object to send to the handler.
        const data = {
            trimmedPath,
            queryStringObject,
            method,
            headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        // Route the request to the handler specified.
        // contentType - whether JSON or HTML page.
        chosenHandler(data, function(statusCode, payload, contentType){
            // Default content type to JSON.
            contentType = typeof(contentType) == 'string' ? contentType : 'json';

            // Use the status code called back by the handler, or default to 200.
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            // Return the response parts that are content specific.
            let payloadString = '';
            if (contentType === 'json') {
                res.setHeader('Content-Type', 'application/json');  // Inform client we are sending JSON.
                // Use the payload called back by the handler, or default to empty object.
                payload = typeof(payload) == 'object' ? payload : {};
                // Convert the payload to a string.
                payloadString = JSON.stringify(payload);
            } else if (contentType === 'html') {
                res.setHeader('Content-Type', 'text/html');  // Inform client we are sending HTML.
                payloadString = typeof(payload) == 'string' ? payload : '';
            } else if (contentType === 'favicon') {
                res.setHeader('Content-Type', 'image/x-icon');  // Inform client we are sending HTML.
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            } else if (contentType === 'css') {
                res.setHeader('Content-Type', 'text/css');  // Inform client we are sending HTML.
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            } else if (contentType === 'png') {
                res.setHeader('Content-Type', 'image/png');  // Inform client we are sending HTML.
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            } else if (contentType === 'jpg') {
                res.setHeader('Content-Type', 'image/jpeg');  // Inform client we are sending HTML.
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            } else if (contentType === 'plain') {
                res.setHeader('Content-Type', 'text/plain');  // Inform client we are sending HTML.
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }

            // Return the content parts that are common to all.
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log the requests.
            // If the response is 200, print green. Otherwise red.
            if(statusCode == 200) {
                debug('\x1b[32m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
            } else {
                debug('\x1b[31m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
            }
            debug(`Request received on path: ${trimmedPath} with ${method}`);
            debug('Query String Object: ', queryStringObject);
            debug('Request received with headers:', headers);
            debug('Payload: ', buffer);
            debug('Response Returned: ', statusCode, payloadString);
        });
    });
};

// Instantiate the HTTP server.
server.httpServer = http.createServer(server.unifiedServer);

// Instantiate the HTTPS server.
server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsServerOptions, server.unifiedServer);

// Define a request router.
server.router = {
    '': handlers.index, // handles the root.
    'account/create': handlers.accountCreate,   // Serve HTML page for sign up.
    'account/edit': handlers.accountEdit,   // Delete will be added as a button here.
    'account/deleted': handlers.accountDeleted, // After deletion, the deleted page should be shown.
    'session/create':  handlers.sessionCreate, // Login form. 
    'session/deleted': handlers.sessionDeleted,
    'checks/all': handlers.checksList,   // Protected, logged in.
    'checks/create': handlers.checksCreate,
    'checks/edit':  handlers.checksEdit,
    'sample': handlers.sample,
    'ping': handlers.ping,
    'hello': handlers.hello,
    'api/users': handlers.users,
    'api/tokens': handlers.tokens,
    'api/checks': handlers.checks,
    'favicon.ico': handlers.favicon,    // Serve the favicon from the baseUrl.
    'public': handlers.public
};

server.init = function() {
    // Start the server, and have it listen on the port 3000.
    server.httpServer.listen(config.httpPort, function(){
        // Send to console log in Color.
        console.log('\x1b[36m%s\x1b[0m', `The server is listening on port ${config.httpPort} now in ${config.envName} mode.`);
    });

    // Start the HTTPS server.
    server.httpsServer.listen(config.httpsPort, function(){
        console.log('\x1b[35m%s\x1b[0m', `The server is listening on port ${config.httpsPort} now in ${config.envName} mode.`);
    });
}

module.exports = server;