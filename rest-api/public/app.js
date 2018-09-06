/*
 * Frontend Logic for application
 *
 */

// Container for the front-end.
var app = {};

// Config
app.config = {
    'sessionToken': false   // Will be an Token object {id} if set.
};

// AJAX Client for the RESTful API.
app.client = {};

/**
 * Interface for making API calls.
 * @param headers to send.
 * @param {*} path as this is already relative to own domain.
 * @param {*} method GET|POST|PUT|DELETE
 * @param {*} queryStringObject key:value pairs.
 * @param payload if any.
 * @param callback
 */
app.client.request = function(headers, path, method, queryStringObject, payload, callback) {
    // Set the defaults.
    headers = typeof(headers) == 'object' && headers !== null ? headers : {};
    path = typeof(path) == 'string' ? path : '/';
    method = typeof(method) == 'string' && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(method) > -1 ? method.toUpperCase() : 'GET';
    queryStringObject = typeof(queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {};
    payload = typeof(payload) == 'object' && payload !== null ? payload : {};
    // Usually we do not need to do such check on callback. We are doing here so that with or without callback is supported.
    callback = typeof(callback) == 'function' ? callback : false;

    // For each queryString parameter sent, add it to the path.
    let requestUrl = path + '?';
    let counter = 0;
    for(let queryKey in queryStringObject) {
        if(queryStringObject.hasOwnProperty(queryKey)) {
            counter++;
            // If at least one query string param has been added, prepend '&'.
            if(counter > 1) {
                requestUrl += '&';
            }
            // Add the key value.
            requestUrl = queryKey + '=' + queryStringObject[queryKey];
        }
    }

    // Form the http request as a JSON type.
    let xhr = new XMLHttpRequest();
    xhr.open(method, requestUrl, true); // true for async.
    xhr.setRequestHeader("Content-Type", "application/json");

    // For each header, add it to the request one by one.
    for(var headerKey in headers) {
        if(headers.hasOwnProperty(headerKey)) {
            xhr.setRequestHeader(headerKey, headers[headerKey]);
        }
    }

    // Add session token if present.
    if(app.config.sessionToken) {
        xhr.setRequestHeader("token", app.config.sessionToken.id);
    }

    // When the request comes back, handle the response.
    xhr.onreadystatechange = function() {
        if(xhr.readyState == XMLHttpRequest.DONE)  { // Request is DONE.
            let statusCode = xhr.status;
            let responseReturned = xhr.responseText;

            // Callback if requested. (Sometime we just want to send of the request, but sometimes we do.)
            if(callback) {
                try {
                    let parsedResponse = JSON.parse(responseReturned);
                    callback(statusCode, parsedResponse);
                } catch(e) {
                    callback(statusCode, false);
                }
            }
        }
    }

    //Send the payload as JSON.
    let payloadString = JSON.stringify(payload);
    xhr.send(payloadString);
};
