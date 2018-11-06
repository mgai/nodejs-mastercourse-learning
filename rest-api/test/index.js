/*
 * Test runner
 *
 */

// Override the NODE_ENV.
process.env.NOE_ENV='testing';

// Application logic for the test runner.
let _app = {};

// Container for the tests.
_app.tests = {};
_app.tests.unit = require('./unit');
_app.tests.api = require('./api');

_app.countTests = function() {
    let counter = 0;
    for (let key in _app.tests) {
        if(_app.tests.hasOwnProperty(key)) {
            let subTests = _app.tests[key];
            for(let testName in subTests) {
                if(subTests.hasOwnProperty(testName)) {
                    counter++;
                }
            }
        }
    }
    return counter;
}

_app.runTests = function() {
    let errors = []; // Hold all the errors.
    let successes = 0;  // Number of passed tests.
    let limit = _app.countTests();  // Max tests before give up.
    let counter = 0;    // Test performed.  

    for (let key in _app.tests) {
        if(_app.tests.hasOwnProperty(key)) {
            let subTests = _app.tests[key];
            for(let testName in subTests) {
                if(subTests.hasOwnProperty(testName)) {
                    (function(){
                        let tmpTestName = testName;
                        let testValue = subTests[testName];
                        try {
                            testValue(function() {
                                // If it calls back without throwing, then it succeeded, so log it in GREEN.
                                console.log('\x1b[32m%s\x1b[0m', tmpTestName);
                                counter++;
                                successes++;
                                if(counter == limit) {
                                    _app.produceTestReport(limit, successes, errors);   
                                }
                            })
                        } catch(e) {
                            // Log it in red.
                            errors.push({
                                'name': testName,
                                'error': e
                            });

                            console.log('\x1b[31m%s\x1b[0m', tmpTestName);
                            counter ++;
                            if(counter == limit) {
                                _app.produceTestReport(limit, successes, errors);
                            }
                        }
                    })(); // Closure = wrap everything within, without polluting the global name space.
                }
            }
        }
    }
};

_app.produceTestReport = function(limit, successes, errors) {
    console.log("");
    console.log('----------Begin Test Report------------');
    console.log("");
    console.log("Total Tests: ", limit);
    console.log(`Pass: ${successes}`);
    console.log(`Fail: ${errors.length}`);
    console.log("");
    if(errors.length) {
        console.log('----------Begin Error Details------------');
        console.log("");
        errors.forEach(testError => {
            console.log('\x1b[31m%s\x1b[0m', testError.name);
            console.log(testError.error);
            console.log("");
        });
        console.log("");
        console.log('----------End Error Details------------');
    }

    console.log("");
    console.log("-----------End Test Report------------")
    process.exit(0);    // This is to quit the app server.
}

_app.runTests();