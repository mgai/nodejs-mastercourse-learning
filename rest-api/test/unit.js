'use strict';
/**
 * Unit Tests.
 */

const helpers = require('../lib/helpers');
const assert = require('assert'); // Built-in assertion library in Node JS.
const logs = require('./../lib/logs');
const exampleDebuggingProblem = require('../lib/exampleDebuggingProblem');

const unit = {};

// Assert getANumber() is returning an Number.
// done() is the callback once test completes.

unit['helpers.getANumber should return 1'] = function(done) {
    let val = helpers.getANumber();
    assert.equal(val, 1);
    done();
};

unit['helpers.getANumber should return a Number'] = function(done) {
    let val = helpers.getANumber();
    assert.equal(typeof(val), 'number');
    done();
};

unit['helpers.getANumber should return 2'] = function(done) {
    let val = helpers.getANumber();
    assert.equal(val, 2);
    done();
};

// Logs.list should callback an array and a false error.
unit['logs.list() should callback a false error and an array of log names'] = function(done) {
    logs.list(true, function(err, logFileNames) {
        assert.equal(err, false);
        assert.ok(logFileNames instanceof Array);
        assert.ok(logFileNames.length > 1);
        done();
    })
};

// logs.truncate should not throw if the logId does not exist.
unit['logs.truncate() should not thrown if the logId does not exist. It should throw an error instead'] = function(done) {
    assert.doesNotThrow(function() {    // doesNotThrow must be tested with a function, for a closure.
        logs.truncate('I do not exist', function(err) {
            assert.ok(err);
            done();
        });
    }, TypeError);
}

unit['exampleDebuggingProblem.init should not throw, but it does.'] = function(done) {
    assert.doesNotThrow(function() {    // doesNotThrow must be tested with a function, for a closure.
        exampleDebuggingProblem.init();
        done();
    }, TypeError);
}

module.exports = unit;