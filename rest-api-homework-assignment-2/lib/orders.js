/**
 * Order handler.
 */
'use strict';

// Dependencies
const debug = require('util').debuglog('orders');
const path = require('path');

const _data = require('./data');
const helpers = require('./helpers');
const carts = require('./carts');
const auth = require('./auth').auth;
const withUserId = require('./auth').withUserId;

// Container
const orders = {};

orders.post = (data, callback) => {
  auth(data, () => {
    withUserId(data, () => {
      const order = helpers.validate(data.payload.order, {type: 'array'});
      if(order) {
        _data.create(['orders', data.payload.userId].join(path.sep), helpers.createRandomString(20), order, err => {
          if(!err) {
            // 1. Charge the user via stripe.
            const card = helpers.validate(data.payload.card, {type: 'object'});
            if(card) {
              helpers.charge(card, order, err => {
                if(!err) {
                  _data.read('users', data.payload.userId, (err, user) =>{
                      if(!err && user) {
                          helpers.sendInvoice(user, order, (err) => {
                              if(!err) {
                                  callback(200);
                              } else {
                                  debug(helpers.ansiColorString.CYAN, err);
                                  callback(500, {'Error': 'Error sending email.'})
                              }
                          })
                      } else {
                          callback(500, {'Error': 'Failed to retrieve user record'});
                      }
                  });
                }
              })
            } else {
              callback(400, {'Error': 'Missing card details.'});
            }
          } else {
            debug(helpers.ansiColorString.RED, err);
            callback(500, {'Error': 'Failed to save order.'});
          }
        })
      } else {
        debug(helpers.ansiColorString.MAGENTA, 'Order provided is invalid');
        callback(400, {'Error': 'Missing required field(s).'});
      }
    }, callback);
  }, callback);
};

// Orders routing check.
orders.routing = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if(acceptableMethods.indexOf(data.method) > -1) {
      orders[data.method](data, callback);
  } else {
      callback(405); // HTTP 405 - Method not allowed.
  }
}

// Export module.
module.exports = orders;
