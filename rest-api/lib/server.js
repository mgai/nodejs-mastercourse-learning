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
        const chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;
        // Construct the data object to send to the handler.
        const data = {
            trimmedPath,
            queryStringObject,
            method,
            headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        // Route the request to the handler specified.
        chosenHandler(data, function(statusCode, payload){
            // Use the status code called back by the handler, or default to 200.
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            // Use the payload called back by the handler, or default to empty object.
            payload = typeof(payload) == 'object' ? payload : {};

            // Convert the payload to a string.
            let payloadString = JSON.stringify(payload);

            // Return the response.
            res.setHeader('Content-Type', 'application/json');  // Inform client we are sending JSON.
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log the requests.
            console.log(`Request received on path: ${trimmedPath} with ${method}`);
            console.log('Query String Object: ', queryStringObject);
            console.log('Request received with headers:', headers);
            console.log('Payload: ', buffer);
            console.log('Response Returned: ', statusCode, payloadString);
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
    'sample': handlers.sample,
    'ping': handlers.ping,
    'hello': handlers.hello,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks
};

server.init = function() {
    // Start the server, and have it listen on the port 3000.
    server.httpServer.listen(config.httpPort, function(){
        console.log(`The server is listening on port ${config.httpPort} now in ${config.envName} mode.`);
    });

    // Start the HTTPS server.
    server.httpsServer.listen(config.httpsPort, function(){
        console.log(`The server is listening on port ${config.httpsPort} now in ${config.envName} mode.`);
    });
}

module.exports = server;