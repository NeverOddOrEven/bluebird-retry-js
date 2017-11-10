'use strict;'

const bluebird = require('bluebird');
const bluebirdretryjs = require('./bluebird.retry');

var resolves_ok = bluebird.resolve('resolved');
var resolves_rejected = bluebird.reject('rejected');

var fn_ok = () => { return "success" };
var fn_throws = () => { throw new Error("rejected"); };

const RetryAttemptsExceeded = bluebirdretryjs.exceptions.RetryAttemptsExceeded;

bluebirdretryjs.retry(resolves_ok)
  .then((result) => console.log(result))
  .catch(RetryAttemptsExceeded, (err) => {
    console.error(err.message);
  });

bluebirdretryjs.retry(fn_ok)
  .then((result) => console.log(result))
  .catch(RetryAttemptsExceeded, (err) => {
    console.error(err.message);
  });

bluebirdretryjs.retry(resolves_rejected)
  .then((result) => console.log(result))
  .catch(RetryAttemptsExceeded, (err) => {
    console.error("Default: " + err.message);
  });

bluebirdretryjs.retry(resolves_rejected, 4, bluebirdretryjs.backoff.constant(1))
  .then((result) => console.log(result))
  .catch(RetryAttemptsExceeded, (err) => {
    console.error("Constant: " + err.message);
  });

bluebirdretryjs.retry(resolves_rejected, 4, bluebirdretryjs.backoff.linear(1))
  .then((result) => console.log(result))
  .catch(RetryAttemptsExceeded, (err) => {
    console.error("Linear: " + err.message);
  });

bluebirdretryjs.retry(resolves_rejected, 4, bluebirdretryjs.backoff.quadratic(1))
  .then((result) => console.log(result))
  .catch(RetryAttemptsExceeded, (err) => {
    console.error("Quadratic: " + err.message);
  });

bluebirdretryjs.retry(resolves_rejected, 4, bluebirdretryjs.backoff.exponential(1))
  .then((result) => console.log(result))
  .catch(RetryAttemptsExceeded, (err) => {
    console.error("Exponential: " + err.message);
  });

bluebirdretryjs.retry(fn_throws)
  .then((result) => console.log(result))
  .catch(RetryAttemptsExceeded, (err) => {
    console.error("Default: " + err.message);
  });

bluebirdretryjs.retry(fn_throws, 4, bluebirdretryjs.backoff.constant(1))
  .then((result) => console.log(result))
  .catch(RetryAttemptsExceeded, (err) => {
    console.error("Constant: " + err.message);
  });

bluebirdretryjs.retry(fn_throws, 4, bluebirdretryjs.backoff.linear(1))
  .then((result) => console.log(result))
  .catch(RetryAttemptsExceeded, (err) => {
    console.error("Linear: " + err.message);
  });

bluebirdretryjs.retry(fn_throws, 4, bluebirdretryjs.backoff.quadratic(1))
  .then((result) => console.log(result))
  .catch(RetryAttemptsExceeded, (err) => {
    console.error("Quadratic: " + err.message);
  });

bluebirdretryjs.retry(fn_throws, 4, bluebirdretryjs.backoff.exponential(1))
  .then((result) => console.log(result))
  .catch(RetryAttemptsExceeded, (err) => {
    console.error("Exponential: " + err.message);
  });
