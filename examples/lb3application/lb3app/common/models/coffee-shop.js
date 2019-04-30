'use strict';

const debug = require('debug')('loopback:example:lb3application');

module.exports = function(CoffeeShop) {
  CoffeeShop.status = function(cb) {
    var currentDate = new Date();
    var currentHour = currentDate.getHours();
    var OPEN_HOUR = 6;
    var CLOSE_HOUR = 20;
    debug('Current hour is %d', currentHour);
    var response;
    if (currentHour > OPEN_HOUR && currentHour < CLOSE_HOUR) {
      response = 'We are open for business.';
    } else {
      response = 'Sorry, we are closed. Open daily from 6am to 8pm.';
    }
    cb(null, response);
  };
  CoffeeShop.remoteMethod('status', {
    http: {
      path: '/status',
      verb: 'get',
    },
    returns: {
      arg: 'status',
      type: 'string',
    },
  });
  CoffeeShop.greet = function(cb) {
    process.nextTick(function() {
      cb(null, 'Hello from this Coffee Shop');
    });
  };
  CoffeeShop.remoteMethod('greet', {
    http: {path: '/greet', verb: 'get'},
    returns: {type: 'string'},
  });
};
