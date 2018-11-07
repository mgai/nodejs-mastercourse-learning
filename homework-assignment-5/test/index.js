/**
 * Test Runner index.
 */

process.env.NODE_ENV='testing';

let _app = {};

_app.tests = {};
_app.tests.unit = require('./unit');

_app.countTests = () => {
    let counter = 0;
    for (let key in _app.tests) {
        if(_app.tests.hasOwnProperty(key)) {
            for(let k in _app.tests[key]) {
                if(_app.tests[key].hasOwnProperty(k)) {
                    counter++;
                }
            }
        }
    }
    return counter;
}

_app.runTests = () => {
    let errors = [];
    let successes = 0;
    let limit = _app.countTests();
    let counter = 0;
    
    for (let key in _app.tests) {
        if(_app.tests.hasOwnProperty(key)) {
            let subTests = _app.tests[key];
            for (let test in subTests) {
                if(subTests.hasOwnProperty(test)) {
                    (function(){
                        let testName = test;
                        let testFunction = subTests[test];
                        try {
                            testFunction(function(){
                                // This is the done() callback, so when this is triggered, test is done successfully.
                                console.log('\x1b[32m%s\x1b[0m', 'OK:\t', testName);
                                counter++;
                                successes++;
                                if(counter == limit) {
                                    _app.produceTestReport(limit, successes, errors);
                                }
                            })
                        } catch(e) {
                            // Test failed, so we log it in red.
                            console.log('\x1b[31m%s\x1b[0m', 'NOK:\t', testName);
                            errors.push({
                                'name': testName,
                                'error': e
                            });

                            counter++;
                            if( counter ==limit ) {
                                _app.produceTestReport(limit, successes, errors);
                            }
                        }
                    })();   //Closure without global pollution.
                }
            }
        }
    }
}

_app.produceTestReport = (limit, successes, errors) => {
    console.log();
    console.log("=-=-=-=-=-= Test Report =-=-=-=-=-=");
    console.log();
    console.log(`Total Test performed: ${limit}`);
    console.log(`Successes: ${successes}`);
    console.log(`Failed: ${errors.length}`);
    console.log();
    if(errors.length) {
        console.log("=-=-=-=-=-= Error Details =-=-=-=-=");
        console.log();
        errors.forEach(error => {
            console.log('\x1b[31m%s\x1b[0m', error.name);
            console.dir(error.error, {'color': true});
            console.log();
        });
        console.log("=-=-=-=-=-= End of Details =-=-=-=-=");
    }
    console.log();
    console.log("=-=-=-=-=-= End of Report =-=-=-=-=-=");
    process.exit(0);    // Just to exit from the app.
}

_app.runTests();