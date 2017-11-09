'use strict';

const util = require('util');
const bluebird = require('bluebird');

/**
 * retry w/exponential back-off
 * 
 * @param {any} methodOrPromise 
 * @param {number} [max_attempts=1] 
 * @returns {bluebird}
 */
function retry(methodOrPromise, max_attempts = 1) {
  const errors = [];

  function check(attempt) {
    var zero_based_attempt = attempt - 1;
    var delay = zero_based_attempt * zero_based_attempt * 1000;
  
    if (attempt > max_attempts) 
      return bluebird.reject(Object.freeze(new RetryAttemptsExceeded(max_attempts, errors)));

    var isPromise = bluebird.is(methodOrPromise);
    var isFunction = !isPromise && (methodOrPromise instanceof Function) && methodOrPromise.length === 0;

    if (!(isPromise || isFunction)) 
      return bluebird.reject(new TypeError("methodOrPromise must be a Bluebird promise or parameterless javascript Function"));

    return bluebird.resolve(isFunction ? bluebird.try(methodOrPromise) : methodOrPromise)
      .catch((err) => {
        errors.push((err instanceof Error) ? err : new Error(err));
        return bluebird.delay(delay).then(() => check(attempt + 1));
      });
  }

  return check(1);
}
/**
 * 
 * 
 * @param {Error[]} errors 
 */

function RetryAttemptsExceeded(max_attempts, errors) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = util.format("Exceeded %d retry attempts", max_attempts);
  this.attempts = max_attempts;
  this.nested = errors;
}
util.inherits(RetryAttemptsExceeded, Error);

module.exports = {
  retry: retry,
  Types: {
    RetryAttemptsExceeded: RetryAttemptsExceeded
  }
}



