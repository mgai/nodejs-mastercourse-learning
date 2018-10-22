/* 
 * Library for storing and editing data.
 * 
 */

// Dependecies
const fs = require('fs');
const path = require('path');

const helpers = require('./helpers');

// Conatiner for this module.
const lib = {};

// Base directory for the data folder.
lib.baseDir = path.join(__dirname, '/../.data');    // Construct the absolute path for the data folder. __dirname - curr dir for the file.

/**
 * Write data to a file.
 * @param dir Directory for the data collections (arranged as table hierarchy)
 * @param file Actual file., omitting the .json suffix.
 * @param data Data for writing.
 * @param callback callback(err) pattern - false means no error.
 */
lib.create = function(dir, file, data, callback) {
    fs.open([lib.baseDir,dir,file].join(path.sep) + '.json', 'wx', function(err, fd){
        if (!err && fd) {
            // Convert data to string.
            let stringData = JSON.stringify(data);
            // Write the file.
            fs.writeFile(fd, stringData, function(err) {
                if(!err) {
                    fs.close(fd, function(err){
                        if(!err) {
                            callback(false);    // callback(err) pattern, so that false means no error.
                        } else {
                            callback(new Error('Error closing the file'));
                        }
                    });
                } else {
                    callback(new Error('Error writing to the file'));
                }
            });
        } else {
            callback(new Error('Could not create new file, it may already exist ' + err.message));
        }
    });
};

// Read data from a file, and then return the parsed JSON Object.
lib.read = function(dir, file, callback) {
    fs.readFile([lib.baseDir, dir, file].join(path.sep)+'.json', 'utf8', function(err, data){
        if(!err && data) {
            let parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data);
        }
    })
};

// Update data inside a file.
lib.update = function(dir, file, data, callback){
    // Open the file for writing.
    fs.open([lib.baseDir, dir, file].join(path.sep) + '.json', 'r+', function(err, fd) {
        if(!err && fd) {
            let stringData = JSON.stringify(data);
            fs.ftruncate(fd, function(err) {
                if(!err) {
                    fs.writeFile(fd, stringData, function(err) {
                        if(!err) {
                            fs.close(fd, function(err) {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing the file');
                                }
                            })
                        } else {
                            callback('Error writing to existing file.');
                        }
                    });
                } else {
                    callback(new Error(err, 'Error truncating file'));
                }
            })
        } else {
            callback(new Error(err, 'Could not open the file for updating, it may not exist yet.'))
        };
    });
};

// Delete a file.
lib.delete = function(dir, file, callback) {
    // Unlink - means delete.
    fs.unlink([lib.baseDir, dir, file].join(path.sep) + '.json', function(err) {
        if(!err) {
            callback(false);
        } else {
            callback(new Error('Error deleting file:' + err.message));
        }
    });
};

// List all the items in a directory.
lib.list = function(dir, callback) {
    fs.readdir([lib.baseDir, dir, ''].join(path.sep), function(err, data) {
        if(!err && data && data.length > 0) {
            let trimmedFileNames = data.map(e => e.replace('.json', ''));
            callback(false, trimmedFileNames);
        } else {
            callback(new Error('failed to list files:' + err));
        }
    });
}

// Export the module.
module.exports = lib;