/**
 * Library for storing and rotating logs.
 */

// Dependencies.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');   // Compression/De-compression.

// Container for the module.
const lib = {};

lib.baseDir = path.join(__dirname, '/../.logs/');

// Append a string to file. Create the file if not exists.
lib.append = function(file, str, callback) {
    // Open the file for appending.
    fs.open([lib.baseDir, file].join(path.sep) + '.log', 'a', function(err, fd) {
        if(!err && fd) {
            // Append to the file and close it.
            fs.appendFile(fd, str + '\n', function(err) {
                if(!err) {
                    fs.close(fd, function(err) {
                        if(!err) {
                            callback(false);
                        } else {
                            callback('Error closing file appending to.');
                        }
                    });
                } else {
                    callback('Error appending to file.' + err.message);
                }
            })
        } else {
            callback("Error: Failed to open the file for appending.")
        }
    });
}

/**
 * List all the logs and optionally include the compressed logs.
 * @param includeCompressedLogs - true: include.
 * @param callback(err, data) 
 */
lib.list = function(includeCompressedLogs, callback) {
    fs.readdir(lib.baseDir, function(err, files) {
        if(!err && files && files.length > 0) {
            let trimmedFileNames = [];
            files.forEach(function(f) {
                // Add the .log files.
                if(f.indexOf('.log') > -1) {
                    trimmedFileNames.push(f.replace('.log', ''));
                }

                // Addon the compressed files. - .gz files.
                if(f.indexOf('.gz.b64' > -1) && includeCompressedLogs) {
                    trimmedFileNames.push(f.replace('.gz.b64', ''));
                }
            });

            callback(false,trimmedFileNames);
        } else {
            callback(err, files);
        }
    })
}

/**
 * Compress the contents of one .log file -> .gz.b64 (base64 encoded) in the same directory.
 * @requires logId
 * @requires newFileId
 * @requires callback(err)
 */
lib.compress = function(logId, newFileId, callback) {
    let srcFile = logId + '.log';
    let destFile = newFileId + '.gz.b64';

    fs.readFile(lib.baseDir + srcFile, 'utf8', function(err, input) {
        if(!err && input) {
            // Compress the data using gzip.
            zlib.gzip(input, function(err, buffer) {
                if(!err && buffer) {
                    // Send the data to the destination file.
                    fs.open(lib.baseDir + destFile, 'wx', function(err, fd) {
                        if(!err && fd) {
                            fs.writeFile(fd, buffer.toString('base64'), function(err) {
                                if(!err) {
                                    fs.close(fd, function(err) {
                                        if(!err) callback(false)
                                        else callback(err);
                                    });
                                } else {
                                    callback(err);
                                }
                            })
                        } else {
                            callback(err);
                        }
                    })
                } else {
                    callback(err);
                }
            })
        } else {
            callback(err);
        }
    })
};

/**
 * Decompress .gz.b64 file into a string variable.
 */
lib.decompress = function(fileId, callback) {
    let fileName = fileId + '.gz.b64';
    fs.readFile(lib.baseDir + fileName, 'utf8', function(err, str) {
        if(!err && str) {
            let inputBuffer = Buffer.from(str, 'base64');   // Decoding base64 string.
            zlib.unzip(inputBuffer, function(err, outputBuffer) {
                if(!err && outputBuffer) {
                    let str = outputBuffer.toString();
                    callback(false, str);
                } else {
                    callback(err);
                }
            })
        } else {
            callback(err);
        }
    })
};

/**
 * Truncate the log file.
 * @param logId 
 * @param callback 
 */
lib.truncate = function(logId, callback) {
    fs.truncate(lib.baseDir + logId + '.log', 0, function(err) {
        if(!err) {
            callback(false);
        } else {
            callback(err);
        }
    })
}

// Export the module.
module.exports = lib;