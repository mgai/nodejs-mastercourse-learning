/**
 * Library for all the functions to be tested.
 */

const lib = {};

lib.getNumberOne = () => { return 1; };

lib.getNumberOneAsync = (callback) => { callback(1); };

// callback(err)
lib.acceptNumberOnly = (num, callback) => {
    if(typeof(num)!== 'number') {
        callback(new TypeError('Only number is accepted'));
    } else {
        callback();
    }
};

module.exports = lib;