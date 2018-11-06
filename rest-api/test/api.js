'use strict';
/**
 * API Tests.
 */

const app = require('./../index');
const assert = require('assert');
const http = require('http');
const config = require('./../lib/config');

// Holder for the tests.
const api =  {}

// Helpers
const helpers = {}
helpers.makeGetRequest = (path, callback) => {
    // Configure the request details.
    const requestDetails = {
        'protocol': 'http:',
        'hostname': 'localhost',
        'port': config.httpPort,
        'path': path,
        'headers': {
            'Content-Type': 'application/json'
        }
    }
    // Send the request.
    let req = http.request(requestDetails, res => {
        callback(res)
    })

    req.end()
}

api['app.init should start without throwing'] = done => {
    assert.doesNotThrow(() => {
        app.init(_ => {
            done();
        });
    });
}

api['/ping should respont to GET with 200'] = done => {
    helpers.makeGetRequest('/ping', res => {
        assert.equal(res.statusCode, 200);
        done();
    })
}

api['/api/users should respont to GET with 400'] = done => {
    helpers.makeGetRequest('/api/users', res => {
        assert.equal(res.statusCode, 400);
        done();
    })
}

api['A random path should respont to GET with 404'] = done => {
    helpers.makeGetRequest('/path/not/exist/', res => {
        assert.equal(res.statusCode, 404);
        done();
    })
}

// Export the tests to the runner.
module.exports = api
