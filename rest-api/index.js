/*
 * Primary file for the API.
 */

// Dependencies.
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const StringDecoder = require('string_decoder').StringDecoder;

const config = require('./config'); // Default to load `config.js`.
const _data = require('./lib/data');    // require data.js
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

// All the server logic for both http and https.
const unifiedServer = function(req, res) {
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
        const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
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
const httpServer = http.createServer(unifiedServer);

// Start the server, and have it listen on the port 3000.
httpServer.listen(config.httpPort, function(){
    console.log(`The server is listening on port ${config.httpPort} now in ${config.envName} mode.`);
});

// Instantiate the HTTPS server.
const httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions, unifiedServer);

// Start the HTTPS server.
httpsServer.listen(config.httpsPort, function(){
    console.log(`The server is listening on port ${config.httpsPort} now in ${config.envName} mode.`);
});

// Define a request router.
const router = {
    'sample': handlers.sample,
    'ping': handlers.ping,
    'hello': handlers.hello,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks
};