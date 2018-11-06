/*
 * Library demonstrates something throwing when its init() called.
 */

 let example = {};

 example.init = function() {
     // Intentionally throw error
     let foo = bar;
 }

 module.exports = example;
 