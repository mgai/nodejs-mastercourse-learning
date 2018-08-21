/*
 * Primary file for the API.
 */

// Dependencies.
const http = require('http');
const url = require('url');

// The server should response to all requests with a string.
const server = http.createServer(function(req, res) {
    // Get the URL and Parse it.
    let parsedUrl = url.parse(req.url, true); // true means to call QueryString to parse the query.

    // Get the path of the URL.
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Send the response.
    res.end('Hello world.\n');

    // Log the requests.
    console.log('Request received on path: '+trimmedPath);
});

// Start the server, and have it listen on the port 3000.
server.listen(3000, function(){
    console.log('The server is listening on port 3000 now.');
});