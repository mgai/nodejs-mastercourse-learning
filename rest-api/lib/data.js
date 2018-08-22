/* 
 * Library for storing and editing data.
 * 
 */

// Dependecies
const fs = require('fs');
const path = require('path');

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
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function(err, fd){
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
            callback(new Error('Could not create new file, it may already exist'));
        }
    });
};


// Export the module.
module.exports = lib;