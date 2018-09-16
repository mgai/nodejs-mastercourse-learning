/**
 * Handler for Front-end.
 */
'use strict';

// Dependencies.
const debug = require('util').debuglog('handlers');

const helpers = require('./helpers');

// Container.
const handlers = {};

/**
 *  // Front-end routers.
    '': handlers.index,
    'favicon.ico': handlers.favicon,
    'public': handlers.public,
    // Sign Up page.
    'account/create': handlers.accountCreate,
    'account/edit': handlers.accountEdit,
    'account/deleted': handlers.accountDeleted,
    // Log on.
    'session/create': handlers.sessionCreate,
    // Log out.
    'session/delete': handlers.sessionDeleted,
    'cart': handlers.cartEdit,
    'order/checkout': handlers.orderCheckout,
    'order/edit': handlers.orderEdit,
 */

/**
 * Generic handler with templates.
 */
handlers.templateHandler = function(data, {templateName, templateData}, callback) {
  // Handles only GET.
  if (data.method === 'get') {
    helpers.getTemplate(templateName, templateData, function(err, str) {
      if(!err) {
        // Add the universal header and footer.
        helpers.addUniversalTemplates(str, templateData, function(err, str) {
          if(!err && str) {
            callback(200, str, 'html');
          } else {
            debug(helpers.ansiColorString.CYAN, 'Failed to add Universal Templates', err);
            callback(500, undefined, 'html');
          }
        })
      } else {
        debug(helpers.ansiColorString.CYAN, 'Failed to get Template', templateName);
        callback(500, undefined, 'html');
      }
    })
  } else {
    callback(405, undefined, 'html'); // 405 - Not allowed.
  }
}

/**
 * Favicon handler.
 * @param data the request object.
 * @param callback (code, data, type)
 */
handlers.favicon = function(data, callback) {
  if(data.method === 'get') {
      // Read in the favicon data.
      helpers.getStaticAsset('favicon.ico', function(err, data) {
          if(!err && data) {
              callback(200, data, 'favicon');
          } else {
              debug(helpers.ansiColorString.CYAN, 'failed to get favicon');
              callback(500);
          }
      })
  } else {
      callback(405);  // Reject any other HTTP methods.
  }
}

/**
 * Public static asset handler.
 * @param data the request object.
 * @param callback (code, data, type)
 */
handlers.public = function(data, callback) {
  if(data.method === 'get') {
      // Read in the data.
      let trimmedAssetName = data.trimmedPath.replace('public/', '').trim();
      if(trimmedAssetName.length > 0) {
          helpers.getStaticAsset(trimmedAssetName, function(err, data) {
              if(!err && data) {
                  // Determine the content type. (default to plain text).
                  let contentType = 'plain';
                  if(trimmedAssetName.indexOf('.css') > -1) {
                      contentType = 'css';
                  }
                  if(trimmedAssetName.indexOf('.png') > -1) {
                      contentType = 'png';
                  }
                  if(trimmedAssetName.indexOf('.jpg') > -1) {
                      contentType = 'jpg';
                  }
                  if(trimmedAssetName.indexOf('.ico') > -1) {
                      contentType = 'favicon';
                  }

                  callback(200, data, contentType);
              } else {
                  debug(err);
                  callback(404);  // Not found.
              }
          })
      } else {
          callback(404);
      }
  } else {
      callback(405);  // Reject any other HTTP methods.
  }
}

/**
 * Index handler.
 */
handlers.index = function(data, callback) {
  handlers.templateHandler(data, {
    templateName: 'index',
    templateData: {
      'head.title': 'This is the title',
      'head.description': 'We serve only the best pizza!',
      'body.class': 'index'
    }
  }, callback)
}

/**
 * Items handler.
 */
handlers.items = function(data, callback) {
  handlers.templateHandler(data, {
    templateName: 'itemsList',
    templateData: {
      'head.title': 'Yummy pizza',
      'head.description': 'Our pizza menu',
      'body.class': 'itemsList'
    }
  }, callback);
}

/**
 * Account Create handler.
 */
handlers.accountCreate = function(data, callback) {
  handlers.templateHandler(data, {
    templateName: 'accountCreate',
    templateData: {
      'head.title': 'Create an Account',
      'head.description': 'Start by signing up today!',
      'body.class': 'accountCreate'
    }
  }, callback)
}

/**
 * Session Create handler.
 */
handlers.sessionCreate = function(data, callback) {
  handlers.templateHandler(data, {
    templateName: 'sessionCreate',
    templateData: {
      'head.title': 'Log in',
      'head.description': 'Log in to order',
      'body.class': 'sessionCreate'
    }
  }, callback)
}

/**
 * Session Delete handler for log out action.
 */
handlers.sessionDeleted = function(data, callback) {
  handlers.templateHandler(data, {
    templateName: 'sessionDeleted',
    templateData: {
      'head.title': 'Logged out',
      'head.description': 'You have been logged out of your account',
      'body.class': 'sessionDeleted'
    }
  }, callback)
}

/**
 * Cart Edit handler.
 */
handlers.cartsEdit = function(data, callback) {
  handlers.templateHandler(data, {
    templateName: 'cartsEdit',
    templateData: {
      'head.title': 'Your current shopping cart',
      'body.class': 'cartsEdit'
    }
  }, callback)
}

// Export
module.exports = handlers;
