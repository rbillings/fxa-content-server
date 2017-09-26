/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const p = (value) => Promise.resolve(value);

  p.delay = (delayMS) => {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, delayMS);
    });
  };

  p.denodeify = function (callback) {
    return function (...args) {
      return new Promise((resolve, reject) => {
        callback(...args, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      });
    };
  };

  class Deferred {
    constructor () {
      this.promise = new Promise((resolve, reject) => {
        this._resolve = resolve;
        this._reject = reject;
      });

      this.resolve = (value) => {
        return this._resolve(value);
      };

      this.reject = (err) => {
        return this._reject(err);
      };
    }
  }

  p.defer = () => new Deferred();

  module.exports = p;
});


