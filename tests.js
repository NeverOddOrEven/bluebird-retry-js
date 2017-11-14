'use strict';

const bluebird = require('bluebird');
const assert = require('assert');
const util = require('util');
const blue_ext = require('./bluebird.retry');

const attempts = 3;
const calc_default_duration_sec = function(attempts, attempt = 0) {
  if (attempt <= 0)
    return calc_default_duration_sec(attempts, attempt + 1);
  else if (attempt == attempts)
    return 1;
  else
    return 1 + calc_default_duration_sec(attempts, attempt + 1);
}

const expected_duration_all_attempts_failed_ms = calc_default_duration_sec(attempts) * 1000;
const expected_duration_last_attempt_succeeds_ms = calc_default_duration_sec(attempts - 1) * 1000;

describe('retry() a function that throws an exception after the default number of attempts', () => { 
  it('should reject with RetryAttemptsExceeded error', () => {
    return blue_ext.retry(() => { throw new Error("foo")})
      .catch((err) => assert.equal(true, err instanceof blue_ext.exceptions.RetryAttemptsExceeded))
  });

  it('should reject after only 1 attempt', () => {
    return blue_ext.retry(() => { throw new Error("foo")})
      .catch((err) => {
        assert.equal(1, err.attempts);
        assert.equal(1, err.nested.length);
      });
  });
});

describe('retry() a function that throws an exception after the default number of attempts', () => { 
  it('should reject with PredicateViolation error', () => {
    return blue_ext.predicatedRetry(() => { throw new Error("foo")})
      .catch((err) => assert.equal(true, err instanceof blue_ext.exceptions.PredicateViolation))
  });

  it('should reject after only 1 attempt', () => {
    return blue_ext.predicatedRetry(() => { throw new Error("foo")})
      .catch((err) => {
        assert.equal(1, err.attempts);
        assert.equal(1, err.nested.length);
      });
  });
});

describe('retry() a function that ' + util.format('fails all %d attempts', attempts), () => {
  it(util.format('should reject after %d attempts and ~%d milliseconds', attempts, expected_duration_all_attempts_failed_ms), () => {
    var start_time = Date.now();
    return blue_ext.retry(() => { throw new Error("foo")}, attempts)
      .catch((err) => {
        assert.equal(attempts, err.attempts);
        assert.equal(attempts, err.nested.length);
      }).finally(() => {
        var duration = Date.now() - start_time;
        assert.equal(true, (duration > (expected_duration_all_attempts_failed_ms - 100) && duration < (expected_duration_all_attempts_failed_ms + 100)))
      });
  });
});

describe('retry() a function that', () => {
  describe(util.format('throws exceptions on the first %d attempts but resolves on attempt %d', attempts - 1, attempts), () => {
    it(util.format('should resolve in ~%d ms', expected_duration_last_attempt_succeeds_ms), () => {
      var start_time = Date.now();
      var attempt = 0;
      return blue_ext.retry(() => {
          attempt++;
          if (attempt < attempts) {
            throw new Error("foo");
          } else {
            return 'success'
          }
      }, attempts)
        .then((result) => assert.equal(result, 'success'))
        .finally(() => {
          var duration = Date.now() - start_time;
          assert.equal(true, (duration > (expected_duration_last_attempt_succeeds_ms - 100) && duration < (expected_duration_last_attempt_succeeds_ms + 100)))
        });
    });
  })

  describe(util.format('rejects promises on the first %d attempts but resolves on attempt %d', attempts - 1, attempts), () => {
    it(util.format('should resolve in ~%d ms', expected_duration_last_attempt_succeeds_ms), () => {
      var start_time = Date.now();

      var attempt = 0;
      var fn = () => {
        attempt++;
        var result = (attempt == attempts) ? bluebird.resolve('success') : bluebird.reject('fail');
        return result;
      };

      return blue_ext.retry(fn, attempts)
        .then((result) => assert.equal(result, 'success'))
        .finally(() => {
          var duration = Date.now() - start_time;
          assert.equal(true, (duration > (expected_duration_last_attempt_succeeds_ms - 100) && duration < (expected_duration_last_attempt_succeeds_ms + 100)))
        });
    });
  });
});

describe('retry() a promise that rejects after the default number of attempts', () => {
  it('should reject with RetryAttemptsExceeded error', () => {
    return blue_ext.retry(bluebird.reject('Foo'))
      .catch((err) => assert.equal(true, err instanceof blue_ext.exceptions.RetryAttemptsExceeded))
  });
  it('should reject after only 1 attempt', () => {
    return blue_ext.retry(bluebird.reject('Foo'))
      .catch((err) => {
        assert.equal(1, err.attempts);
        assert.equal(1, err.nested.length);
      });
  });
});

describe('retry() a promise that ' + util.format('fails all %d attempts', attempts), () => {
  it(util.format('should reject after %d attempts and ~%d milliseconds', attempts, expected_duration_all_attempts_failed_ms), () => {
    var start_time = Date.now();
    return blue_ext.retry(bluebird.reject('Foo'), attempts)
      .catch((err) => {
        assert.equal(attempts, err.attempts);
        assert.equal(attempts, err.nested.length);
      }).finally(() => {
        var duration = Date.now() - start_time;
        assert.equal(true, (duration > (expected_duration_all_attempts_failed_ms - 100) && duration < (expected_duration_all_attempts_failed_ms + 100)))
      });
  });
})

describe('retry() a promise that resolves', () => {
  it('should succeed', () => {
    return blue_ext.retry(bluebird.resolve('success'), attempts)
      .then((result) => assert.equal(result, 'success'))
  })
});

describe('predicatedRetry() a promise that resolves', () => {
  it('should succeed', () => {
    return blue_ext.predicatedRetry(bluebird.resolve('success'), (attempts) => attempts > 3)
      .then((result) => assert.equal(result, 'success'))
  })
});

describe('ensure the 1st attempt (0th try) always executes', () => {
  it('should succeed when the max retry attempts is 0', () => {
    return blue_ext.retry(bluebird.resolve('success'), 0)
      .then((result) => assert.equal(result, 'success'))
  })
});

describe('ensure the 1st attempt (0th try) always executes', () => {
  it('should succeed even though the predicate evaluates to true', () => {
    return blue_ext.predicatedRetry(bluebird.resolve('success'), () => true)
      .then((result) => assert.equal(result, 'success'))
  })
});

describe('retry() a parameterless function that returns a value', () => {
  it('should succeed', () => {
    return blue_ext.retry(() => 'success', attempts)
      .then((result) => assert.equal(result, 'success'))
  })
});

describe('predicatedRetry() a parameterless function that returns a value', () => {
  it('should succeed', () => {
    return blue_ext.predicatedRetry(() => 'success')
      .then((result) => assert.equal(result, 'success'))
  })
});

describe('retry() a parameterized function that returns a value', () => {
  it('should fail', () => {
    return blue_ext.retry((a) => 'fail', attempts)
      .then((result) => bluebird.reject("retry() resolved successfully, when it should have failed"))
      .catch((err) => {
        assert.equal(err.message.includes("parameterless javascript Function"), true)
      })
  })
});

describe('predicatedRetry() a failing promise that stops after 3 tries with a custom predicate', () => {
  it('should fail', () => {
    return blue_ext.predicatedRetry(bluebird.reject('fail'), (attempt) => { return attempt >= 3; })
      .then((result) => bluebird.reject("retry() resolved successfully, when it should have failed"))
      .catch((err) => {
        assert.equal(true, err instanceof blue_ext.exceptions.PredicateViolation)
      })
  })
});
