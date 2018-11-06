/**
 * Library for all the functions to be tested.
 */

const lib = {};

lib.getNumberOne = () => { return 1; };

lib.getNumberOneAsync = (callback) => { callback(1); };

lib.acceptNumberOnly = (num) => {
    if(typeof(num)!== 'number') {
        
    }
}