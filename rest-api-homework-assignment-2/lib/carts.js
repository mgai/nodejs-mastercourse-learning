/**
 * Shopping Carts handler.
 */
'use strict';

// Dependencies
const debug = require('util').debuglog('carts');
const helpers = require('./helpers');
const _data = require('./data');
const auth = require('./auth').auth;
const withUserId = require('./auth').withUserId;

// General container
const carts = {};

carts.get = (data, callback) => {
  auth(data,() => {
    const email = helpers.validate(data.queryStringObject.email, {type: 'string'});
    if(email) {
      const userId = helpers.md5(email);
      if(userId) {
        _data.read('carts', userId, (err, cart) => {
          if(!err && cart) {
            callback(200, cart);
          } else {
            callback(404);
          }
        })
      } else {
        callback(500, {'Error': 'Failed to compute user ID.'});
      }
    } else {
      callback(400, {'Error': 'Missing required field(s)', 'Extra': 'Expects email in queryStringObject'});
    }
  } ,callback);
};

/**
 * Carts Post handler.
 * If cart does not exist yet for the user, a new cart would be created.
 * Otherwise, the cart would be overwritten.
 * @todo To refine the cart and order logic.
 */
carts.post = (data, callback) => {
  auth(data, () => {
    withUserId(data, () => {
      _data.read('carts', data.payload.userId, (err, cart) => {
        if(err) {
          /**
           * For simplicity, I am skipping validation check for items, but assume -
           * 1. Shopping cart content is in data.payload.cart.
           * 2. It's a valid list of items as - [{id, qty},...]
           */
          const cart = helpers.validate(data.payload.cart, {type: 'array'});
          if(cart) {
            _data.create('carts', data.payload.userId, cart, err => {
              if(!err) {
                callback(200);
              } else {
                debug(helpers.ansiColorString.RED, err)
                callback(500, {'Error': 'Failed to save cart.'});
              }
            })
          } else {
            callback(400, {'Error': 'Missing require field(s).'});
          }
        } else {
          callback(400, {'Error': 'Cart already exist', cart});
        }
      });
    }, callback);
  }, callback);
}

carts.delete = (data, callback) => {
  auth(data, () => {
    withUserId(data, () => {
      _data.read('carts', data.payload.userId, (err, cart) => {
        if(!err && cart) {
          _data.delete('carts', data.payload.userId, (err) => {
            if(!err) {
              callback(200);
            } else {
              debug(helpers.ansiColorString.RED, err);
              callback(500, {'Error': 'Failed to delete cart.', 'Extra': err});
            }
          });
        } else {
          callback(404);
        }
      });
    }, callback);
  }, callback);
}

// Shopping Carts routing check.
carts.routing = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if(acceptableMethods.indexOf(data.method) > -1) {
      carts[data.method](data, callback);
  } else {
      callback(405); // HTTP 405 - Method not allowed.
  }
}


// Export module.
module.exports = carts;
