/*
 * Primary file for the API.
 */

// Dependencies.
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

// The server should response to all requests with a string.
const server = http.createServer(function(req, res) {
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
        const chosenHander = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handler.
        const data = {
            trimmedPath,
            queryStringObject,
            method,
            headers,
            'payload': buffer
        };

        // Route the request to the handler specified.
        chosenHander(data, function(statusCode, payload){
            // Use the status code called back by the handler, or default to 200.
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            // Use the payload called back by the handler, or default to empty object.
            payload = typeof(payload) == 'object' ? payload : {};

            // Convert the payload to a string.
            let payloadString = JSON.stringify(payload);

            // Return the response.
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


});

// Start the server, and have it listen on the port 3000.
server.listen(3000, function(){
    console.log('The server is listening on port 3000 now.');
});

// Define the handlers.
const handlers = {};

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

// Define a request router.
const router = {
    'sample': handlers.sample
};