'use strict';

const util = require('util');
const bluebird = require('bluebird');

function constant(delayInSeconds = 1) {
  if (this instanceof constant) {
    this.maxDelayInSeconds = delayInSeconds;
    this.delayInSeconds = delayInSeconds;
    this.get_delay_ms = function(retry_attempt) {
      return this.delayInSeconds * 1000;
    }
  } else {
    return new constant(delayInSeconds);
  }
}

function linear(delayInSeconds = 1, maxDelayInSeconds = 60) {
  if (this instanceof linear) {
    this.delayInSeconds = delayInSeconds;
    this.maxDelayInSeconds = maxDelayInSeconds;
    this.get_delay_ms = function(retry_attempt) {
      return Math.min(this.delayInSeconds * retry_attempt, maxDelayInSeconds) * 1000;
    }
  } else {
    return new linear(delayInSeconds, maxDelayInSeconds);
  }
}

function quadratic(delayInSeconds = 1, maxDelayInSeconds = 60) {
  if (this instanceof quadratic) {
    this.delayInSeconds = delayInSeconds;
    this.maxDelayInSeconds = maxDelayInSeconds;
    this.get_delay_ms = function(retry_attempt) {
      return retry_attempt != 0 ? Math.min(Math.pow(retry_attempt, 2) * this.delayInSeconds, this.maxDelayInSeconds) * 1000 : 0;
    }
  } else {
    return new quadratic(delayInSeconds, maxDelayInSeconds);
  }
}

function exponential(delayInSeconds = 1, maxDelayInSeconds = 60) {
  if (this instanceof exponential) {
    this.delayInSeconds = delayInSeconds;
    this.maxDelayInSeconds = maxDelayInSeconds;
    this.get_delay_ms = function(retry_attempt) {
      return retry_attempt != 0 ? Math.min(Math.pow(retry_attempt, retry_attempt) * this.delayInSeconds, this.maxDelayInSeconds) * 1000 : 0;
    }
  } else {
    return new exponential(delayInSeconds, maxDelayInSeconds);
  }
}

/**
 * basic retry with scalable backoff and max attempts
 * 
 * @param {any} methodOrPromise 
 * @param {number} [maxRetryAttempts=1]
 * @param {Object} [backoff=constant]
 * @returns {bluebird}
 */
function retry(methodOrPromise, maxRetryAttempts = 1, backoff = constant()) {
  const errors = [];

  const start_time = Date.now();

  function check(attempt) {
    var zero_based_attempt = attempt - 1;

    var delay = backoff.get_delay_ms(zero_based_attempt);
  
    if (zero_based_attempt != 0 && attempt > maxRetryAttempts) 
      return bluebird.reject(Object.freeze(new RetryAttemptsExceeded(maxRetryAttempts, errors, start_time, Date.now())));

    var isPromise = bluebird.is(methodOrPromise);
    var isFunction = !isPromise && (methodOrPromise instanceof Function) && methodOrPromise.length === 0;

    if (!(isPromise || isFunction)) 
      return bluebird.reject(new TypeError("methodOrPromise must be a Bluebird promise or parameterless javascript Function"));

    return bluebird.resolve(isFunction ? bluebird.try(methodOrPromise) : methodOrPromise)
      .catch((err) => {
        errors.push((err instanceof Error) ? err : new Error(err));
        return bluebird.delay(delay).then(() => check(attempt + 1));
      })
  }

  return check(1);
}

/**
 * basic retry with scalable backoff and predicate that receives the attempt # via parameter, fail if predicate evaluates to true
 * 
 * @param {any} methodOrPromise 
 * @param {Function} [predicate]
 * @param {Object} [backoff=constant]
 * @returns {bluebird}
 */
function predicatedRetry(methodOrPromise, predicate = (retryAttemptIndex) => retryAttemptIndex >= 1, backoff = constant()) {
  const errors = [];

  const start_time = Date.now();

  function check(attempt) {
    var zero_based_attempt = attempt - 1;

    var delay = backoff.get_delay_ms(zero_based_attempt);
  
    if (zero_based_attempt != 0 && predicate(zero_based_attempt)) 
      return bluebird.reject(Object.freeze(new PredicateViolation(zero_based_attempt, errors, start_time, Date.now())));

    var isPromise = bluebird.is(methodOrPromise);
    var isFunction = !isPromise && (methodOrPromise instanceof Function) && methodOrPromise.length === 0;

    if (!(isPromise || isFunction)) 
      return bluebird.reject(new TypeError("methodOrPromise must be a Bluebird promise or parameterless javascript Function"));

    return bluebird.resolve(isFunction ? bluebird.try(methodOrPromise) : methodOrPromise)
      .catch((err) => {
        errors.push((err instanceof Error) ? err : new Error(err));
        return bluebird.delay(delay).then(() => check(attempt + 1));
      })
  }

  return check(1);
}

/**
 * 
 * 
 * @param {Error[]} errors 
 */

function RetryAttemptsExceeded(max_retry_attempts, errors, start_time, end_time) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.duration = end_time - start_time;
  this.attempts = max_retry_attempts;
  this.message = util.format("Exceeded %d retry attempts in %d milliseconds", this.attempts, this.duration);
  this.nested = errors;
}
util.inherits(RetryAttemptsExceeded, Error);

/**
 * 
 * 
 * @param {Error[]} errors 
 */

function PredicateViolation(attempt, errors, start_time, end_time) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.duration = end_time - start_time;
  this.attempts = attempt;
  this.message = util.format("Predicate failed after %d attempt(s) in %d milliseconds", this.attempts, this.duration);
  this.nested = errors;
}
util.inherits(PredicateViolation, Error);

module.exports = {
  retry: retry,
  predicatedRetry: predicatedRetry,
  backoff: { constant, linear, quadratic, exponential },
  exceptions: {
    RetryAttemptsExceeded: RetryAttemptsExceeded,
    PredicateViolation: PredicateViolation
  }
}



