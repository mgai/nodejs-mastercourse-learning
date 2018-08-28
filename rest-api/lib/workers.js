'use strict';
/**
 * Worker related tasks.
 */

// Dependencies
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const url = require('url');

const helpers = require('./helpers');
const _data = require('./data');
const _logs = require('./logs');

// General container.
const workers = {};


/**
 * gatherAllCheks.
 * Look up all the checks, get their data and send to a validator.
 */
workers.gatherAllChecks = function() {
    _data.list('checks', function(err, checks) {
        if(!err && checks.length > 0) {
            checks.forEach(function(check) {
                /*
                 * Here we triggered the async read() function, which would then trigger
                 * the individual check handling function. We do NOT need to return anything
                 * to this intiator, as long as the check is initiated and handed. that's fine.
                 */
                _data.read('checks', check, function(err, originalCheckData) {
                    if(!err && originalCheckData) {
                        // Pass it to the check validator.
                        // Let that function contitnue or log error if needed.
                        workers.validateCheckData(originalCheckData);
                    } else {
                        console.log('Error reading individual check data.');
                    }
                })
            })
        } else {
            console.log('Error: Could not find any checks to process.');
        }
    })
}

/**
 * Sanity check the check-data.
 */
workers.validateCheckData = function(originalCheckData) {
    originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData !== null ? originalCheckData : false;
    originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false;
    originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length > 0 ? originalCheckData.userPhone.trim() : false;
    originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['https', 'http'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol.trim() : false;
    originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
    originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(originalCheckData.method.trim()) > -1 ? originalCheckData.method.trim() : false;
    originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
    originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds % 1 == 0 && originalCheckData.timeoutSeconds <=5 ? originalCheckData.timeoutSeconds : false;

    // Set the keys that may not be set (if the workers have never seen the check before.)
    originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state.trim() : 'down';
    originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked % 1 == 0 ? originalCheckData.lastChecked : false;

    // If all the checks passed, pass the data along to the next data in the process.
    if (originalCheckData.id &&
        originalCheckData.userPhone && originalCheckData.protocol && originalCheckData.url && originalCheckData.method &&
        originalCheckData.successCodes && originalCheckData.timeoutSeconds)
    {
        workers.performCheck(originalCheckData);
    } else {
        console.log("Error: One of the checks is not properly formatted. Skipping it.");
    }
}

// Perform the check, send the originalCheckData and the outcome of the check process to the next step.
workers.performCheck = function(originalCheckData) {
    // Prepare the initial check outcome.
    const checkOutcome = {
        'error' : false, 'responseCode': false
    };

    // Mark the outcome has not been send yet.
    let outcomeSent = false;

    // Parse the hostname and the path out of the original check data.
    let parsedUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url, true);
    let hostName = parsedUrl.hostname;
    let path = parsedUrl.path;

    // Construct the request.
    const requestDetails = {
        'protocol': originalCheckData.protocol + ':',
        'hostname': hostName,
        'method': originalCheckData.method.toUpperCase(),
        path,
        'timeout': originalCheckData.timeoutSeconds * 1000, // Milliseconds.
    };

    // Instantiate the request object based on the protocol to select the module dynamically.
    let _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
    let req = _moduleToUse.request(requestDetails, function(res) {
        // Grab the status of the sent request.
        let status = res.statusCode;

        // Update the checkOutcome and pass the data along.
        checkOutcome.responseCode = status;
        if(!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    // Bind to the error event so it doesn't get thrown.
    req.on('error', function(e) {
        // Update the checkOutcome and pass the data along.
        checkOutcome.error = {'error': true, 'value': e};
        if(!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    // Bind to the timeout event.
    req.on('timeout', function(e) {
        // Update the checkOutcome and pass the data along.
        checkOutcome.error = {'error': true, 'value': 'timeout'};
        if(!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    /**
     * By making use of the outcomeSent variable, effectively we make sure processCheckOutcome(), the next step,
     * will ONLY be triggered ONCE, whichever gets triggered first - request, error or timeout.
     */

    // End the request and actually send it.
    req.end();
};

/**
 * Process the check outcome, update the check data as needed, triggers an alert to the user if needed.
 * Special logic for accommodating a check that has NEVER been tested before - No alert for this case.
 * Next step: alertUserToStatusChange().
 */
workers.processCheckOutcome = function(originalCheckData, checkOutcome) {
    // Decide if the check is up if - No error, and response is valid.
    let state = !checkOutcome.err && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

    // Decide if an alert is warranted.
    // originalCheckData.lastChecked - To guarantee the check has been performed before. So that we don't false alert upon initial check.
    // originalCheckData.state !== state - To confirm a state change, which is the meaning of the alert.
    let alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

    // Common for logging and actual check data.
    let timeOfCheck = Date.now();

    // Update the check data.
    let newCheckData = {...originalCheckData, state, 'lastChecked': timeOfCheck};
    workers.log(originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck);

    // Save the updates.
    _data.update('checks', newCheckData.id, newCheckData, function(err){
        if(!err) {
            // Send the new check data to the next phase in the process if needed.
            if(alertWarranted) {
                workers.alertUserToStatusChange(newCheckData);
            } else {
                console.log('Check outcome has not changed. No alert.');
            }
        } else {
            console.log(new Error('Error trying to save updates to one of the checks.'));
        }
    });
};

// Alert the user as to a change in their check status.
workers.alertUserToStatusChange = function(newCheckData) {
    let msg = `Alert: your check for ${newCheckData.method.toUpperCase()} ${newCheckData.protocol} is currently ${newCheckData.status}.`;
    helpers.sendTwilioSms(newCheckData.userPhone, msg, function(err) {
        if(!err) {
            console.log('Success: User was alerted to a status change in their check, via sms.');
            console.log(msg);
        } else {
            console.log('Error: Failed to send alert to user upon check status change - ' + err);
        }
    })
};

/**
 * Internal helper function for logging.
 * @param originalCheckData 
 * @param checkOutcome 
 * @param state 
 * @param alertWarranted 
 * @param timeOfCheck 
 */
workers.log = function(originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck) {
    let logData = {
        'check': originalCheckData,
        'outcome': checkOutcome,
        'state': state,
        'alert': alertWarranted,
        'time': timeOfCheck
    };

    let logString = JSON.stringify(logData);

    // Determine the name of the log file.
    let logFilename = originalCheckData.id;

    // Append the log string to the file.
    _logs.append(logFilename, logString, function(err) {
        if(!err) {
            console.log('Logging to file succeeded.');
        } else {
            console.log('Logging to file failed.');
        }
    })
};

// Rotate (compress) the log files.
workers.rotateLogs = function() {
    // List all the non-compressed log files.
    _logs.list(false, function(err, logs) {
        if(!err && logs && logs.length > 0) {
            logs.forEach(function(e) {
                // Compress the data to the different file.
                let logId = e.replace('.log', '');  // strip the suffix.
                let newFileId = logId + '-' + Date.now();
                _logs.compress(logId, newFileId, function(err) {
                    if(!err) {
                        _logs.truncate(logId, function(err) {
                            if(!err) {
                                console.log('Success truncating log file.');
                            } else {
                                console.log('Error truncating log file.', err);
                            }
                        })
                    } else {
                        console.log('Error compressing one of the logs.', err);
                    }
                });
            });
        } else {
            console.log('Error: could not find any logs to rotate.');
        }
    });
}

// Timer to execute the log rotation process once per day.
workers.logRotationLoop = function() {
    setInterval(function() {
        workers.rotateLogs();
    }, 1000* 60 * 60 * 24);
}

// Timer to execute the worker process once per minute.
workers.loop = function() {
    setInterval(function() {
        workers.gatherAllChecks();
    }, 1000* 30);
}


workers.init = function() {
    // Execute all the checks.
    workers.gatherAllChecks();
    // Loop to continue the checks.
    // The reason why we are making the call twice, is that setInterval() would NOT trigger immediately upon start, only after the first interval.
    workers.loop();
};

// Export the container.
module.exports = workers;
