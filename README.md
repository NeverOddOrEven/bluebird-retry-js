# bluebird-retry-js

A retry method that accepts parameterless plain-old-javascript functions and bluebird promises. 

Accepts a maximum number of attempts, or a termination predicate.

You can scale the retry times with `constant`, `linear`, `quadratic`, and `exponential` backoff functions. If desired, you may cap the maximum delay between attempts for `linear`, `quadratic`, and `exponential` scaling.


## Installation
```
npm install --save bluebird-retry-js
```

## Usage
```
'use strict;'

const bluebird = require('bluebird');
const bluebirdretryjs = require('bluebird-retry-js');

var resolves_ok = bluebird.resolve('resolved');
var resolves_rejected = bluebird.reject('rejected');

var fn_ok = () => { return "success" };
var fn_throws = () => { throw new Error("rejected"); };

const RetryAttemptsExceeded = bluebirdretryjs.exceptions.RetryAttemptsExceeded;
const PredicateViolation = bluebirdretryjs.exceptions.PredicateViolation;

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

bluebirdretryjs.predicatedRetry(bluebird.resolve('predicate example success'), (retryAttemptIndex) => retryAttemptIndex >= 1)
  .then((result) => console.log(result))

bluebirdretryjs.predicatedRetry(bluebird.reject('predicate example rejection'), (retryAttemptIndex) => retryAttemptIndex >= 1)
  .then((result) => console.log(result))
  .catch(PredicateViolation, (err) => {
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

```
