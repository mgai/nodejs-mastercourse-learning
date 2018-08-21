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

        // Send the response.
        res.end('Hello world.\n');

        // Log the requests.
        console.log(`Request received on path: ${trimmedPath} with ${method}`);
        console.log('Query String Object: ', queryStringObject);
        console.log('Request received with headers:', headers);
        console.log('Payload: ', buffer);
    });


});

// Start the server, and have it listen on the port 3000.
server.listen(3000, function(){
    console.log('The server is listening on port 3000 now.');
});