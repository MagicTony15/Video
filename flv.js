(function (f) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = f();
    } else if (typeof define === 'function' && define.amd) {
        define([], f);
    } else {
        var g;
        if (typeof window !== 'undefined') {
            g = window;
        } else if (typeof global !== 'undefined') {
            g = global;
        } else if (typeof self !== 'undefined') {
            g = self;
        } else {
            g = this;
        }
        g.flvjs = f();
    }
})(function () {
    var define, module, exports;
    return (function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == 'function' && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw ((f.code = 'MODULE_NOT_FOUND'), f);
                }
                var l = (n[o] = { exports: {} });
                t[o][0].call(
                    l.exports,
                    function (e) {
                        var n = t[o][1][e];
                        return s(n ? n : e);
                    },
                    l,
                    l.exports,
                    e,
                    t,
                    n,
                    r
                );
            }
            return n[o].exports;
        }
        var i = typeof require == 'function' && require;
        for (var o = 0; o < r.length; o++) s(r[o]);
        return s;
    })(
        {
            1: [
                function (_dereq_, module, exports) {
                    (function (process, global) {
                        /*!
                         * @overview es6-promise - a tiny implementation of Promises/A+.
                         * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
                         * @license   Licensed under MIT license
                         *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
                         * @version   4.0.5
                         */

                        (function (global, factory) {
                            typeof exports === 'object' && typeof module !== 'undefined'
                                ? (module.exports = factory())
                                : typeof define === 'function' && define.amd
                                ? define(factory)
                                : (global.ES6Promise = factory());
                        })(this, function () {
                            'use strict';

                            function objectOrFunction(x) {
                                return typeof x === 'function' || (typeof x === 'object' && x !== null);
                            }

                            function isFunction(x) {
                                return typeof x === 'function';
                            }

                            var _isArray = undefined;
                            if (!Array.isArray) {
                                _isArray = function (x) {
                                    return Object.prototype.toString.call(x) === '[object Array]';
                                };
                            } else {
                                _isArray = Array.isArray;
                            }

                            var isArray = _isArray;

                            var len = 0;
                            var vertxNext = undefined;
                            var customSchedulerFn = undefined;

                            var asap = function asap(callback, arg) {
                                queue[len] = callback;
                                queue[len + 1] = arg;
                                len += 2;
                                if (len === 2) {
                                    // If len is 2, that means that we need to schedule an async flush.
                                    // If additional callbacks are queued before the queue is flushed, they
                                    // will be processed by this flush that we are scheduling.
                                    if (customSchedulerFn) {
                                        customSchedulerFn(flush);
                                    } else {
                                        scheduleFlush();
                                    }
                                }
                            };

                            function setScheduler(scheduleFn) {
                                customSchedulerFn = scheduleFn;
                            }

                            function setAsap(asapFn) {
                                asap = asapFn;
                            }

                            var browserWindow = typeof window !== 'undefined' ? window : undefined;
                            var browserGlobal = browserWindow || {};
                            var BrowserMutationObserver =
                                browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
                            var isNode =
                                typeof self === 'undefined' &&
                                typeof process !== 'undefined' &&
                                {}.toString.call(process) === '[object process]';

                            // test for web worker but not in IE10
                            var isWorker =
                                typeof Uint8ClampedArray !== 'undefined' &&
                                typeof importScripts !== 'undefined' &&
                                typeof MessageChannel !== 'undefined';

                            // node
                            function useNextTick() {
                                // node version 0.10.x displays a deprecation warning when nextTick is used recursively
                                // see https://github.com/cujojs/when/issues/410 for details
                                return function () {
                                    return process.nextTick(flush);
                                };
                            }

                            // vertx
                            function useVertxTimer() {
                                if (typeof vertxNext !== 'undefined') {
                                    return function () {
                                        vertxNext(flush);
                                    };
                                }

                                return useSetTimeout();
                            }

                            function useMutationObserver() {
                                var iterations = 0;
                                var observer = new BrowserMutationObserver(flush);
                                var node = document.createTextNode('');
                                observer.observe(node, { characterData: true });

                                return function () {
                                    node.data = iterations = ++iterations % 2;
                                };
                            }

                            // web worker
                            function useMessageChannel() {
                                var channel = new MessageChannel();
                                channel.port1.onmessage = flush;
                                return function () {
                                    return channel.port2.postMessage(0);
                                };
                            }

                            function useSetTimeout() {
                                // Store setTimeout reference so es6-promise will be unaffected by
                                // other code modifying setTimeout (like sinon.useFakeTimers())
                                var globalSetTimeout = setTimeout;
                                return function () {
                                    return globalSetTimeout(flush, 1);
                                };
                            }

                            var queue = new Array(1000);
                            function flush() {
                                for (var i = 0; i < len; i += 2) {
                                    var callback = queue[i];
                                    var arg = queue[i + 1];

                                    callback(arg);

                                    queue[i] = undefined;
                                    queue[i + 1] = undefined;
                                }

                                len = 0;
                            }

                            function attemptVertx() {
                                try {
                                    var r = _dereq_;
                                    var vertx = r('vertx');
                                    vertxNext = vertx.runOnLoop || vertx.runOnContext;
                                    return useVertxTimer();
                                } catch (e) {
                                    return useSetTimeout();
                                }
                            }

                            var scheduleFlush = undefined;
                            // Decide what async method to use to triggering processing of queued callbacks:
                            if (isNode) {
                                scheduleFlush = useNextTick();
                            } else if (BrowserMutationObserver) {
                                scheduleFlush = useMutationObserver();
                            } else if (isWorker) {
                                scheduleFlush = useMessageChannel();
                            } else if (browserWindow === undefined && typeof _dereq_ === 'function') {
                                scheduleFlush = attemptVertx();
                            } else {
                                scheduleFlush = useSetTimeout();
                            }

                            function then(onFulfillment, onRejection) {
                                var _arguments = arguments;

                                var parent = this;

                                var child = new this.constructor(noop);

                                if (child[PROMISE_ID] === undefined) {
                                    makePromise(child);
                                }

                                var _state = parent._state;

                                if (_state) {
                                    (function () {
                                        var callback = _arguments[_state - 1];
                                        asap(function () {
                                            return invokeCallback(_state, child, callback, parent._result);
                                        });
                                    })();
                                } else {
                                    subscribe(parent, child, onFulfillment, onRejection);
                                }

                                return child;
                            }

                            /**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
                            function resolve(object) {
                                /*jshint validthis:true */
                                var Constructor = this;

                                if (object && typeof object === 'object' && object.constructor === Constructor) {
                                    return object;
                                }

                                var promise = new Constructor(noop);
                                _resolve(promise, object);
                                return promise;
                            }

                            var PROMISE_ID = Math.random().toString(36).substring(16);

                            function noop() {}

                            var PENDING = void 0;
                            var FULFILLED = 1;
                            var REJECTED = 2;

                            var GET_THEN_ERROR = new ErrorObject();

                            function selfFulfillment() {
                                return new TypeError('You cannot resolve a promise with itself');
                            }

                            function cannotReturnOwn() {
                                return new TypeError('A promises callback cannot return that same promise.');
                            }

                            function getThen(promise) {
                                try {
                                    return promise.then;
                                } catch (error) {
                                    GET_THEN_ERROR.error = error;
                                    return GET_THEN_ERROR;
                                }
                            }

                            function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
                                try {
                                    then.call(value, fulfillmentHandler, rejectionHandler);
                                } catch (e) {
                                    return e;
                                }
                            }

                            function handleForeignThenable(promise, thenable, then) {
                                asap(function (promise) {
                                    var sealed = false;
                                    var error = tryThen(
                                        then,
                                        thenable,
                                        function (value) {
                                            if (sealed) {
                                                return;
                                            }
                                            sealed = true;
                                            if (thenable !== value) {
                                                _resolve(promise, value);
                                            } else {
                                                fulfill(promise, value);
                                            }
                                        },
                                        function (reason) {
                                            if (sealed) {
                                                return;
                                            }
                                            sealed = true;

                                            _reject(promise, reason);
                                        },
                                        'Settle: ' + (promise._label || ' unknown promise')
                                    );

                                    if (!sealed && error) {
                                        sealed = true;
                                        _reject(promise, error);
                                    }
                                }, promise);
                            }

                            function handleOwnThenable(promise, thenable) {
                                if (thenable._state === FULFILLED) {
                                    fulfill(promise, thenable._result);
                                } else if (thenable._state === REJECTED) {
                                    _reject(promise, thenable._result);
                                } else {
                                    subscribe(
                                        thenable,
                                        undefined,
                                        function (value) {
                                            return _resolve(promise, value);
                                        },
                                        function (reason) {
                                            return _reject(promise, reason);
                                        }
                                    );
                                }
                            }

                            function handleMaybeThenable(promise, maybeThenable, then$$) {
                                if (
                                    maybeThenable.constructor === promise.constructor &&
                                    then$$ === then &&
                                    maybeThenable.constructor.resolve === resolve
                                ) {
                                    handleOwnThenable(promise, maybeThenable);
                                } else {
                                    if (then$$ === GET_THEN_ERROR) {
                                        _reject(promise, GET_THEN_ERROR.error);
                                    } else if (then$$ === undefined) {
                                        fulfill(promise, maybeThenable);
                                    } else if (isFunction(then$$)) {
                                        handleForeignThenable(promise, maybeThenable, then$$);
                                    } else {
                                        fulfill(promise, maybeThenable);
                                    }
                                }
                            }

                            function _resolve(promise, value) {
                                if (promise === value) {
                                    _reject(promise, selfFulfillment());
                                } else if (objectOrFunction(value)) {
                                    handleMaybeThenable(promise, value, getThen(value));
                                } else {
                                    fulfill(promise, value);
                                }
                            }

                            function publishRejection(promise) {
                                if (promise._onerror) {
                                    promise._onerror(promise._result);
                                }

                                publish(promise);
                            }

                            function fulfill(promise, value) {
                                if (promise._state !== PENDING) {
                                    return;
                                }

                                promise._result = value;
                                promise._state = FULFILLED;

                                if (promise._subscribers.length !== 0) {
                                    asap(publish, promise);
                                }
                            }

                            function _reject(promise, reason) {
                                if (promise._state !== PENDING) {
                                    return;
                                }
                                promise._state = REJECTED;
                                promise._result = reason;

                                asap(publishRejection, promise);
                            }

                            function subscribe(parent, child, onFulfillment, onRejection) {
                                var _subscribers = parent._subscribers;
                                var length = _subscribers.length;

                                parent._onerror = null;

                                _subscribers[length] = child;
                                _subscribers[length + FULFILLED] = onFulfillment;
                                _subscribers[length + REJECTED] = onRejection;

                                if (length === 0 && parent._state) {
                                    asap(publish, parent);
                                }
                            }

                            function publish(promise) {
                                var subscribers = promise._subscribers;
                                var settled = promise._state;

                                if (subscribers.length === 0) {
                                    return;
                                }

                                var child = undefined,
                                    callback = undefined,
                                    detail = promise._result;

                                for (var i = 0; i < subscribers.length; i += 3) {
                                    child = subscribers[i];
                                    callback = subscribers[i + settled];

                                    if (child) {
                                        invokeCallback(settled, child, callback, detail);
                                    } else {
                                        callback(detail);
                                    }
                                }

                                promise._subscribers.length = 0;
                            }

                            function ErrorObject() {
                                this.error = null;
                            }

                            var TRY_CATCH_ERROR = new ErrorObject();

                            function tryCatch(callback, detail) {
                                try {
                                    return callback(detail);
                                } catch (e) {
                                    TRY_CATCH_ERROR.error = e;
                                    return TRY_CATCH_ERROR;
                                }
                            }

                            function invokeCallback(settled, promise, callback, detail) {
                                var hasCallback = isFunction(callback),
                                    value = undefined,
                                    error = undefined,
                                    succeeded = undefined,
                                    failed = undefined;

                                if (hasCallback) {
                                    value = tryCatch(callback, detail);

                                    if (value === TRY_CATCH_ERROR) {
                                        failed = true;
                                        error = value.error;
                                        value = null;
                                    } else {
                                        succeeded = true;
                                    }

                                    if (promise === value) {
                                        _reject(promise, cannotReturnOwn());
                                        return;
                                    }
                                } else {
                                    value = detail;
                                    succeeded = true;
                                }

                                if (promise._state !== PENDING) {
                                    // noop
                                } else if (hasCallback && succeeded) {
                                    _resolve(promise, value);
                                } else if (failed) {
                                    _reject(promise, error);
                                } else if (settled === FULFILLED) {
                                    fulfill(promise, value);
                                } else if (settled === REJECTED) {
                                    _reject(promise, value);
                                }
                            }

                            function initializePromise(promise, resolver) {
                                try {
                                    resolver(
                                        function resolvePromise(value) {
                                            _resolve(promise, value);
                                        },
                                        function rejectPromise(reason) {
                                            _reject(promise, reason);
                                        }
                                    );
                                } catch (e) {
                                    _reject(promise, e);
                                }
                            }

                            var id = 0;
                            function nextId() {
                                return id++;
                            }

                            function makePromise(promise) {
                                promise[PROMISE_ID] = id++;
                                promise._state = undefined;
                                promise._result = undefined;
                                promise._subscribers = [];
                            }

                            function Enumerator(Constructor, input) {
                                this._instanceConstructor = Constructor;
                                this.promise = new Constructor(noop);

                                if (!this.promise[PROMISE_ID]) {
                                    makePromise(this.promise);
                                }

                                if (isArray(input)) {
                                    this._input = input;
                                    this.length = input.length;
                                    this._remaining = input.length;

                                    this._result = new Array(this.length);

                                    if (this.length === 0) {
                                        fulfill(this.promise, this._result);
                                    } else {
                                        this.length = this.length || 0;
                                        this._enumerate();
                                        if (this._remaining === 0) {
                                            fulfill(this.promise, this._result);
                                        }
                                    }
                                } else {
                                    _reject(this.promise, validationError());
                                }
                            }

                            function validationError() {
                                return new Error('Array Methods must be provided an Array');
                            }

                            Enumerator.prototype._enumerate = function () {
                                var length = this.length;
                                var _input = this._input;

                                for (var i = 0; this._state === PENDING && i < length; i++) {
                                    this._eachEntry(_input[i], i);
                                }
                            };

                            Enumerator.prototype._eachEntry = function (entry, i) {
                                var c = this._instanceConstructor;
                                var resolve$$ = c.resolve;

                                if (resolve$$ === resolve) {
                                    var _then = getThen(entry);

                                    if (_then === then && entry._state !== PENDING) {
                                        this._settledAt(entry._state, i, entry._result);
                                    } else if (typeof _then !== 'function') {
                                        this._remaining--;
                                        this._result[i] = entry;
                                    } else if (c === Promise) {
                                        var promise = new c(noop);
                                        handleMaybeThenable(promise, entry, _then);
                                        this._willSettleAt(promise, i);
                                    } else {
                                        this._willSettleAt(
                                            new c(function (resolve$$) {
                                                return resolve$$(entry);
                                            }),
                                            i
                                        );
                                    }
                                } else {
                                    this._willSettleAt(resolve$$(entry), i);
                                }
                            };

                            Enumerator.prototype._settledAt = function (state, i, value) {
                                var promise = this.promise;

                                if (promise._state === PENDING) {
                                    this._remaining--;

                                    if (state === REJECTED) {
                                        _reject(promise, value);
                                    } else {
                                        this._result[i] = value;
                                    }
                                }

                                if (this._remaining === 0) {
                                    fulfill(promise, this._result);
                                }
                            };

                            Enumerator.prototype._willSettleAt = function (promise, i) {
                                var enumerator = this;

                                subscribe(
                                    promise,
                                    undefined,
                                    function (value) {
                                        return enumerator._settledAt(FULFILLED, i, value);
                                    },
                                    function (reason) {
                                        return enumerator._settledAt(REJECTED, i, reason);
                                    }
                                );
                            };

                            /**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = resolve(2);
  let promise3 = resolve(3);
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = reject(new Error("2"));
  let promise3 = reject(new Error("3"));
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
                            function all(entries) {
                                return new Enumerator(this, entries).promise;
                            }

                            /**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
                            function race(entries) {
                                /*jshint validthis:true */
                                var Constructor = this;

                                if (!isArray(entries)) {
                                    return new Constructor(function (_, reject) {
                                        return reject(new TypeError('You must pass an array to race.'));
                                    });
                                } else {
                                    return new Constructor(function (resolve, reject) {
                                        var length = entries.length;
                                        for (var i = 0; i < length; i++) {
                                            Constructor.resolve(entries[i]).then(resolve, reject);
                                        }
                                    });
                                }
                            }

                            /**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
                            function reject(reason) {
                                /*jshint validthis:true */
                                var Constructor = this;
                                var promise = new Constructor(noop);
                                _reject(promise, reason);
                                return promise;
                            }

                            function needsResolver() {
                                throw new TypeError(
                                    'You must pass a resolver function as the first argument to the promise constructor'
                                );
                            }

                            function needsNew() {
                                throw new TypeError(
                                    "Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function."
                                );
                            }

                            /**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise's eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  let promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      let xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class Promise
  @param {function} resolver
  Useful for tooling.
  @constructor
*/
                            function Promise(resolver) {
                                this[PROMISE_ID] = nextId();
                                this._result = this._state = undefined;
                                this._subscribers = [];

                                if (noop !== resolver) {
                                    typeof resolver !== 'function' && needsResolver();
                                    this instanceof Promise ? initializePromise(this, resolver) : needsNew();
                                }
                            }

                            Promise.all = all;
                            Promise.race = race;
                            Promise.resolve = resolve;
                            Promise.reject = reject;
                            Promise._setScheduler = setScheduler;
                            Promise._setAsap = setAsap;
                            Promise._asap = asap;

                            Promise.prototype = {
                                constructor: Promise,

                                /**
    The primary way of interacting with a promise is through its `then` method,
    which registers callbacks to receive either a promise's eventual value or the
    reason why the promise cannot be fulfilled.
  
    ```js
    findUser().then(function(user){
      // user is available
    }, function(reason){
      // user is unavailable, and you are given the reason why
    });
    ```
  
    Chaining
    --------
  
    The return value of `then` is itself a promise.  This second, 'downstream'
    promise is resolved with the return value of the first promise's fulfillment
    or rejection handler, or rejected if the handler throws an exception.
  
    ```js
    findUser().then(function (user) {
      return user.name;
    }, function (reason) {
      return 'default name';
    }).then(function (userName) {
      // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
      // will be `'default name'`
    });
  
    findUser().then(function (user) {
      throw new Error('Found user, but still unhappy');
    }, function (reason) {
      throw new Error('`findUser` rejected and we're unhappy');
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
      // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
    });
    ```
    If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
  
    ```js
    findUser().then(function (user) {
      throw new PedagogicalException('Upstream error');
    }).then(function (value) {
      // never reached
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // The `PedgagocialException` is propagated all the way down to here
    });
    ```
  
    Assimilation
    ------------
  
    Sometimes the value you want to propagate to a downstream promise can only be
    retrieved asynchronously. This can be achieved by returning a promise in the
    fulfillment or rejection handler. The downstream promise will then be pending
    until the returned promise is settled. This is called *assimilation*.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // The user's comments are now available
    });
    ```
  
    If the assimliated promise rejects, then the downstream promise will also reject.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // If `findCommentsByAuthor` fulfills, we'll have the value here
    }, function (reason) {
      // If `findCommentsByAuthor` rejects, we'll have the reason here
    });
    ```
  
    Simple Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let result;
  
    try {
      result = findResult();
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
    findResult(function(result, err){
      if (err) {
        // failure
      } else {
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findResult().then(function(result){
      // success
    }, function(reason){
      // failure
    });
    ```
  
    Advanced Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let author, books;
  
    try {
      author = findAuthor();
      books  = findBooksByAuthor(author);
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
  
    function foundBooks(books) {
  
    }
  
    function failure(reason) {
  
    }
  
    findAuthor(function(author, err){
      if (err) {
        failure(err);
        // failure
      } else {
        try {
          findBoooksByAuthor(author, function(books, err) {
            if (err) {
              failure(err);
            } else {
              try {
                foundBooks(books);
              } catch(reason) {
                failure(reason);
              }
            }
          });
        } catch(error) {
          failure(err);
        }
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findAuthor().
      then(findBooksByAuthor).
      then(function(books){
        // found books
    }).catch(function(reason){
      // something went wrong
    });
    ```
  
    @method then
    @param {Function} onFulfilled
    @param {Function} onRejected
    Useful for tooling.
    @return {Promise}
  */
                                then: then,

                                /**
    `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
    as the catch block of a try/catch statement.
  
    ```js
    function findAuthor(){
      throw new Error('couldn't find that author');
    }
  
    // synchronous
    try {
      findAuthor();
    } catch(reason) {
      // something went wrong
    }
  
    // async with promises
    findAuthor().catch(function(reason){
      // something went wrong
    });
    ```
  
    @method catch
    @param {Function} onRejection
    Useful for tooling.
    @return {Promise}
  */
                                catch: function _catch(onRejection) {
                                    return this.then(null, onRejection);
                                }
                            };

                            function polyfill() {
                                var local = undefined;

                                if (typeof global !== 'undefined') {
                                    local = global;
                                } else if (typeof self !== 'undefined') {
                                    local = self;
                                } else {
                                    try {
                                        local = Function('return this')();
                                    } catch (e) {
                                        throw new Error(
                                            'polyfill failed because global object is unavailable in this environment'
                                        );
                                    }
                                }

                                var P = local.Promise;

                                if (P) {
                                    var promiseToString = null;
                                    try {
                                        promiseToString = Object.prototype.toString.call(P.resolve());
                                    } catch (e) {
                                        // silently ignored
                                    }

                                    if (promiseToString === '[object Promise]' && !P.cast) {
                                        return;
                                    }
                                }

                                local.Promise = Promise;
                            }

                            // Strange compat..
                            Promise.polyfill = polyfill;
                            Promise.Promise = Promise;

                            return Promise;
                        });
                    }.call(
                        this,
                        _dereq_('_process'),
                        typeof global !== 'undefined'
                            ? global
                            : typeof self !== 'undefined'
                            ? self
                            : typeof window !== 'undefined'
                            ? window
                            : {}
                    ));
                },
                { _process: 3 }
            ],
            2: [
                function (_dereq_, module, exports) {
                    // Copyright Joyent, Inc. and other Node contributors.
                    //
                    // Permission is hereby granted, free of charge, to any person obtaining a
                    // copy of this software and associated documentation files (the
                    // "Software"), to deal in the Software without restriction, including
                    // without limitation the rights to use, copy, modify, merge, publish,
                    // distribute, sublicense, and/or sell copies of the Software, and to permit
                    // persons to whom the Software is furnished to do so, subject to the
                    // following conditions:
                    //
                    // The above copyright notice and this permission notice shall be included
                    // in all copies or substantial portions of the Software.
                    //
                    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
                    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
                    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
                    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
                    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
                    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
                    // USE OR OTHER DEALINGS IN THE SOFTWARE.

                    function EventEmitter() {
                        this._events = this._events || {};
                        this._maxListeners = this._maxListeners || undefined;
                    }
                    module.exports = EventEmitter;

                    // Backwards-compat with node 0.10.x
                    EventEmitter.EventEmitter = EventEmitter;

                    EventEmitter.prototype._events = undefined;
                    EventEmitter.prototype._maxListeners = undefined;

                    // By default EventEmitters will print a warning if more than 10 listeners are
                    // added to it. This is a useful default which helps finding memory leaks.
                    EventEmitter.defaultMaxListeners = 10;

                    // Obviously not all Emitters should be limited to 10. This function allows
                    // that to be increased. Set to zero for unlimited.
                    EventEmitter.prototype.setMaxListeners = function (n) {
                        if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError('n must be a positive number');
                        this._maxListeners = n;
                        return this;
                    };

                    EventEmitter.prototype.emit = function (type) {
                        var er, handler, len, args, i, listeners;

                        if (!this._events) this._events = {};

                        // If there is no 'error' event listener then throw.
                        if (type === 'error') {
                            if (!this._events.error || (isObject(this._events.error) && !this._events.error.length)) {
                                er = arguments[1];
                                if (er instanceof Error) {
                                    throw er; // Unhandled 'error' event
                                } else {
                                    // At least give some kind of context to the user
                                    var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
                                    err.context = er;
                                    throw err;
                                }
                            }
                        }

                        handler = this._events[type];

                        if (isUndefined(handler)) return false;

                        if (isFunction(handler)) {
                            switch (arguments.length) {
                                // fast cases
                                case 1:
                                    handler.call(this);
                                    break;
                                case 2:
                                    handler.call(this, arguments[1]);
                                    break;
                                case 3:
                                    handler.call(this, arguments[1], arguments[2]);
                                    break;
                                // slower
                                default:
                                    args = Array.prototype.slice.call(arguments, 1);
                                    handler.apply(this, args);
                            }
                        } else if (isObject(handler)) {
                            args = Array.prototype.slice.call(arguments, 1);
                            listeners = handler.slice();
                            len = listeners.length;
                            for (i = 0; i < len; i++) listeners[i].apply(this, args);
                        }

                        return true;
                    };

                    EventEmitter.prototype.addListener = function (type, listener) {
                        var m;

                        if (!isFunction(listener)) throw TypeError('listener must be a function');

                        if (!this._events) this._events = {};

                        // To avoid recursion in the case that type === "newListener"! Before
                        // adding it to the listeners, first emit "newListener".
                        if (this._events.newListener)
                            this.emit(
                                'newListener',
                                type,
                                isFunction(listener.listener) ? listener.listener : listener
                            );

                        if (!this._events[type])
                            // Optimize the case of one listener. Don't need the extra array object.
                            this._events[type] = listener;
                        else if (isObject(this._events[type]))
                            // If we've already got an array, just append.
                            this._events[type].push(listener);
                        // Adding the second element, need to change to array.
                        else this._events[type] = [this._events[type], listener];

                        // Check for listener leak
                        if (isObject(this._events[type]) && !this._events[type].warned) {
                            if (!isUndefined(this._maxListeners)) {
                                m = this._maxListeners;
                            } else {
                                m = EventEmitter.defaultMaxListeners;
                            }

                            if (m && m > 0 && this._events[type].length > m) {
                                this._events[type].warned = true;
                                console.error(
                                    '(node) warning: possible EventEmitter memory ' +
                                        'leak detected. %d listeners added. ' +
                                        'Use emitter.setMaxListeners() to increase limit.',
                                    this._events[type].length
                                );
                                if (typeof console.trace === 'function') {
                                    // not supported in IE 10
                                    console.trace();
                                }
                            }
                        }

                        return this;
                    };

                    EventEmitter.prototype.on = EventEmitter.prototype.addListener;

                    EventEmitter.prototype.once = function (type, listener) {
                        if (!isFunction(listener)) throw TypeError('listener must be a function');

                        var fired = false;

                        function g() {
                            this.removeListener(type, g);

                            if (!fired) {
                                fired = true;
                                listener.apply(this, arguments);
                            }
                        }

                        g.listener = listener;
                        this.on(type, g);

                        return this;
                    };

                    // emits a 'removeListener' event iff the listener was removed
                    EventEmitter.prototype.removeListener = function (type, listener) {
                        var list, position, length, i;

                        if (!isFunction(listener)) throw TypeError('listener must be a function');

                        if (!this._events || !this._events[type]) return this;

                        list = this._events[type];
                        length = list.length;
                        position = -1;

                        if (list === listener || (isFunction(list.listener) && list.listener === listener)) {
                            delete this._events[type];
                            if (this._events.removeListener) this.emit('removeListener', type, listener);
                        } else if (isObject(list)) {
                            for (i = length; i-- > 0; ) {
                                if (list[i] === listener || (list[i].listener && list[i].listener === listener)) {
                                    position = i;
                                    break;
                                }
                            }

                            if (position < 0) return this;

                            if (list.length === 1) {
                                list.length = 0;
                                delete this._events[type];
                            } else {
                                list.splice(position, 1);
                            }

                            if (this._events.removeListener) this.emit('removeListener', type, listener);
                        }

                        return this;
                    };

                    EventEmitter.prototype.removeAllListeners = function (type) {
                        var key, listeners;

                        if (!this._events) return this;

                        // not listening for removeListener, no need to emit
                        if (!this._events.removeListener) {
                            if (arguments.length === 0) this._events = {};
                            else if (this._events[type]) delete this._events[type];
                            return this;
                        }

                        // emit removeListener for all listeners on all events
                        if (arguments.length === 0) {
                            for (key in this._events) {
                                if (key === 'removeListener') continue;
                                this.removeAllListeners(key);
                            }
                            this.removeAllListeners('removeListener');
                            this._events = {};
                            return this;
                        }

                        listeners = this._events[type];

                        if (isFunction(listeners)) {
                            this.removeListener(type, listeners);
                        } else if (listeners) {
                            // LIFO order
                            while (listeners.length) this.removeListener(type, listeners[listeners.length - 1]);
                        }
                        delete this._events[type];

                        return this;
                    };

                    EventEmitter.prototype.listeners = function (type) {
                        var ret;
                        if (!this._events || !this._events[type]) ret = [];
                        else if (isFunction(this._events[type])) ret = [this._events[type]];
                        else ret = this._events[type].slice();
                        return ret;
                    };

                    EventEmitter.prototype.listenerCount = function (type) {
                        if (this._events) {
                            var evlistener = this._events[type];

                            if (isFunction(evlistener)) return 1;
                            else if (evlistener) return evlistener.length;
                        }
                        return 0;
                    };

                    EventEmitter.listenerCount = function (emitter, type) {
                        return emitter.listenerCount(type);
                    };

                    function isFunction(arg) {
                        return typeof arg === 'function';
                    }

                    function isNumber(arg) {
                        return typeof arg === 'number';
                    }

                    function isObject(arg) {
                        return typeof arg === 'object' && arg !== null;
                    }

                    function isUndefined(arg) {
                        return arg === void 0;
                    }
                },
                {}
            ],
            3: [
                function (_dereq_, module, exports) {
                    // shim for using process in browser
                    var process = (module.exports = {});

                    // cached from whatever global is present so that test runners that stub it
                    // don't break things.  But we need to wrap it in a try catch in case it is
                    // wrapped in strict mode code which doesn't define any globals.  It's inside a
                    // function because try/catches deoptimize in certain engines.

                    var cachedSetTimeout;
                    var cachedClearTimeout;

                    function defaultSetTimout() {
                        throw new Error('setTimeout has not been defined');
                    }
                    function defaultClearTimeout() {
                        throw new Error('clearTimeout has not been defined');
                    }
                    (function () {
                        try {
                            if (typeof setTimeout === 'function') {
                                cachedSetTimeout = setTimeout;
                            } else {
                                cachedSetTimeout = defaultSetTimout;
                            }
                        } catch (e) {
                            cachedSetTimeout = defaultSetTimout;
                        }
                        try {
                            if (typeof clearTimeout === 'function') {
                                cachedClearTimeout = clearTimeout;
                            } else {
                                cachedClearTimeout = defaultClearTimeout;
                            }
                        } catch (e) {
                            cachedClearTimeout = defaultClearTimeout;
                        }
                    })();
                    function runTimeout(fun) {
                        if (cachedSetTimeout === setTimeout) {
                            //normal enviroments in sane situations
                            return setTimeout(fun, 0);
                        }
                        // if setTimeout wasn't available but was latter defined
                        if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
                            cachedSetTimeout = setTimeout;
                            return setTimeout(fun, 0);
                        }
                        try {
                            // when when somebody has screwed with setTimeout but no I.E. maddness
                            return cachedSetTimeout(fun, 0);
                        } catch (e) {
                            try {
                                // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
                                return cachedSetTimeout.call(null, fun, 0);
                            } catch (e) {
                                // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
                                return cachedSetTimeout.call(this, fun, 0);
                            }
                        }
                    }
                    function runClearTimeout(marker) {
                        if (cachedClearTimeout === clearTimeout) {
                            //normal enviroments in sane situations
                            return clearTimeout(marker);
                        }
                        // if clearTimeout wasn't available but was latter defined
                        if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
                            cachedClearTimeout = clearTimeout;
                            return clearTimeout(marker);
                        }
                        try {
                            // when when somebody has screwed with setTimeout but no I.E. maddness
                            return cachedClearTimeout(marker);
                        } catch (e) {
                            try {
                                // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
                                return cachedClearTimeout.call(null, marker);
                            } catch (e) {
                                // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
                                // Some versions of I.E. have different rules for clearTimeout vs setTimeout
                                return cachedClearTimeout.call(this, marker);
                            }
                        }
                    }
                    var queue = [];
                    var draining = false;
                    var currentQueue;
                    var queueIndex = -1;

                    function cleanUpNextTick() {
                        if (!draining || !currentQueue) {
                            return;
                        }
                        draining = false;
                        if (currentQueue.length) {
                            queue = currentQueue.concat(queue);
                        } else {
                            queueIndex = -1;
                        }
                        if (queue.length) {
                            drainQueue();
                        }
                    }

                    function drainQueue() {
                        if (draining) {
                            return;
                        }
                        var timeout = runTimeout(cleanUpNextTick);
                        draining = true;

                        var len = queue.length;
                        while (len) {
                            currentQueue = queue;
                            queue = [];
                            while (++queueIndex < len) {
                                if (currentQueue) {
                                    currentQueue[queueIndex].run();
                                }
                            }
                            queueIndex = -1;
                            len = queue.length;
                        }
                        currentQueue = null;
                        draining = false;
                        runClearTimeout(timeout);
                    }

                    process.nextTick = function (fun) {
                        var args = new Array(arguments.length - 1);
                        if (arguments.length > 1) {
                            for (var i = 1; i < arguments.length; i++) {
                                args[i - 1] = arguments[i];
                            }
                        }
                        queue.push(new Item(fun, args));
                        if (queue.length === 1 && !draining) {
                            runTimeout(drainQueue);
                        }
                    };

                    // v8 likes predictible objects
                    function Item(fun, array) {
                        this.fun = fun;
                        this.array = array;
                    }
                    Item.prototype.run = function () {
                        this.fun.apply(null, this.array);
                    };
                    process.title = 'browser';
                    process.browser = true;
                    process.env = {};
                    process.argv = [];
                    process.version = ''; // empty string to avoid regexp issues
                    process.versions = {};

                    function noop() {}

                    process.on = noop;
                    process.addListener = noop;
                    process.once = noop;
                    process.off = noop;
                    process.removeListener = noop;
                    process.removeAllListeners = noop;
                    process.emit = noop;

                    process.binding = function (name) {
                        throw new Error('process.binding is not supported');
                    };

                    process.cwd = function () {
                        return '/';
                    };
                    process.chdir = function (dir) {
                        throw new Error('process.chdir is not supported');
                    };
                    process.umask = function () {
                        return 0;
                    };
                },
                {}
            ],
            4: [
                function (_dereq_, module, exports) {
                    var bundleFn = arguments[3];
                    var sources = arguments[4];
                    var cache = arguments[5];

                    var stringify = JSON.stringify;

                    module.exports = function (fn, options) {
                        var wkey;
                        var cacheKeys = Object.keys(cache);

                        for (var i = 0, l = cacheKeys.length; i < l; i++) {
                            var key = cacheKeys[i];
                            var exp = cache[key].exports;
                            // Using babel as a transpiler to use esmodule, the export will always
                            // be an object with the default export as a property of it. To ensure
                            // the existing api and babel esmodule exports are both supported we
                            // check for both
                            if (exp === fn || (exp && exp.default === fn)) {
                                wkey = key;
                                break;
                            }
                        }

                        if (!wkey) {
                            wkey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
                            var wcache = {};
                            for (var i = 0, l = cacheKeys.length; i < l; i++) {
                                var key = cacheKeys[i];
                                wcache[key] = key;
                            }
                            sources[wkey] = [Function(['require', 'module', 'exports'], '(' + fn + ')(self)'), wcache];
                        }
                        var skey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);

                        var scache = {};
                        scache[wkey] = wkey;
                        sources[skey] = [
                            Function(
                                ['require'],
                                // try to call default if defined to also support babel esmodule
                                // exports
                                'var f = require(' + stringify(wkey) + ');' + '(f.default ? f.default : f)(self);'
                            ),
                            scache
                        ];

                        var workerSources = {};
                        resolveSources(skey);

                        function resolveSources(key) {
                            workerSources[key] = true;

                            for (var depPath in sources[key][1]) {
                                var depKey = sources[key][1][depPath];
                                if (!workerSources[depKey]) {
                                    resolveSources(depKey);
                                }
                            }
                        }

                        var src =
                            '(' +
                            bundleFn +
                            ')({' +
                            Object.keys(workerSources)
                                .map(function (key) {
                                    return (
                                        stringify(key) + ':[' + sources[key][0] + ',' + stringify(sources[key][1]) + ']'
                                    );
                                })
                                .join(',') +
                            '},{},[' +
                            stringify(skey) +
                            '])';
                        var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

                        var blob = new Blob([src], { type: 'text/javascript' });
                        if (options && options.bare) {
                            return blob;
                        }
                        var workerUrl = URL.createObjectURL(blob);
                        var worker = new Worker(workerUrl);
                        worker.objectURL = workerUrl;
                        return worker;
                    };
                },
                {}
            ],
            5: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });
                    exports.createDefaultConfig = createDefaultConfig;
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var defaultConfig = (exports.defaultConfig = {
                        enableWorker: false,
                        enableStashBuffer: true,
                        stashInitialSize: undefined,

                        isLive: false,

                        lazyLoad: true,
                        lazyLoadMaxDuration: 3 * 60,
                        deferLoadAfterSourceOpen: true,

                        statisticsInfoReportInterval: 600,

                        accurateSeek: false,
                        seekType: 'range', // [range, param, custom]
                        seekParamStart: 'bstart',
                        seekParamEnd: 'bend',
                        rangeLoadZeroStart: false,
                        customSeekHandler: undefined
                    });

                    function createDefaultConfig() {
                        return Object.assign({}, defaultConfig);
                    }
                },
                {}
            ],
            6: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var _ioController = _dereq_('../io/io-controller.js');

                    var _ioController2 = _interopRequireDefault(_ioController);

                    var _config = _dereq_('../config.js');

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    var Features = (function () {
                        function Features() {
                            _classCallCheck(this, Features);
                        }

                        _createClass(Features, null, [
                            {
                                key: 'supportMSEH264Playback',
                                value: function supportMSEH264Playback() {
                                    return (
                                        window.MediaSource &&
                                        window.MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"')
                                    );
                                }
                            },
                            {
                                key: 'supportNetworkStreamIO',
                                value: function supportNetworkStreamIO() {
                                    var ioctl = new _ioController2.default({}, (0, _config.createDefaultConfig)());
                                    var loaderType = ioctl.loaderType;
                                    ioctl.destroy();
                                    return (
                                        loaderType == 'fetch-stream-loader' || loaderType == 'xhr-moz-chunked-loader'
                                    );
                                }
                            },
                            {
                                key: 'getNetworkLoaderTypeName',
                                value: function getNetworkLoaderTypeName() {
                                    var ioctl = new _ioController2.default({}, (0, _config.createDefaultConfig)());
                                    var loaderType = ioctl.loaderType;
                                    ioctl.destroy();
                                    return loaderType;
                                }
                            },
                            {
                                key: 'supportNativeMediaPlayback',
                                value: function supportNativeMediaPlayback(mimeType) {
                                    if (Features.videoElement == undefined) {
                                        Features.videoElement = window.document.createElement('video');
                                    }
                                    var canPlay = Features.videoElement.canPlayType(mimeType);
                                    return canPlay === 'probably' || canPlay == 'maybe';
                                }
                            },
                            {
                                key: 'getFeatureList',
                                value: function getFeatureList() {
                                    var features = {
                                        mseFlvPlayback: false,
                                        mseLiveFlvPlayback: false,
                                        networkStreamIO: false,
                                        networkLoaderName: '',
                                        nativeMP4H264Playback: false,
                                        nativeWebmVP8Playback: false,
                                        nativeWebmVP9Playback: false
                                    };

                                    features.mseFlvPlayback = Features.supportMSEH264Playback();
                                    features.networkStreamIO = Features.supportNetworkStreamIO();
                                    features.networkLoaderName = Features.getNetworkLoaderTypeName();
                                    features.mseLiveFlvPlayback = features.mseFlvPlayback && features.networkStreamIO;
                                    features.nativeMP4H264Playback = Features.supportNativeMediaPlayback(
                                        'video/mp4; codecs="avc1.42001E, mp4a.40.2"'
                                    );
                                    features.nativeWebmVP8Playback = Features.supportNativeMediaPlayback(
                                        'video/webm; codecs="vp8.0, vorbis"'
                                    );
                                    features.nativeWebmVP9Playback = Features.supportNativeMediaPlayback(
                                        'video/webm; codecs="vp9"'
                                    );

                                    return features;
                                }
                            }
                        ]);

                        return Features;
                    })();

                    exports.default = Features;
                },
                { '../config.js': 5, '../io/io-controller.js': 23 }
            ],
            7: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var MediaInfo = (function () {
                        function MediaInfo() {
                            _classCallCheck(this, MediaInfo);

                            this.mimeType = null;
                            this.duration = null;

                            this.hasAudio = null;
                            this.hasVideo = null;
                            this.audioCodec = null;
                            this.videoCodec = null;
                            this.audioDataRate = null;
                            this.videoDataRate = null;

                            this.audioSampleRate = null;
                            this.audioChannelCount = null;

                            this.width = null;
                            this.height = null;
                            this.fps = null;
                            this.profile = null;
                            this.level = null;
                            this.chromaFormat = null;
                            this.sarNum = null;
                            this.sarDen = null;

                            this.metadata = null;
                            this.segments = null; // MediaInfo[]
                            this.segmentCount = null;
                            this.hasKeyframesIndex = null;
                            this.keyframesIndex = null;
                        }

                        _createClass(MediaInfo, [
                            {
                                key: 'isComplete',
                                value: function isComplete() {
                                    var audioInfoComplete =
                                        this.hasAudio === false ||
                                        (this.hasAudio === true &&
                                            this.audioCodec != null &&
                                            this.audioSampleRate != null &&
                                            this.audioChannelCount != null);

                                    var videoInfoComplete =
                                        this.hasVideo === false ||
                                        (this.hasVideo === true &&
                                            this.videoCodec != null &&
                                            this.width != null &&
                                            this.height != null &&
                                            this.fps != null &&
                                            this.profile != null &&
                                            this.level != null &&
                                            this.chromaFormat != null &&
                                            this.sarNum != null &&
                                            this.sarDen != null);

                                    // keyframesIndex may not be present
                                    return (
                                        this.mimeType != null &&
                                        this.duration != null &&
                                        this.metadata != null &&
                                        this.hasKeyframesIndex != null &&
                                        audioInfoComplete &&
                                        videoInfoComplete
                                    );
                                }
                            },
                            {
                                key: 'isSeekable',
                                value: function isSeekable() {
                                    return this.hasKeyframesIndex === true;
                                }
                            },
                            {
                                key: 'getNearestKeyframe',
                                value: function getNearestKeyframe(milliseconds) {
                                    if (this.keyframesIndex == null) {
                                        return null;
                                    }

                                    var table = this.keyframesIndex;
                                    var keyframeIdx = this._search(table.times, milliseconds);

                                    return {
                                        index: keyframeIdx,
                                        milliseconds: table.times[keyframeIdx],
                                        fileposition: table.filepositions[keyframeIdx]
                                    };
                                }
                            },
                            {
                                key: '_search',
                                value: function _search(list, value) {
                                    var idx = 0;

                                    var last = list.length - 1;
                                    var mid = 0;
                                    var lbound = 0;
                                    var ubound = last;

                                    if (value < list[0]) {
                                        idx = 0;
                                        lbound = ubound + 1; // skip search
                                    }

                                    while (lbound <= ubound) {
                                        mid = lbound + Math.floor((ubound - lbound) / 2);
                                        if (mid === last || (value >= list[mid] && value < list[mid + 1])) {
                                            idx = mid;
                                            break;
                                        } else if (list[mid] < value) {
                                            lbound = mid + 1;
                                        } else {
                                            ubound = mid - 1;
                                        }
                                    }

                                    return idx;
                                }
                            }
                        ]);

                        return MediaInfo;
                    })();

                    exports.default = MediaInfo;
                },
                {}
            ],
            8: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    // Represents an media sample (audio / video)
                    var SampleInfo = (exports.SampleInfo = function SampleInfo(
                        dts,
                        pts,
                        duration,
                        originalDts,
                        isSync
                    ) {
                        _classCallCheck(this, SampleInfo);

                        this.dts = dts;
                        this.pts = pts;
                        this.duration = duration;
                        this.originalDts = originalDts;
                        this.isSyncPoint = isSync;
                        this.fileposition = null;
                    });

                    // Media Segment concept is defined in Media Source Extensions spec.
                    // Particularly in ISO BMFF format, an Media Segment contains a moof box followed by a mdat box.

                    var MediaSegmentInfo = (exports.MediaSegmentInfo = (function () {
                        function MediaSegmentInfo() {
                            _classCallCheck(this, MediaSegmentInfo);

                            this.beginDts = 0;
                            this.endDts = 0;
                            this.beginPts = 0;
                            this.endPts = 0;
                            this.originalBeginDts = 0;
                            this.originalEndDts = 0;
                            this.syncPoints = []; // SampleInfo[n], for video IDR frames only
                            this.firstSample = null; // SampleInfo
                            this.lastSample = null; // SampleInfo
                        }

                        _createClass(MediaSegmentInfo, [
                            {
                                key: 'appendSyncPoint',
                                value: function appendSyncPoint(sampleInfo) {
                                    // also called Random Access Point
                                    sampleInfo.isSyncPoint = true;
                                    this.syncPoints.push(sampleInfo);
                                }
                            }
                        ]);

                        return MediaSegmentInfo;
                    })());

                    // Ordered list for recording video IDR frames, sorted by originalDts

                    var IDRSampleList = (exports.IDRSampleList = (function () {
                        function IDRSampleList() {
                            _classCallCheck(this, IDRSampleList);

                            this._list = [];
                        }

                        _createClass(IDRSampleList, [
                            {
                                key: 'clear',
                                value: function clear() {
                                    this._list = [];
                                }
                            },
                            {
                                key: 'appendArray',
                                value: function appendArray(syncPoints) {
                                    var list = this._list;

                                    if (syncPoints.length === 0) {
                                        return;
                                    }

                                    if (
                                        list.length > 0 &&
                                        syncPoints[0].originalDts < list[list.length - 1].originalDts
                                    ) {
                                        this.clear();
                                    }

                                    Array.prototype.push.apply(list, syncPoints);
                                }
                            },
                            {
                                key: 'getLastSyncPointBeforeDts',
                                value: function getLastSyncPointBeforeDts(dts) {
                                    if (this._list.length == 0) {
                                        return null;
                                    }

                                    var list = this._list;
                                    var idx = 0;
                                    var last = list.length - 1;
                                    var mid = 0;
                                    var lbound = 0;
                                    var ubound = last;

                                    if (dts < list[0].dts) {
                                        idx = 0;
                                        lbound = ubound + 1;
                                    }

                                    while (lbound <= ubound) {
                                        mid = lbound + Math.floor((ubound - lbound) / 2);
                                        if (mid === last || (dts >= list[mid].dts && dts < list[mid + 1].dts)) {
                                            idx = mid;
                                            break;
                                        } else if (list[mid].dts < dts) {
                                            lbound = mid + 1;
                                        } else {
                                            ubound = mid - 1;
                                        }
                                    }
                                    return this._list[idx];
                                }
                            }
                        ]);

                        return IDRSampleList;
                    })());

                    // Data structure for recording information of media segments in single track.

                    var MediaSegmentInfoList = (exports.MediaSegmentInfoList = (function () {
                        function MediaSegmentInfoList(type) {
                            _classCallCheck(this, MediaSegmentInfoList);

                            this._type = type;
                            this._list = [];
                            this._lastAppendLocation = -1; // cached last insert location
                        }

                        _createClass(MediaSegmentInfoList, [
                            {
                                key: 'isEmpty',
                                value: function isEmpty() {
                                    return this._list.length === 0;
                                }
                            },
                            {
                                key: 'clear',
                                value: function clear() {
                                    this._list = [];
                                    this._lastAppendLocation = -1;
                                }
                            },
                            {
                                key: '_searchNearestSegmentBefore',
                                value: function _searchNearestSegmentBefore(originalBeginDts) {
                                    var list = this._list;
                                    if (list.length === 0) {
                                        return -2;
                                    }
                                    var last = list.length - 1;
                                    var mid = 0;
                                    var lbound = 0;
                                    var ubound = last;

                                    var idx = 0;

                                    if (originalBeginDts < list[0].originalBeginDts) {
                                        idx = -1;
                                        return idx;
                                    }

                                    while (lbound <= ubound) {
                                        mid = lbound + Math.floor((ubound - lbound) / 2);
                                        if (
                                            mid === last ||
                                            (originalBeginDts > list[mid].lastSample.originalDts &&
                                                originalBeginDts < list[mid + 1].originalBeginDts)
                                        ) {
                                            idx = mid;
                                            break;
                                        } else if (list[mid].originalBeginDts < originalBeginDts) {
                                            lbound = mid + 1;
                                        } else {
                                            ubound = mid - 1;
                                        }
                                    }
                                    return idx;
                                }
                            },
                            {
                                key: '_searchNearestSegmentAfter',
                                value: function _searchNearestSegmentAfter(originalBeginDts) {
                                    return this._searchNearestSegmentBefore(originalBeginDts) + 1;
                                }
                            },
                            {
                                key: 'append',
                                value: function append(mediaSegmentInfo) {
                                    var list = this._list;
                                    var msi = mediaSegmentInfo;
                                    var lastAppendIdx = this._lastAppendLocation;
                                    var insertIdx = 0;

                                    if (
                                        lastAppendIdx !== -1 &&
                                        lastAppendIdx < list.length &&
                                        msi.originalBeginDts >= list[lastAppendIdx].lastSample.originalDts &&
                                        (lastAppendIdx === list.length - 1 ||
                                            (lastAppendIdx < list.length - 1 &&
                                                msi.originalBeginDts < list[lastAppendIdx + 1].originalBeginDts))
                                    ) {
                                        insertIdx = lastAppendIdx + 1; // use cached location idx
                                    } else {
                                        if (list.length > 0) {
                                            insertIdx = this._searchNearestSegmentBefore(msi.originalBeginDts) + 1;
                                        }
                                    }

                                    this._lastAppendLocation = insertIdx;
                                    this._list.splice(insertIdx, 0, msi);
                                }
                            },
                            {
                                key: 'getLastSegmentBefore',
                                value: function getLastSegmentBefore(originalBeginDts) {
                                    var idx = this._searchNearestSegmentBefore(originalBeginDts);
                                    if (idx >= 0) {
                                        return this._list[idx];
                                    } else {
                                        // -1
                                        return null;
                                    }
                                }
                            },
                            {
                                key: 'getLastSampleBefore',
                                value: function getLastSampleBefore(originalBeginDts) {
                                    var segment = this.getLastSegmentBefore(originalBeginDts);
                                    if (segment != null) {
                                        return segment.lastSample;
                                    } else {
                                        return null;
                                    }
                                }
                            },
                            {
                                key: 'getLastSyncPointBefore',
                                value: function getLastSyncPointBefore(originalBeginDts) {
                                    var segmentIdx = this._searchNearestSegmentBefore(originalBeginDts);
                                    var syncPoints = this._list[segmentIdx].syncPoints;
                                    while (syncPoints.length === 0 && segmentIdx > 0) {
                                        segmentIdx--;
                                        syncPoints = this._list[segmentIdx].syncPoints;
                                    }
                                    if (syncPoints.length > 0) {
                                        return syncPoints[syncPoints.length - 1];
                                    } else {
                                        return null;
                                    }
                                }
                            },
                            {
                                key: 'type',
                                get: function get() {
                                    return this._type;
                                }
                            },
                            {
                                key: 'length',
                                get: function get() {
                                    return this._list.length;
                                }
                            }
                        ]);

                        return MediaSegmentInfoList;
                    })());
                },
                {}
            ],
            9: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var _events = _dereq_('events');

                    var _events2 = _interopRequireDefault(_events);

                    var _logger = _dereq_('../utils/logger.js');

                    var _logger2 = _interopRequireDefault(_logger);

                    var _browser = _dereq_('../utils/browser.js');

                    var _browser2 = _interopRequireDefault(_browser);

                    var _mseEvents = _dereq_('./mse-events.js');

                    var _mseEvents2 = _interopRequireDefault(_mseEvents);

                    var _mediaSegmentInfo = _dereq_('./media-segment-info.js');

                    var _exception = _dereq_('../utils/exception.js');

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    // Media Source Extensions controller
                    var MSEController = (function () {
                        function MSEController() {
                            _classCallCheck(this, MSEController);

                            this.TAG = 'MSEController';

                            this._emitter = new _events2.default();

                            this.e = {
                                onSourceOpen: this._onSourceOpen.bind(this),
                                onSourceEnded: this._onSourceEnded.bind(this),
                                onSourceClose: this._onSourceClose.bind(this),
                                onSourceBufferError: this._onSourceBufferError.bind(this),
                                onSourceBufferUpdateEnd: this._onSourceBufferUpdateEnd.bind(this)
                            };

                            this._mediaSource = null;
                            this._mediaSourceObjectURL = null;
                            this._mediaElement = null;

                            this._isBufferFull = false;
                            this._hasPendingEos = false;

                            this._pendingSourceBufferInit = [];
                            this._mimeTypes = {
                                video: null,
                                audio: null
                            };
                            this._sourceBuffers = {
                                video: null,
                                audio: null
                            };
                            this._lastInitSegments = {
                                video: null,
                                audio: null
                            };
                            this._pendingSegments = {
                                video: [],
                                audio: []
                            };
                            this._pendingRemoveRanges = {
                                video: [],
                                audio: []
                            };
                            this._idrList = new _mediaSegmentInfo.IDRSampleList();
                        }

                        _createClass(MSEController, [
                            {
                                key: 'destroy',
                                value: function destroy() {
                                    if (this._mediaElement || this._mediaSource) {
                                        this.detachMediaElement();
                                    }
                                    this.e = null;
                                    this._emitter.removeAllListeners();
                                    this._emitter = null;
                                }
                            },
                            {
                                key: 'on',
                                value: function on(event, listener) {
                                    this._emitter.addListener(event, listener);
                                }
                            },
                            {
                                key: 'off',
                                value: function off(event, listener) {
                                    this._emitter.removeListener(event, listener);
                                }
                            },
                            {
                                key: 'attachMediaElement',
                                value: function attachMediaElement(mediaElement) {
                                    if (this._mediaSource) {
                                        throw new _exception.IllegalStateException(
                                            'MediaSource has been attached to an HTMLMediaElement!'
                                        );
                                    }
                                    var ms = (this._mediaSource = new window.MediaSource());
                                    ms.addEventListener('sourceopen', this.e.onSourceOpen);
                                    ms.addEventListener('sourceended', this.e.onSourceEnded);
                                    ms.addEventListener('sourceclose', this.e.onSourceClose);

                                    this._mediaElement = mediaElement;
                                    this._mediaSourceObjectURL = window.URL.createObjectURL(this._mediaSource);
                                    mediaElement.src = this._mediaSourceObjectURL;
                                }
                            },
                            {
                                key: 'detachMediaElement',
                                value: function detachMediaElement() {
                                    if (this._mediaSource) {
                                        var ms = this._mediaSource;
                                        for (var type in this._sourceBuffers) {
                                            // pending segments should be discard
                                            var ps = this._pendingSegments[type];
                                            ps.splice(0, ps.length);
                                            this._pendingSegments[type] = null;
                                            this._pendingRemoveRanges[type] = null;
                                            this._lastInitSegments[type] = null;

                                            // remove all sourcebuffers
                                            var sb = this._sourceBuffers[type];
                                            if (sb) {
                                                if (ms.readyState !== 'closed') {
                                                    ms.removeSourceBuffer(sb);
                                                    sb.removeEventListener('error', this.e.onSourceBufferError);
                                                    sb.removeEventListener('updateend', this.e.onSourceBufferUpdateEnd);
                                                }
                                                this._mimeTypes[type] = null;
                                                this._sourceBuffers[type] = null;
                                            }
                                        }
                                        if (ms.readyState === 'open') {
                                            try {
                                                ms.endOfStream();
                                            } catch (error) {
                                                _logger2.default.e(this.TAG, error.message);
                                            }
                                        }
                                        ms.removeEventListener('sourceopen', this.e.onSourceOpen);
                                        ms.removeEventListener('sourceended', this.e.onSourceEnded);
                                        ms.removeEventListener('sourceclose', this.e.onSourceClose);
                                        this._pendingSourceBufferInit = [];
                                        this._isBufferFull = false;
                                        this._idrList.clear();
                                        this._mediaSource = null;
                                    }

                                    if (this._mediaElement) {
                                        this._mediaElement.src = '';
                                        this._mediaElement.removeAttribute('src');
                                        this._mediaElement = null;
                                    }
                                    if (this._mediaSourceObjectURL) {
                                        window.URL.revokeObjectURL(this._mediaSourceObjectURL);
                                        this._mediaSourceObjectURL = null;
                                    }
                                }
                            },
                            {
                                key: 'appendInitSegment',
                                value: function appendInitSegment(initSegment, deferred) {
                                    if (!this._mediaSource || this._mediaSource.readyState !== 'open') {
                                        // sourcebuffer creation requires mediaSource.readyState === 'open'
                                        // so we defer the sourcebuffer creation, until sourceopen event triggered
                                        this._pendingSourceBufferInit.push(initSegment);
                                        // make sure that this InitSegment is in the front of pending segments queue
                                        this._pendingSegments[initSegment.type].push(initSegment);
                                        return;
                                    }

                                    var is = initSegment;
                                    var mimeType = is.container + ';codecs=' + is.codec;
                                    var firstInitSegment = false;

                                    _logger2.default.v(
                                        this.TAG,
                                        'Received Initialization Segment, mimeType: ' + mimeType
                                    );
                                    this._lastInitSegments[is.type] = is;

                                    if (mimeType !== this._mimeTypes[is.type]) {
                                        if (!this._mimeTypes[is.type]) {
                                            // empty, first chance create sourcebuffer
                                            firstInitSegment = true;
                                            try {
                                                var sb = (this._sourceBuffers[
                                                    is.type
                                                ] = this._mediaSource.addSourceBuffer(mimeType));
                                                sb.addEventListener('error', this.e.onSourceBufferError);
                                                sb.addEventListener('updateend', this.e.onSourceBufferUpdateEnd);
                                            } catch (error) {
                                                _logger2.default.e(this.TAG, error.message);
                                                this._emitter.emit(_mseEvents2.default.ERROR, {
                                                    code: error.code,
                                                    msg: error.message
                                                });
                                                return;
                                            }
                                        } else {
                                            _logger2.default.v(
                                                this.TAG,
                                                'Notice: ' +
                                                    is.type +
                                                    ' mimeType changed, origin: ' +
                                                    this._mimeTypes[is.type] +
                                                    ', target: ' +
                                                    mimeType
                                            );
                                        }
                                        this._mimeTypes[is.type] = mimeType;
                                    }

                                    if (!deferred) {
                                        // deferred means this InitSegment has been pushed to pendingSegments queue
                                        this._pendingSegments[is.type].push(is);
                                    }
                                    if (!firstInitSegment) {
                                        // append immediately only if init segment in subsequence
                                        if (this._sourceBuffers[is.type] && !this._sourceBuffers[is.type].updating) {
                                            this._doAppendSegments();
                                        }
                                    }
                                }
                            },
                            {
                                key: 'appendMediaSegment',
                                value: function appendMediaSegment(mediaSegment) {
                                    var ms = mediaSegment;
                                    this._pendingSegments[ms.type].push(ms);

                                    var sb = this._sourceBuffers[ms.type];
                                    if (sb && !sb.updating && !this._hasPendingRemoveRanges()) {
                                        this._doAppendSegments();
                                    }
                                }
                            },
                            {
                                key: 'seek',
                                value: function seek(seconds) {
                                    // remove all appended buffers
                                    for (var type in this._sourceBuffers) {
                                        if (!this._sourceBuffers[type]) {
                                            continue;
                                        }

                                        // abort current buffer append algorithm
                                        var sb = this._sourceBuffers[type];
                                        if (this._mediaSource.readyState === 'open') {
                                            try {
                                                // If range removal algorithm is running, InvalidStateError will be throwed
                                                // Ignore it.
                                                sb.abort();
                                            } catch (error) {
                                                _logger2.default.e(this.TAG, error.message);
                                            }
                                        }

                                        // IDRList should be clear
                                        this._idrList.clear();

                                        // pending segments should be discard
                                        var ps = this._pendingSegments[type];
                                        ps.splice(0, ps.length);

                                        if (this._mediaSource.readyState === 'closed') {
                                            // Parent MediaSource object has been detached from HTMLMediaElement
                                            continue;
                                        }

                                        // record ranges to be remove from SourceBuffer
                                        for (var i = 0; i < sb.buffered.length; i++) {
                                            var start = sb.buffered.start(i);
                                            var end = sb.buffered.end(i);
                                            this._pendingRemoveRanges[type].push({ start: start, end: end });
                                        }

                                        // if sb is not updating, let's remove ranges now!
                                        if (!sb.updating) {
                                            this._doRemoveRanges();
                                        }

                                        // Safari 10 may get InvalidStateError in the later appendBuffer() after SourceBuffer.remove() call
                                        // Internal parser's state may be invalid at this time. Re-append last InitSegment to workaround.
                                        // Related issue: https://bugs.webkit.org/show_bug.cgi?id=159230
                                        if (_browser2.default.safari) {
                                            var lastInitSegment = this._lastInitSegments[type];
                                            if (lastInitSegment) {
                                                this._pendingSegments[type].push(lastInitSegment);
                                                if (!sb.updating) {
                                                    this._doAppendSegments();
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            {
                                key: 'endOfStream',
                                value: function endOfStream() {
                                    var ms = this._mediaSource;
                                    var sb = this._sourceBuffers;
                                    if (!ms || ms.readyState !== 'open') {
                                        if (ms && ms.readyState === 'closed' && this._hasPendingSegments()) {
                                            // If MediaSource hasn't turned into open state, and there're pending segments
                                            // Mark pending endOfStream, defer call until all pending segments appended complete
                                            this._hasPendingEos = true;
                                        }
                                        return;
                                    }
                                    if ((sb.video && sb.video.updating) || (sb.audio && sb.audio.updating)) {
                                        // If any sourcebuffer is updating, defer endOfStream operation
                                        // See _onSourceBufferUpdateEnd()
                                        this._hasPendingEos = true;
                                    } else {
                                        this._hasPendingEos = false;
                                        // Notify media data loading complete
                                        // This is helpful for correcting total duration to match last media segment
                                        // Otherwise MediaElement's ended event may not be triggered
                                        ms.endOfStream();
                                    }
                                }
                            },
                            {
                                key: 'getNearestKeyframe',
                                value: function getNearestKeyframe(dts) {
                                    return this._idrList.getLastSyncPointBeforeDts(dts);
                                }
                            },
                            //wy
                            {
                                key: 'update',
                                value: function update(islive) {
                                    //wy修复内存狂涨
                                    function logplaystate(t) {
                                        var that = t;
                                        var bs = ['video', 'audio'];
                                        for (var bi = 0; bi < bs.length; bi++) {
                                            var sb = that._sourceBuffers[bs[bi]];
                                            if (!sb) continue;
                                            var bufStart = 0;
                                            var bufEnd = 0;
                                            for (var i = 0; i < sb.buffered.length; i++) {
                                                bufStart = sb.buffered.start(i);
                                                bufEnd = sb.buffered.end(i);
                                                console.debug(bs[bi] + 'start:' + bufStart + 'end:' + bufEnd);
                                            }
                                        }
                                        console.debug('time:' + that._mediaElement.currentTime);
                                    }
                                    function clearBuffer(t) {
                                        var that = t;
                                        var bs = ['video', 'audio'];
                                        for (var bi = 0; bi < bs.length; bi++) {
                                            var sb = that._sourceBuffers[bs[bi]];
                                            if (!sb) continue;
                                            for (var i = 0; i < sb.buffered.length; i++) {
                                                var bufStart = sb.buffered.start(i);
                                                var bufEnd = sb.buffered.end(i);
                                                that._pendingRemoveRanges[bs[bi]].push({
                                                    start: bufStart,
                                                    end: bufEnd
                                                });
                                            }
                                        }
                                    }
                                    //logplaystate(this);
                                    if (islive) {
                                        var bs = ['video', 'audio'];
                                        var bufStart = 0;
                                        var bufEnd = 0;
                                        for (var bi = 0; bi < bs.length; bi++) {
                                            var sb = this._sourceBuffers[bs[bi]];
                                            if (!sb) continue;
                                            for (var i = 0; i < sb.buffered.length; i++) {
                                                if (bufStart == 0) bufStart = sb.buffered.start(i);
                                                else bufStart = Math.min(sb.buffered.start(i), bufStart);
                                                bufEnd = Math.max(sb.buffered.end(i), bufEnd);
                                            }
                                        }
                                        if (bufEnd - bufStart > 20) {
                                            //clearBuffer(this);
                                            for (var bi = 0; bi < bs.length; bi++) {
                                                var sb = this._sourceBuffers[bs[bi]];
                                                if (!sb) continue;
                                                var end = bufEnd - 10;
                                                this._pendingRemoveRanges[bs[bi]].push({
                                                    start: 0,
                                                    end: end
                                                });
                                                this._doRemoveRanges();
                                            }
                                        }
                                        //wy优化live延迟
                                        //if (t == 'video')
                                        {
                                            if (this._mediaElement.currentTime > bufEnd + 2) {
                                                this._mediaElement.currentTime = bufEnd - 0.2;
                                            }

                                            if (bufEnd - this._mediaElement.currentTime > 4) {
                                                this._mediaElement.currentTime = bufEnd - 0.5;
                                                //this._mediaElement.playbackRate = 2;
                                            }
                                            //内存空隙导致卡死
                                            if (bufEnd - this._mediaElement.currentTime > 10) {
                                                // this._mediaElement.currentTime = bufEnd;
                                            }
                                            if (this._mediaElement.playbackRate == 2) {
                                                if (bufEnd - this._mediaElement.currentTime < 1)
                                                    this._mediaElement.playbackRate = 1;
                                            }
                                        }
                                    }
                                }
                            },
                            //wy
                            {
                                key: 'log',
                                value: function log() {
                                    var that = this;
                                    var bs = ['video', 'audio'];
                                    var str;
                                    for (var bi = 0; bi < bs.length; bi++) {
                                        var sb = that._sourceBuffers[bs[bi]];
                                        if (!sb) continue;
                                        var bufStart = 0;
                                        var bufEnd = 0;
                                        for (var i = 0; i < sb.buffered.length; i++) {
                                            bufStart = sb.buffered.start(i);
                                            bufEnd = sb.buffered.end(i);
                                            var s = bs[bi] + 'start:' + bufStart + 'end:' + bufEnd;
                                            str = str + ' ' + s;
                                        }
                                    }
                                    _logger2.default.v(this.TAG, 'time:' + that._mediaElement.currentTime + ' ' + str);
                                }
                            },

                            {
                                key: '_doRemoveRanges',
                                value: function _doRemoveRanges() {
                                    for (var type in this._pendingRemoveRanges) {
                                        if (!this._sourceBuffers[type] || this._sourceBuffers[type].updating) {
                                            continue;
                                        }
                                        var sb = this._sourceBuffers[type];
                                        var ranges = this._pendingRemoveRanges[type];
                                        while (ranges.length && !sb.updating) {
                                            var range = ranges.shift();
                                            sb.remove(range.start, range.end);
                                        }
                                    }
                                }
                            },
                            {
                                key: '_doAppendSegments',
                                value: function _doAppendSegments() {
                                    var pendingSegments = this._pendingSegments;

                                    for (var type in pendingSegments) {
                                        if (!this._sourceBuffers[type] || this._sourceBuffers[type].updating) {
                                            continue;
                                        }
                                        if (pendingSegments[type].length > 0) {
                                            var segment = pendingSegments[type].shift();
                                            try {
                                                this._sourceBuffers[type].appendBuffer(segment.data);
                                                this._isBufferFull = false;
                                                if (type === 'video' && segment.hasOwnProperty('info')) {
                                                    this._idrList.appendArray(segment.info.syncPoints);
                                                }
                                            } catch (error) {
                                                this._pendingSegments[type].unshift(segment);
                                                if (error.code === 22) {
                                                    // QuotaExceededError
                                                    /* Notice that FireFox may not throw QuotaExceededError if SourceBuffer is full
                                                     * Currently we can only do lazy-load to avoid SourceBuffer become scattered.
                                                     * SourceBuffer eviction policy may be changed in future version of FireFox.
                                                     *
                                                     * Related issues:
                                                     * https://bugzilla.mozilla.org/show_bug.cgi?id=1279885
                                                     * https://bugzilla.mozilla.org/show_bug.cgi?id=1280023
                                                     */

                                                    // report buffer full, abort network IO
                                                    if (!this._isBufferFull) {
                                                        this._emitter.emit(_mseEvents2.default.BUFFER_FULL);
                                                    }
                                                    this._isBufferFull = true;
                                                } else {
                                                    _logger2.default.e(this.TAG, error.message);
                                                    this._emitter.emit(_mseEvents2.default.ERROR, {
                                                        code: error.code,
                                                        msg: error.message
                                                    });
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            {
                                key: '_onSourceOpen',
                                value: function _onSourceOpen() {
                                    _logger2.default.v(this.TAG, 'MediaSource onSourceOpen');
                                    this._mediaSource.removeEventListener('sourceopen', this.e.onSourceOpen);
                                    // deferred sourcebuffer creation / initialization
                                    if (this._pendingSourceBufferInit.length > 0) {
                                        var pendings = this._pendingSourceBufferInit;
                                        while (pendings.length) {
                                            var segment = pendings.shift();
                                            this.appendInitSegment(segment, true);
                                        }
                                    }
                                    // there may be some pending media segments, append them
                                    if (this._hasPendingSegments()) {
                                        this._doAppendSegments();
                                    }
                                    this._emitter.emit(_mseEvents2.default.SOURCE_OPEN);
                                }
                            },
                            {
                                key: '_onSourceEnded',
                                value: function _onSourceEnded() {
                                    // fired on endOfStream
                                    _logger2.default.v(this.TAG, 'MediaSource onSourceEnded');
                                }
                            },
                            {
                                key: '_onSourceClose',
                                value: function _onSourceClose() {
                                    // fired on detaching from media element
                                    _logger2.default.v(this.TAG, 'MediaSource onSourceClose');
                                    if (this._mediaSource && this.e != null) {
                                        this._mediaSource.removeEventListener('sourceopen', this.e.onSourceOpen);
                                        this._mediaSource.removeEventListener('sourceended', this.e.onSourceEnded);
                                        this._mediaSource.removeEventListener('sourceclose', this.e.onSourceClose);
                                    }
                                }
                            },
                            {
                                key: '_hasPendingSegments',
                                value: function _hasPendingSegments() {
                                    var ps = this._pendingSegments;
                                    return ps.video.length > 0 || ps.audio.length > 0;
                                }
                            },
                            {
                                key: '_hasPendingRemoveRanges',
                                value: function _hasPendingRemoveRanges() {
                                    var prr = this._pendingRemoveRanges;
                                    return prr.video.length > 0 || prr.audio.length > 0;
                                }
                            },
                            {
                                key: '_onSourceBufferUpdateEnd',
                                value: function _onSourceBufferUpdateEnd() {
                                    if (this._hasPendingRemoveRanges()) {
                                        this._doRemoveRanges();
                                    } else if (this._hasPendingSegments()) {
                                        this._doAppendSegments();
                                    } else if (this._hasPendingEos) {
                                        this.endOfStream();
                                    }
                                    this._emitter.emit(_mseEvents2.default.UPDATE_END);
                                }
                            },
                            {
                                key: '_onSourceBufferError',
                                value: function _onSourceBufferError(e) {
                                    _logger2.default.e(this.TAG, 'SourceBuffer Error: ' + e);
                                    // this error might not always be fatal, just ignore it
                                }
                            }
                        ]);

                        return MSEController;
                    })();

                    exports.default = MSEController;
                },
                {
                    '../utils/browser.js': 39,
                    '../utils/exception.js': 40,
                    '../utils/logger.js': 41,
                    './media-segment-info.js': 8,
                    './mse-events.js': 10,
                    events: 2
                }
            ],
            10: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var MSEEvents = {
                        ERROR: 'error',
                        SOURCE_OPEN: 'source_open',
                        UPDATE_END: 'update_end',
                        BUFFER_FULL: 'buffer_full'
                    };

                    exports.default = MSEEvents;
                },
                {}
            ],
            11: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var _events = _dereq_('events');

                    var _events2 = _interopRequireDefault(_events);

                    var _logger = _dereq_('../utils/logger.js');

                    var _logger2 = _interopRequireDefault(_logger);

                    var _loggingControl = _dereq_('../utils/logging-control.js');

                    var _loggingControl2 = _interopRequireDefault(_loggingControl);

                    var _transmuxingController = _dereq_('./transmuxing-controller.js');

                    var _transmuxingController2 = _interopRequireDefault(_transmuxingController);

                    var _transmuxingEvents = _dereq_('./transmuxing-events.js');

                    var _transmuxingEvents2 = _interopRequireDefault(_transmuxingEvents);

                    var _transmuxingWorker = _dereq_('./transmuxing-worker.js');

                    var _transmuxingWorker2 = _interopRequireDefault(_transmuxingWorker);

                    var _mediaInfo = _dereq_('./media-info.js');

                    var _mediaInfo2 = _interopRequireDefault(_mediaInfo);

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    var Transmuxer = (function () {
                        function Transmuxer(mediaDataSource, config) {
                            _classCallCheck(this, Transmuxer);

                            this.TAG = 'Transmuxer';
                            this._emitter = new _events2.default();

                            if (config.enableWorker && typeof Worker !== 'undefined') {
                                try {
                                    var work = _dereq_('webworkify');
                                    this._worker = work(_transmuxingWorker2.default);
                                    this._workerDestroying = false;
                                    this._worker.addEventListener('message', this._onWorkerMessage.bind(this));
                                    this._worker.postMessage({ cmd: 'init', param: [mediaDataSource, config] });
                                    this.e = {
                                        onLoggingConfigChanged: this._onLoggingConfigChanged.bind(this)
                                    };
                                    _loggingControl2.default.registerListener(this.e.onLoggingConfigChanged);
                                    this._worker.postMessage({
                                        cmd: 'logging_config',
                                        param: _loggingControl2.default.getConfig()
                                    });
                                } catch (error) {
                                    _logger2.default.e(
                                        this.TAG,
                                        'Error while initialize transmuxing worker, fallback to inline transmuxing'
                                    );
                                    this._worker = null;
                                    this._controller = new _transmuxingController2.default(mediaDataSource, config);
                                }
                            } else {
                                this._controller = new _transmuxingController2.default(mediaDataSource, config);
                            }

                            if (this._controller) {
                                var ctl = this._controller;
                                ctl.on(_transmuxingEvents2.default.IO_ERROR, this._onIOError.bind(this));
                                ctl.on(_transmuxingEvents2.default.DEMUX_ERROR, this._onDemuxError.bind(this));
                                ctl.on(_transmuxingEvents2.default.INIT_SEGMENT, this._onInitSegment.bind(this));
                                ctl.on(_transmuxingEvents2.default.MEDIA_SEGMENT, this._onMediaSegment.bind(this));
                                ctl.on(
                                    _transmuxingEvents2.default.LOADING_COMPLETE,
                                    this._onLoadingComplete.bind(this)
                                );
                                ctl.on(
                                    _transmuxingEvents2.default.RECOVERED_EARLY_EOF,
                                    this._onRecoveredEarlyEof.bind(this)
                                );
                                ctl.on(_transmuxingEvents2.default.MEDIA_INFO, this._onMediaInfo.bind(this));
                                ctl.on(_transmuxingEvents2.default.STATISTICS_INFO, this._onStatisticsInfo.bind(this));
                                ctl.on(
                                    _transmuxingEvents2.default.RECOMMEND_SEEKPOINT,
                                    this._onRecommendSeekpoint.bind(this)
                                );
                            }
                        }

                        _createClass(Transmuxer, [
                            {
                                key: 'destroy',
                                value: function destroy() {
                                    if (this._worker) {
                                        if (!this._workerDestroying) {
                                            this._workerDestroying = true;
                                            this._worker.postMessage({ cmd: 'destroy' });
                                            _loggingControl2.default.removeListener(this.e.onLoggingConfigChanged);
                                            this.e = null;
                                        }
                                    } else {
                                        this._controller.destroy();
                                        this._controller = null;
                                    }
                                    this._emitter.removeAllListeners();
                                    this._emitter = null;
                                }
                            },
                            {
                                key: 'on',
                                value: function on(event, listener) {
                                    this._emitter.addListener(event, listener);
                                }
                            },
                            {
                                key: 'off',
                                value: function off(event, listener) {
                                    this._emitter.removeListener(event, listener);
                                }
                            },
                            {
                                key: 'hasWorker',
                                value: function hasWorker() {
                                    return this._worker != null;
                                }
                            },
                            {
                                key: 'open',
                                value: function open() {
                                    if (this._worker) {
                                        this._worker.postMessage({ cmd: 'start' });
                                    } else {
                                        this._controller.start();
                                    }
                                }
                            },
                            {
                                key: 'close',
                                value: function close() {
                                    if (this._worker) {
                                        this._worker.postMessage({ cmd: 'stop' });
                                    } else {
                                        this._controller.stop();
                                    }
                                }
                            },
                            {
                                key: 'seek',
                                value: function seek(milliseconds) {
                                    if (this._worker) {
                                        this._worker.postMessage({ cmd: 'seek', param: milliseconds });
                                    } else {
                                        this._controller.seek(milliseconds);
                                    }
                                }
                            },
                            {
                                key: 'pause',
                                value: function pause() {
                                    if (this._worker) {
                                        this._worker.postMessage({ cmd: 'pause' });
                                    } else {
                                        this._controller.pause();
                                    }
                                }
                            },
                            {
                                key: 'resume',
                                value: function resume(time) {
                                    if (this._worker) {
                                        this._worker.postMessage({ cmd: 'resume' });
                                    } else {
                                        this._controller.resume(time);
                                    }
                                }
                            },
                            {
                                key: '_onInitSegment',
                                value: function _onInitSegment(type, initSegment) {
                                    var _this = this;

                                    // do async invoke
                                    Promise.resolve().then(function () {
                                        _this._emitter.emit(
                                            _transmuxingEvents2.default.INIT_SEGMENT,
                                            type,
                                            initSegment
                                        );
                                    });
                                }
                            },
                            {
                                key: '_onMediaSegment',
                                value: function _onMediaSegment(type, mediaSegment) {
                                    var _this2 = this;

                                    Promise.resolve().then(function () {
                                        _this2._emitter.emit(
                                            _transmuxingEvents2.default.MEDIA_SEGMENT,
                                            type,
                                            mediaSegment
                                        );
                                    });
                                }
                            },
                            {
                                key: '_onLoadingComplete',
                                value: function _onLoadingComplete() {
                                    var _this3 = this;

                                    Promise.resolve().then(function () {
                                        _this3._emitter.emit(_transmuxingEvents2.default.LOADING_COMPLETE);
                                    });
                                }
                            },
                            {
                                key: '_onRecoveredEarlyEof',
                                value: function _onRecoveredEarlyEof() {
                                    var _this4 = this;

                                    Promise.resolve().then(function () {
                                        _this4._emitter.emit(_transmuxingEvents2.default.RECOVERED_EARLY_EOF);
                                    });
                                }
                            },
                            {
                                key: '_onMediaInfo',
                                value: function _onMediaInfo(mediaInfo) {
                                    var _this5 = this;

                                    Promise.resolve().then(function () {
                                        _this5._emitter.emit(_transmuxingEvents2.default.MEDIA_INFO, mediaInfo);
                                    });
                                }
                            },
                            {
                                key: '_onStatisticsInfo',
                                value: function _onStatisticsInfo(statisticsInfo) {
                                    var _this6 = this;

                                    Promise.resolve().then(function () {
                                        _this6._emitter.emit(
                                            _transmuxingEvents2.default.STATISTICS_INFO,
                                            statisticsInfo
                                        );
                                    });
                                }
                            },
                            {
                                key: '_onIOError',
                                value: function _onIOError(type, info) {
                                    var _this7 = this;

                                    Promise.resolve().then(function () {
                                        _this7._emitter.emit(_transmuxingEvents2.default.IO_ERROR, type, info);
                                    });
                                }
                            },
                            {
                                key: '_onDemuxError',
                                value: function _onDemuxError(type, info) {
                                    var _this8 = this;

                                    Promise.resolve().then(function () {
                                        _this8._emitter.emit(_transmuxingEvents2.default.DEMUX_ERROR, type, info);
                                    });
                                }
                            },
                            {
                                key: '_onRecommendSeekpoint',
                                value: function _onRecommendSeekpoint(milliseconds) {
                                    var _this9 = this;

                                    Promise.resolve().then(function () {
                                        _this9._emitter.emit(
                                            _transmuxingEvents2.default.RECOMMEND_SEEKPOINT,
                                            milliseconds
                                        );
                                    });
                                }
                            },
                            {
                                key: '_onLoggingConfigChanged',
                                value: function _onLoggingConfigChanged(config) {
                                    if (this._worker) {
                                        this._worker.postMessage({ cmd: 'logging_config', param: config });
                                    }
                                }
                            },
                            {
                                key: '_onWorkerMessage',
                                value: function _onWorkerMessage(e) {
                                    var message = e.data;
                                    var data = message.data;

                                    if (message.msg === 'destroyed' || this._workerDestroying) {
                                        this._workerDestroying = false;
                                        this._worker.terminate();
                                        this._worker = null;
                                        return;
                                    }

                                    switch (message.msg) {
                                        case _transmuxingEvents2.default.INIT_SEGMENT:
                                        case _transmuxingEvents2.default.MEDIA_SEGMENT:
                                            this._emitter.emit(message.msg, data.type, data.data);
                                            break;
                                        case _transmuxingEvents2.default.LOADING_COMPLETE:
                                        case _transmuxingEvents2.default.RECOVERED_EARLY_EOF:
                                            this._emitter.emit(message.msg);
                                            break;
                                        case _transmuxingEvents2.default.MEDIA_INFO:
                                            Object.setPrototypeOf(data, _mediaInfo2.default.prototype);
                                            this._emitter.emit(message.msg, data);
                                            break;
                                        case _transmuxingEvents2.default.STATISTICS_INFO:
                                            this._emitter.emit(message.msg, data);
                                            break;
                                        case _transmuxingEvents2.default.IO_ERROR:
                                        case _transmuxingEvents2.default.DEMUX_ERROR:
                                            this._emitter.emit(message.msg, data.type, data.info);
                                            break;
                                        case _transmuxingEvents2.default.RECOMMEND_SEEKPOINT:
                                            this._emitter.emit(message.msg, data);
                                            break;
                                        default:
                                            break;
                                    }
                                }
                            }
                        ]);

                        return Transmuxer;
                    })();

                    exports.default = Transmuxer;
                },
                {
                    '../utils/logger.js': 41,
                    '../utils/logging-control.js': 42,
                    './media-info.js': 7,
                    './transmuxing-controller.js': 12,
                    './transmuxing-events.js': 13,
                    './transmuxing-worker.js': 14,
                    events: 2,
                    webworkify: 4
                }
            ],
            12: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var _events = _dereq_('events');

                    var _events2 = _interopRequireDefault(_events);

                    var _logger = _dereq_('../utils/logger.js');

                    var _logger2 = _interopRequireDefault(_logger);

                    var _browser = _dereq_('../utils/browser.js');

                    var _browser2 = _interopRequireDefault(_browser);

                    var _mediaInfo = _dereq_('./media-info.js');

                    var _mediaInfo2 = _interopRequireDefault(_mediaInfo);

                    var _flvDemuxer = _dereq_('../demux/flv-demuxer.js');

                    var _flvDemuxer2 = _interopRequireDefault(_flvDemuxer);

                    var _mp4Remuxer = _dereq_('../remux/mp4-remuxer.js');

                    var _mp4Remuxer2 = _interopRequireDefault(_mp4Remuxer);

                    var _demuxErrors = _dereq_('../demux/demux-errors.js');

                    var _demuxErrors2 = _interopRequireDefault(_demuxErrors);

                    var _ioController = _dereq_('../io/io-controller.js');

                    var _ioController2 = _interopRequireDefault(_ioController);

                    var _transmuxingEvents = _dereq_('./transmuxing-events.js');

                    var _transmuxingEvents2 = _interopRequireDefault(_transmuxingEvents);

                    var _loader = _dereq_('../io/loader.js');

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    // Transmuxing (IO, Demuxing, Remuxing) controller, with multipart support
                    var TransmuxingController = (function () {
                        function TransmuxingController(mediaDataSource, config) {
                            _classCallCheck(this, TransmuxingController);

                            this.TAG = 'TransmuxingController';
                            this._emitter = new _events2.default();

                            this._config = config;

                            // treat single part media as multipart media, which has only one segment
                            if (!mediaDataSource.segments) {
                                mediaDataSource.segments = [
                                    {
                                        duration: mediaDataSource.duration,
                                        filesize: mediaDataSource.filesize,
                                        url: mediaDataSource.url
                                    }
                                ];
                            }

                            // fill in default IO params if not exists
                            if (typeof mediaDataSource.cors !== 'boolean') {
                                mediaDataSource.cors = true;
                            }
                            if (typeof mediaDataSource.withCredentials !== 'boolean') {
                                mediaDataSource.withCredentials = false;
                            }

                            this._mediaDataSource = mediaDataSource;
                            this._currentSegmentIndex = 0;
                            var totalDuration = 0;

                            this._mediaDataSource.segments.forEach(function (segment) {
                                // timestampBase for each segment, and calculate total duration
                                segment.timestampBase = totalDuration;
                                totalDuration += segment.duration;
                                // params needed by IOController
                                segment.cors = mediaDataSource.cors;
                                segment.withCredentials = mediaDataSource.withCredentials;
                            });

                            if (!isNaN(totalDuration) && this._mediaDataSource.duration !== totalDuration) {
                                this._mediaDataSource.duration = totalDuration;
                            }

                            this._mediaInfo = null;
                            this._demuxer = null;
                            this._remuxer = null;
                            this._ioctl = null;

                            this._pendingSeekTime = null;
                            this._pendingResolveSeekPoint = null;

                            this._statisticsReporter = null;
                        }

                        _createClass(TransmuxingController, [
                            {
                                key: 'destroy',
                                value: function destroy() {
                                    this._mediaInfo = null;
                                    this._mediaDataSource = null;

                                    if (this._statisticsReporter) {
                                        this._disableStatisticsReporter();
                                    }
                                    if (this._ioctl) {
                                        this._ioctl.destroy();
                                        this._ioctl = null;
                                    }
                                    if (this._demuxer) {
                                        this._demuxer.destroy();
                                        this._demuxer = null;
                                    }
                                    if (this._remuxer) {
                                        this._remuxer.destroy();
                                        this._remuxer = null;
                                    }

                                    this._emitter.removeAllListeners();
                                    this._emitter = null;
                                }
                            },
                            {
                                key: 'on',
                                value: function on(event, listener) {
                                    this._emitter.addListener(event, listener);
                                }
                            },
                            {
                                key: 'off',
                                value: function off(event, listener) {
                                    this._emitter.removeListener(event, listener);
                                }
                            },
                            {
                                key: 'start',
                                value: function start() {
                                    this._loadSegment(0);
                                    this._enableStatisticsReporter();
                                }
                            },
                            {
                                key: '_loadSegment',
                                value: function _loadSegment(segmentIndex, optionalFrom) {
                                    this._currentSegmentIndex = segmentIndex;
                                    var dataSource = this._mediaDataSource.segments[segmentIndex];

                                    var ioctl = (this._ioctl = new _ioController2.default(
                                        dataSource,
                                        this._config,
                                        segmentIndex
                                    ));
                                    ioctl.onError = this._onIOException.bind(this);
                                    ioctl.onSeeked = this._onIOSeeked.bind(this);
                                    ioctl.onComplete = this._onIOComplete.bind(this);
                                    ioctl.onRecoveredEarlyEof = this._onIORecoveredEarlyEof.bind(this);

                                    if (optionalFrom) {
                                        this._demuxer.bindDataSource(this._ioctl);
                                    } else {
                                        ioctl.onDataArrival = this._onInitChunkArrival.bind(this);
                                    }

                                    ioctl.open(optionalFrom);
                                }
                            },
                            {
                                key: 'stop',
                                value: function stop() {
                                    this._internalAbort();
                                    this._disableStatisticsReporter();
                                }
                            },
                            {
                                key: '_internalAbort',
                                value: function _internalAbort() {
                                    if (this._ioctl) {
                                        this._ioctl.destroy();
                                        this._ioctl = null;
                                    }
                                }
                            },
                            {
                                key: 'pause',
                                value: function pause() {
                                    // take a rest
                                    if (this._ioctl && this._ioctl.isWorking()) {
                                        this._ioctl.pause();
                                        this._disableStatisticsReporter();
                                    }
                                }
                            },
                            {
                                key: 'resume',
                                value: function resume(time) {
                                    if (this._ioctl && this._ioctl.isPaused()) {
                                        this._ioctl.resume(time);
                                        this._enableStatisticsReporter();
                                    }
                                }
                            },
                            {
                                key: 'seek',
                                value: function seek(milliseconds) {
                                    //wy 直接请求服务器伪流
                                    if (!this._config.isLive) {
                                        if (this._mediaInfo == undefined) {
                                            this._pendingSeekTime = milliseconds;
                                        } else {
                                            this._remuxer.seek(milliseconds);
                                            this._ioctl.seek(milliseconds);
                                            this._pendingResolveSeekPoint = milliseconds;
                                        }
                                        return;
                                    }

                                    if (this._mediaInfo == null || !this._mediaInfo.isSeekable()) {
                                        return;
                                    }

                                    var targetSegmentIndex = this._searchSegmentIndexContains(milliseconds);

                                    if (targetSegmentIndex === this._currentSegmentIndex) {
                                        // intra-segment seeking
                                        var segmentInfo = this._mediaInfo.segments[targetSegmentIndex];

                                        if (segmentInfo == undefined) {
                                            // current segment loading started, but mediainfo hasn't received yet
                                            // wait for the metadata loaded, then seek to expected position
                                            this._pendingSeekTime = milliseconds;
                                        } else {
                                            var keyframe = segmentInfo.getNearestKeyframe(milliseconds);
                                            this._remuxer.seek(keyframe.milliseconds);
                                            this._ioctl.seek(keyframe.fileposition);
                                            // Will be resolved in _onRemuxerMediaSegmentArrival()
                                            this._pendingResolveSeekPoint = keyframe.milliseconds;
                                        }
                                    } else {
                                        // cross-segment seeking
                                        var targetSegmentInfo = this._mediaInfo.segments[targetSegmentIndex];

                                        if (targetSegmentInfo == undefined) {
                                            // target segment hasn't been loaded. We need metadata then seek to expected time
                                            this._pendingSeekTime = milliseconds;
                                            this._internalAbort();
                                            this._remuxer.seek();
                                            this._remuxer.insertDiscontinuity();
                                            this._loadSegment(targetSegmentIndex);
                                            // Here we wait for the metadata loaded, then seek to expected position
                                        } else {
                                            // We have target segment's metadata, direct seek to target position
                                            var _keyframe = targetSegmentInfo.getNearestKeyframe(milliseconds);
                                            this._internalAbort();
                                            this._remuxer.seek(milliseconds);
                                            this._remuxer.insertDiscontinuity();
                                            this._demuxer.resetMediaInfo();
                                            this._demuxer.timestampBase = this._mediaDataSource.segments[
                                                targetSegmentIndex
                                            ].timestampBase;
                                            this._loadSegment(targetSegmentIndex, _keyframe.fileposition);
                                            this._pendingResolveSeekPoint = _keyframe.milliseconds;
                                            this._reportSegmentMediaInfo(targetSegmentIndex);
                                        }
                                    }

                                    this._enableStatisticsReporter();
                                }
                            },
                            {
                                key: '_searchSegmentIndexContains',
                                value: function _searchSegmentIndexContains(milliseconds) {
                                    var segments = this._mediaDataSource.segments;
                                    var idx = segments.length - 1;

                                    for (var i = 0; i < segments.length; i++) {
                                        if (milliseconds < segments[i].timestampBase) {
                                            idx = i - 1;
                                            break;
                                        }
                                    }
                                    return idx;
                                }
                            },
                            {
                                key: '_onInitChunkArrival',
                                value: function _onInitChunkArrival(data, byteStart) {
                                    var _this = this;

                                    var probeData = null;
                                    var consumed = 0;

                                    if (byteStart > 0) {
                                        // IOController seeked immediately after opened, byteStart > 0 callback may received
                                        this._demuxer.bindDataSource(this._ioctl);
                                        this._demuxer.timestampBase = this._mediaDataSource.segments[
                                            this._currentSegmentIndex
                                        ].timestampBase;

                                        consumed = this._demuxer.parseChunks(data, byteStart);
                                    } else if ((probeData = _flvDemuxer2.default.probe(data)).match) {
                                        // Always create new FLVDemuxer
                                        this._demuxer = new _flvDemuxer2.default(probeData, this._config);

                                        if (!this._remuxer) {
                                            this._remuxer = new _mp4Remuxer2.default(this._config);
                                        }

                                        var mds = this._mediaDataSource;
                                        if (mds.duration != undefined && !isNaN(mds.duration)) {
                                            this._demuxer.overridedDuration = mds.duration;
                                        }
                                        this._demuxer.timestampBase =
                                            mds.segments[this._currentSegmentIndex].timestampBase;

                                        this._demuxer.onError = this._onDemuxException.bind(this);
                                        this._demuxer.onMediaInfo = this._onMediaInfo.bind(this);

                                        this._remuxer.bindDataSource(this._demuxer.bindDataSource(this._ioctl));

                                        this._remuxer.onInitSegment = this._onRemuxerInitSegmentArrival.bind(this);
                                        this._remuxer.onMediaSegment = this._onRemuxerMediaSegmentArrival.bind(this);

                                        consumed = this._demuxer.parseChunks(data, byteStart);
                                    } else {
                                        probeData = null;
                                        _logger2.default.e(this.TAG, 'Non-FLV, Unsupported media type!');
                                        Promise.resolve().then(function () {
                                            _this._internalAbort();
                                        });
                                        this._emitter.emit(
                                            _transmuxingEvents2.default.DEMUX_ERROR,
                                            _demuxErrors2.default.FORMAT_UNSUPPORTED,
                                            'Non-FLV, Unsupported media type'
                                        );

                                        consumed = 0;
                                    }

                                    return consumed;
                                }
                            },
                            {
                                key: '_onMediaInfo',
                                value: function _onMediaInfo(mediaInfo) {
                                    var _this2 = this;

                                    if (this._mediaInfo == null) {
                                        // Store first segment's mediainfo as global mediaInfo
                                        this._mediaInfo = Object.assign({}, mediaInfo);
                                        this._mediaInfo.keyframesIndex = null;
                                        this._mediaInfo.segments = [];
                                        this._mediaInfo.segmentCount = this._mediaDataSource.segments.length;
                                        Object.setPrototypeOf(this._mediaInfo, _mediaInfo2.default.prototype);
                                    }

                                    var segmentInfo = Object.assign({}, mediaInfo);
                                    Object.setPrototypeOf(segmentInfo, _mediaInfo2.default.prototype);
                                    this._mediaInfo.segments[this._currentSegmentIndex] = segmentInfo;

                                    // notify mediaInfo update
                                    this._reportSegmentMediaInfo(this._currentSegmentIndex);

                                    if (this._pendingSeekTime != null) {
                                        Promise.resolve().then(function () {
                                            var target = _this2._pendingSeekTime;
                                            _this2._pendingSeekTime = null;
                                            _this2.seek(target);
                                        });
                                    }
                                }
                            },
                            {
                                key: '_onIOSeeked',
                                value: function _onIOSeeked() {
                                    this._remuxer.insertDiscontinuity();
                                }
                            },
                            {
                                key: '_onIOComplete',
                                value: function _onIOComplete(extraData) {
                                    var segmentIndex = extraData;
                                    var nextSegmentIndex = segmentIndex + 1;

                                    if (nextSegmentIndex < this._mediaDataSource.segments.length) {
                                        this._internalAbort();
                                        this._loadSegment(nextSegmentIndex);
                                    } else {
                                        this._emitter.emit(_transmuxingEvents2.default.LOADING_COMPLETE);
                                        this._disableStatisticsReporter();
                                    }
                                }
                            },
                            {
                                key: '_onIORecoveredEarlyEof',
                                value: function _onIORecoveredEarlyEof() {
                                    this._emitter.emit(_transmuxingEvents2.default.RECOVERED_EARLY_EOF);
                                }
                            },
                            {
                                key: '_onIOException',
                                value: function _onIOException(type, info) {
                                    _logger2.default.e(
                                        this.TAG,
                                        'IOException: type = ' + type + ', code = ' + info.code + ', msg = ' + info.msg
                                    );
                                    this._emitter.emit(_transmuxingEvents2.default.IO_ERROR, type, info);
                                    this._disableStatisticsReporter();
                                }
                            },
                            {
                                key: '_onDemuxException',
                                value: function _onDemuxException(type, info) {
                                    _logger2.default.e(this.TAG, 'DemuxException: type = ' + type + ', info = ' + info);
                                    this._emitter.emit(_transmuxingEvents2.default.DEMUX_ERROR, type, info);
                                }
                            },
                            {
                                key: '_onRemuxerInitSegmentArrival',
                                value: function _onRemuxerInitSegmentArrival(type, initSegment) {
                                    this._emitter.emit(_transmuxingEvents2.default.INIT_SEGMENT, type, initSegment);
                                }
                            },
                            {
                                key: '_onRemuxerMediaSegmentArrival',
                                value: function _onRemuxerMediaSegmentArrival(type, mediaSegment) {
                                    if (this._pendingSeekTime != null) {
                                        // Media segments after new-segment cross-seeking should be dropped.
                                        return;
                                    }
                                    this._emitter.emit(_transmuxingEvents2.default.MEDIA_SEGMENT, type, mediaSegment);

                                    // Resolve pending seekPoint
                                    if (this._pendingResolveSeekPoint != null && type === 'video') {
                                        var syncPoints = mediaSegment.info.syncPoints;
                                        var seekpoint = this._pendingResolveSeekPoint;
                                        this._pendingResolveSeekPoint = null;

                                        // Safari: Pass PTS for recommend_seekpoint
                                        if (
                                            _browser2.default.safari &&
                                            syncPoints.length > 0 &&
                                            syncPoints[0].originalDts === seekpoint
                                        ) {
                                            seekpoint = syncPoints[0].pts;
                                        }
                                        // else: use original DTS (keyframe.milliseconds)

                                        this._emitter.emit(_transmuxingEvents2.default.RECOMMEND_SEEKPOINT, seekpoint);
                                    }
                                }
                            },
                            {
                                key: '_enableStatisticsReporter',
                                value: function _enableStatisticsReporter() {
                                    if (this._statisticsReporter == null) {
                                        this._statisticsReporter = self.setInterval(
                                            this._reportStatisticsInfo.bind(this),
                                            this._config.statisticsInfoReportInterval
                                        );
                                    }
                                }
                            },
                            {
                                key: '_disableStatisticsReporter',
                                value: function _disableStatisticsReporter() {
                                    if (this._statisticsReporter) {
                                        self.clearInterval(this._statisticsReporter);
                                        this._statisticsReporter = null;
                                    }
                                }
                            },
                            {
                                key: '_reportSegmentMediaInfo',
                                value: function _reportSegmentMediaInfo(segmentIndex) {
                                    var segmentInfo = this._mediaInfo.segments[segmentIndex];
                                    var exportInfo = Object.assign({}, segmentInfo);

                                    exportInfo.duration = this._mediaInfo.duration;
                                    exportInfo.segmentCount = this._mediaInfo.segmentCount;
                                    delete exportInfo.segments;
                                    delete exportInfo.keyframesIndex;

                                    this._emitter.emit(_transmuxingEvents2.default.MEDIA_INFO, exportInfo);
                                }
                            },
                            {
                                key: '_reportStatisticsInfo',
                                value: function _reportStatisticsInfo() {
                                    var info = {};

                                    info.url = this._ioctl.currentUrl;
                                    info.speed = this._ioctl.currentSpeed;
                                    info.loaderType = this._ioctl.loaderType;
                                    info.currentSegmentIndex = this._currentSegmentIndex;
                                    info.totalSegmentCount = this._mediaDataSource.segments.length;

                                    this._emitter.emit(_transmuxingEvents2.default.STATISTICS_INFO, info);
                                }
                            }
                        ]);

                        return TransmuxingController;
                    })();

                    exports.default = TransmuxingController;
                },
                {
                    '../demux/demux-errors.js': 16,
                    '../demux/flv-demuxer.js': 18,
                    '../io/io-controller.js': 23,
                    '../io/loader.js': 24,
                    '../remux/mp4-remuxer.js': 38,
                    '../utils/browser.js': 39,
                    '../utils/logger.js': 41,
                    './media-info.js': 7,
                    './transmuxing-events.js': 13,
                    events: 2
                }
            ],
            13: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var TransmuxingEvents = {
                        IO_ERROR: 'io_error',
                        DEMUX_ERROR: 'demux_error',
                        INIT_SEGMENT: 'init_segment',
                        MEDIA_SEGMENT: 'media_segment',
                        LOADING_COMPLETE: 'loading_complete',
                        RECOVERED_EARLY_EOF: 'recovered_early_eof',
                        MEDIA_INFO: 'media_info',
                        STATISTICS_INFO: 'statistics_info',
                        RECOMMEND_SEEKPOINT: 'recommend_seekpoint'
                    };

                    exports.default = TransmuxingEvents;
                },
                {}
            ],
            14: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _logger = _dereq_('../utils/logger.js');

                    var _logger2 = _interopRequireDefault(_logger);

                    var _loggingControl = _dereq_('../utils/logging-control.js');

                    var _loggingControl2 = _interopRequireDefault(_loggingControl);

                    var _polyfill = _dereq_('../utils/polyfill.js');

                    var _polyfill2 = _interopRequireDefault(_polyfill);

                    var _transmuxingController = _dereq_('./transmuxing-controller.js');

                    var _transmuxingController2 = _interopRequireDefault(_transmuxingController);

                    var _transmuxingEvents = _dereq_('./transmuxing-events.js');

                    var _transmuxingEvents2 = _interopRequireDefault(_transmuxingEvents);

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    /* post message to worker:
   data: {
       cmd: string
       param: any
   }

   receive message from worker:
   data: {
       msg: string,
       data: any
   }
 */

                    var TransmuxingWorker = function TransmuxingWorker(self) {
                        var TAG = 'TransmuxingWorker';
                        var controller = null;

                        _polyfill2.default.install();

                        self.addEventListener('message', function (e) {
                            switch (e.data.cmd) {
                                case 'init':
                                    controller = new _transmuxingController2.default(e.data.param[0], e.data.param[1]);
                                    controller.on(_transmuxingEvents2.default.IO_ERROR, onIOError.bind(this));
                                    controller.on(_transmuxingEvents2.default.DEMUX_ERROR, onDemuxError.bind(this));
                                    controller.on(_transmuxingEvents2.default.INIT_SEGMENT, onInitSegment.bind(this));
                                    controller.on(_transmuxingEvents2.default.MEDIA_SEGMENT, onMediaSegment.bind(this));
                                    controller.on(
                                        _transmuxingEvents2.default.LOADING_COMPLETE,
                                        onLoadingComplete.bind(this)
                                    );
                                    controller.on(
                                        _transmuxingEvents2.default.RECOVERED_EARLY_EOF,
                                        onRecoveredEarlyEof.bind(this)
                                    );
                                    controller.on(_transmuxingEvents2.default.MEDIA_INFO, onMediaInfo.bind(this));
                                    controller.on(
                                        _transmuxingEvents2.default.STATISTICS_INFO,
                                        onStatisticsInfo.bind(this)
                                    );
                                    controller.on(
                                        _transmuxingEvents2.default.RECOMMEND_SEEKPOINT,
                                        onRecommendSeekpoint.bind(this)
                                    );
                                    break;
                                case 'destroy':
                                    if (controller) {
                                        controller.destroy();
                                        controller = null;
                                    }
                                    self.postMessage({ msg: 'destroyed' });
                                    break;
                                case 'start':
                                    controller.start();
                                    break;
                                case 'stop':
                                    controller.stop();
                                    break;
                                case 'seek':
                                    controller.seek(e.data.param);
                                    break;
                                case 'pause':
                                    controller.pause();
                                    break;
                                case 'resume':
                                    controller.resume();
                                    break;
                                case 'logging_config':
                                    _loggingControl2.default.applyConfig(e.data.param);
                                    break;
                            }
                        });

                        function onInitSegment(type, initSegment) {
                            var obj = {
                                msg: _transmuxingEvents2.default.INIT_SEGMENT,
                                data: {
                                    type: type,
                                    data: initSegment
                                }
                            };
                            self.postMessage(obj, [initSegment.data]); // data: ArrayBuffer
                        }

                        function onMediaSegment(type, mediaSegment) {
                            var obj = {
                                msg: _transmuxingEvents2.default.MEDIA_SEGMENT,
                                data: {
                                    type: type,
                                    data: mediaSegment
                                }
                            };
                            self.postMessage(obj, [mediaSegment.data]); // data: ArrayBuffer
                        }

                        function onLoadingComplete() {
                            var obj = {
                                msg: _transmuxingEvents2.default.LOADING_COMPLETE
                            };
                            self.postMessage(obj);
                        }

                        function onRecoveredEarlyEof() {
                            var obj = {
                                msg: _transmuxingEvents2.default.RECOVERED_EARLY_EOF
                            };
                            self.postMessage(obj);
                        }

                        function onMediaInfo(mediaInfo) {
                            var obj = {
                                msg: _transmuxingEvents2.default.MEDIA_INFO,
                                data: mediaInfo
                            };
                            self.postMessage(obj);
                        }

                        function onStatisticsInfo(statInfo) {
                            var obj = {
                                msg: _transmuxingEvents2.default.STATISTICS_INFO,
                                data: statInfo
                            };
                            self.postMessage(obj);
                        }

                        function onIOError(type, info) {
                            self.postMessage({
                                msg: _transmuxingEvents2.default.IO_ERROR,
                                data: {
                                    type: type,
                                    info: info
                                }
                            });
                        }

                        function onDemuxError(type, info) {
                            self.postMessage({
                                msg: _transmuxingEvents2.default.DEMUX_ERROR,
                                data: {
                                    type: type,
                                    info: info
                                }
                            });
                        }

                        function onRecommendSeekpoint(milliseconds) {
                            self.postMessage({
                                msg: _transmuxingEvents2.default.RECOMMEND_SEEKPOINT,
                                data: milliseconds
                            });
                        }
                    };
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    exports.default = TransmuxingWorker;
                },
                {
                    '../utils/logger.js': 41,
                    '../utils/logging-control.js': 42,
                    '../utils/polyfill.js': 43,
                    './transmuxing-controller.js': 12,
                    './transmuxing-events.js': 13
                }
            ],
            15: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var _logger = _dereq_('../utils/logger.js');

                    var _logger2 = _interopRequireDefault(_logger);

                    var _utf8Conv = _dereq_('../utils/utf8-conv.js');

                    var _utf8Conv2 = _interopRequireDefault(_utf8Conv);

                    var _exception = _dereq_('../utils/exception.js');

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    var le = (function () {
                        var buf = new ArrayBuffer(2);
                        new DataView(buf).setInt16(0, 256, true); // little-endian write
                        return new Int16Array(buf)[0] === 256; // platform-spec read, if equal then LE
                    })();

                    var AMF = (function () {
                        function AMF() {
                            _classCallCheck(this, AMF);
                        }

                        _createClass(AMF, null, [
                            {
                                key: 'parseScriptData',
                                value: function parseScriptData(arrayBuffer, dataOffset, dataSize) {
                                    var data = {};

                                    try {
                                        var name = AMF.parseValue(arrayBuffer, dataOffset, dataSize);
                                        var value = AMF.parseValue(
                                            arrayBuffer,
                                            dataOffset + name.size,
                                            dataSize - name.size
                                        );

                                        data[name.data] = value.data;
                                    } catch (e) {
                                        _logger2.default.e('AMF', e.toString());
                                    }

                                    return data;
                                }
                            },
                            {
                                key: 'parseObject',
                                value: function parseObject(arrayBuffer, dataOffset, dataSize) {
                                    if (dataSize < 3) {
                                        throw new _exception.IllegalStateException(
                                            'Data not enough when parse ScriptDataObject'
                                        );
                                    }
                                    var name = AMF.parseString(arrayBuffer, dataOffset, dataSize);
                                    var value = AMF.parseValue(
                                        arrayBuffer,
                                        dataOffset + name.size,
                                        dataSize - name.size
                                    );
                                    var isObjectEnd = value.objectEnd;

                                    return {
                                        data: {
                                            name: name.data,
                                            value: value.data
                                        },
                                        size: name.size + value.size,
                                        objectEnd: isObjectEnd
                                    };
                                }
                            },
                            {
                                key: 'parseVariable',
                                value: function parseVariable(arrayBuffer, dataOffset, dataSize) {
                                    return AMF.parseObject(arrayBuffer, dataOffset, dataSize);
                                }
                            },
                            {
                                key: 'parseString',
                                value: function parseString(arrayBuffer, dataOffset, dataSize) {
                                    if (dataSize < 2) {
                                        throw new _exception.IllegalStateException('Data not enough when parse String');
                                    }
                                    var v = new DataView(arrayBuffer, dataOffset, dataSize);
                                    var length = v.getUint16(0, !le);

                                    var str = void 0;
                                    if (length > 0) {
                                        str = (0, _utf8Conv2.default)(
                                            new Uint8Array(arrayBuffer, dataOffset + 2, length)
                                        );
                                    } else {
                                        str = '';
                                    }

                                    return {
                                        data: str,
                                        size: 2 + length
                                    };
                                }
                            },
                            {
                                key: 'parseLongString',
                                value: function parseLongString(arrayBuffer, dataOffset, dataSize) {
                                    if (dataSize < 4) {
                                        throw new _exception.IllegalStateException(
                                            'Data not enough when parse LongString'
                                        );
                                    }
                                    var v = new DataView(arrayBuffer, dataOffset, dataSize);
                                    var length = v.getUint32(0, !le);

                                    var str = void 0;
                                    if (length > 0) {
                                        str = (0, _utf8Conv2.default)(
                                            new Uint8Array(arrayBuffer, dataOffset + 4, length)
                                        );
                                    } else {
                                        str = '';
                                    }

                                    return {
                                        data: str,
                                        size: 4 + length
                                    };
                                }
                            },
                            {
                                key: 'parseDate',
                                value: function parseDate(arrayBuffer, dataOffset, dataSize) {
                                    if (dataSize < 10) {
                                        throw new _exception.IllegalStateException('Data size invalid when parse Date');
                                    }
                                    var v = new DataView(arrayBuffer, dataOffset, dataSize);
                                    var timestamp = v.getFloat64(0, !le);
                                    var localTimeOffset = v.getInt16(8, !le);
                                    timestamp += localTimeOffset * 60 * 1000; // get UTC time

                                    return {
                                        data: new Date(timestamp),
                                        size: 8 + 2
                                    };
                                }
                            },
                            {
                                key: 'parseValue',
                                value: function parseValue(arrayBuffer, dataOffset, dataSize) {
                                    if (dataSize < 1) {
                                        throw new _exception.IllegalStateException('Data not enough when parse Value');
                                    }

                                    var v = new DataView(arrayBuffer, dataOffset, dataSize);

                                    var offset = 1;
                                    var type = v.getUint8(0);
                                    var value = void 0;
                                    var objectEnd = false;

                                    try {
                                        switch (type) {
                                            case 0:
                                                // Number(Double) type
                                                value = v.getFloat64(1, !le);
                                                offset += 8;
                                                break;
                                            case 1: {
                                                // Boolean type
                                                var b = v.getUint8(1);
                                                value = b ? true : false;
                                                offset += 1;
                                                break;
                                            }
                                            case 2: {
                                                // String type
                                                var amfstr = AMF.parseString(arrayBuffer, dataOffset + 1, dataSize - 1);
                                                value = amfstr.data;
                                                offset += amfstr.size;
                                                break;
                                            }
                                            case 3: {
                                                // Object(s) type
                                                value = {};
                                                var terminal = 0; // workaround for malformed Objects which has missing ScriptDataObjectEnd
                                                if ((v.getUint32(dataSize - 4, !le) & 0x00ffffff) === 9) {
                                                    terminal = 3;
                                                }
                                                while (offset < dataSize - 4) {
                                                    // 4 === type(UI8) + ScriptDataObjectEnd(UI24)
                                                    var amfobj = AMF.parseObject(
                                                        arrayBuffer,
                                                        dataOffset + offset,
                                                        dataSize - offset - terminal
                                                    );
                                                    if (amfobj.objectEnd) break;
                                                    value[amfobj.data.name] = amfobj.data.value;
                                                    offset += amfobj.size;
                                                }
                                                if (offset <= dataSize - 3) {
                                                    var marker = v.getUint32(offset - 1, !le) & 0x00ffffff;
                                                    if (marker === 9) {
                                                        offset += 3;
                                                    }
                                                }
                                                break;
                                            }
                                            case 8: {
                                                // ECMA array type (Mixed array)
                                                value = {};
                                                offset += 4; // ECMAArrayLength(UI32)
                                                var _terminal = 0; // workaround for malformed MixedArrays which has missing ScriptDataObjectEnd
                                                if ((v.getUint32(dataSize - 4, !le) & 0x00ffffff) === 9) {
                                                    _terminal = 3;
                                                }
                                                while (offset < dataSize - 8) {
                                                    // 8 === type(UI8) + ECMAArrayLength(UI32) + ScriptDataVariableEnd(UI24)
                                                    var amfvar = AMF.parseVariable(
                                                        arrayBuffer,
                                                        dataOffset + offset,
                                                        dataSize - offset - _terminal
                                                    );
                                                    if (amfvar.objectEnd) break;
                                                    value[amfvar.data.name] = amfvar.data.value;
                                                    offset += amfvar.size;
                                                }
                                                if (offset <= dataSize - 3) {
                                                    var _marker = v.getUint32(offset - 1, !le) & 0x00ffffff;
                                                    if (_marker === 9) {
                                                        offset += 3;
                                                    }
                                                }
                                                break;
                                            }
                                            case 9:
                                                // ScriptDataObjectEnd
                                                value = undefined;
                                                offset = 1;
                                                objectEnd = true;
                                                break;
                                            case 10: {
                                                // Strict array type
                                                // ScriptDataValue[n]. NOTE: according to video_file_format_spec_v10_1.pdf
                                                value = [];
                                                var strictArrayLength = v.getUint32(1, !le);
                                                offset += 4;
                                                for (var i = 0; i < strictArrayLength; i++) {
                                                    var val = AMF.parseValue(
                                                        arrayBuffer,
                                                        dataOffset + offset,
                                                        dataSize - offset
                                                    );
                                                    value.push(val.data);
                                                    offset += val.size;
                                                }
                                                break;
                                            }
                                            case 11: {
                                                // Date type
                                                var date = AMF.parseDate(arrayBuffer, dataOffset + 1, dataSize - 1);
                                                value = date.data;
                                                offset += date.size;
                                                break;
                                            }
                                            case 12: {
                                                // Long string type
                                                var amfLongStr = AMF.parseString(
                                                    arrayBuffer,
                                                    dataOffset + 1,
                                                    dataSize - 1
                                                );
                                                value = amfLongStr.data;
                                                offset += amfLongStr.size;
                                                break;
                                            }
                                            default:
                                                // ignore and skip
                                                offset = dataSize;
                                                _logger2.default.w('AMF', 'Unsupported AMF value type ' + type);
                                        }
                                    } catch (e) {
                                        _logger2.default.e('AMF', e.toString());
                                    }

                                    return {
                                        data: value,
                                        size: offset,
                                        objectEnd: objectEnd
                                    };
                                }
                            }
                        ]);

                        return AMF;
                    })();

                    exports.default = AMF;
                },
                { '../utils/exception.js': 40, '../utils/logger.js': 41, '../utils/utf8-conv.js': 44 }
            ],
            16: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var DemuxErrors = {
                        OK: 'OK',
                        FORMAT_ERROR: 'FormatError',
                        FORMAT_UNSUPPORTED: 'FormatUnsupported',
                        CODEC_UNSUPPORTED: 'CodecUnsupported'
                    };

                    exports.default = DemuxErrors;
                },
                {}
            ],
            17: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var _exception = _dereq_('../utils/exception.js');

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    // Exponential-Golomb buffer decoder
                    var ExpGolomb = (function () {
                        function ExpGolomb(uint8array) {
                            _classCallCheck(this, ExpGolomb);

                            this.TAG = 'ExpGolomb';

                            this._buffer = uint8array;
                            this._buffer_index = 0;
                            this._total_bytes = uint8array.byteLength;
                            this._total_bits = uint8array.byteLength * 8;
                            this._current_word = 0;
                            this._current_word_bits_left = 0;
                        }

                        _createClass(ExpGolomb, [
                            {
                                key: 'destroy',
                                value: function destroy() {
                                    this._buffer = null;
                                }
                            },
                            {
                                key: '_fillCurrentWord',
                                value: function _fillCurrentWord() {
                                    var buffer_bytes_left = this._total_bytes - this._buffer_index;
                                    if (buffer_bytes_left <= 0)
                                        throw new _exception.IllegalStateException(
                                            'ExpGolomb: _fillCurrentWord() but no bytes available'
                                        );

                                    var bytes_read = Math.min(4, buffer_bytes_left);
                                    var word = new Uint8Array(4);
                                    word.set(
                                        this._buffer.subarray(this._buffer_index, this._buffer_index + bytes_read)
                                    );
                                    this._current_word = new DataView(word.buffer).getUint32(0, false);

                                    this._buffer_index += bytes_read;
                                    this._current_word_bits_left = bytes_read * 8;
                                }
                            },
                            {
                                key: 'readBits',
                                value: function readBits(bits) {
                                    if (bits > 32)
                                        throw new _exception.InvalidArgumentException(
                                            'ExpGolomb: readBits() bits exceeded max 32bits!'
                                        );

                                    if (bits <= this._current_word_bits_left) {
                                        var _result = this._current_word >>> (32 - bits);
                                        this._current_word <<= bits;
                                        this._current_word_bits_left -= bits;
                                        return _result;
                                    }

                                    var result = this._current_word_bits_left ? this._current_word : 0;
                                    result = result >>> (32 - this._current_word_bits_left);
                                    var bits_need_left = bits - this._current_word_bits_left;

                                    this._fillCurrentWord();
                                    var bits_read_next = Math.min(bits_need_left, this._current_word_bits_left);

                                    var result2 = this._current_word >>> (32 - bits_read_next);
                                    this._current_word <<= bits_read_next;
                                    this._current_word_bits_left -= bits_read_next;

                                    result = (result << bits_read_next) | result2;
                                    return result;
                                }
                            },
                            {
                                key: 'readBool',
                                value: function readBool() {
                                    return this.readBits(1) === 1;
                                }
                            },
                            {
                                key: 'readByte',
                                value: function readByte() {
                                    return this.readBits(8);
                                }
                            },
                            {
                                key: '_skipLeadingZero',
                                value: function _skipLeadingZero() {
                                    var zero_count = void 0;
                                    for (zero_count = 0; zero_count < this._current_word_bits_left; zero_count++) {
                                        if (0 !== (this._current_word & (0x80000000 >>> zero_count))) {
                                            this._current_word <<= zero_count;
                                            this._current_word_bits_left -= zero_count;
                                            return zero_count;
                                        }
                                    }
                                    this._fillCurrentWord();
                                    return zero_count + this._skipLeadingZero();
                                }
                            },
                            {
                                key: 'readUEG',
                                value: function readUEG() {
                                    // unsigned exponential golomb
                                    var leading_zeros = this._skipLeadingZero();
                                    return this.readBits(leading_zeros + 1) - 1;
                                }
                            },
                            {
                                key: 'readSEG',
                                value: function readSEG() {
                                    // signed exponential golomb
                                    var value = this.readUEG();
                                    if (value & 0x01) {
                                        return (value + 1) >>> 1;
                                    } else {
                                        return -1 * (value >>> 1);
                                    }
                                }
                            }
                        ]);

                        return ExpGolomb;
                    })();

                    exports.default = ExpGolomb;
                },
                { '../utils/exception.js': 40 }
            ],
            18: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _typeof =
                        typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
                            ? function (obj) {
                                  return typeof obj;
                              }
                            : function (obj) {
                                  return obj &&
                                      typeof Symbol === 'function' &&
                                      obj.constructor === Symbol &&
                                      obj !== Symbol.prototype
                                      ? 'symbol'
                                      : typeof obj;
                              };

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var _logger = _dereq_('../utils/logger.js');

                    var _logger2 = _interopRequireDefault(_logger);

                    var _amfParser = _dereq_('./amf-parser.js');

                    var _amfParser2 = _interopRequireDefault(_amfParser);

                    var _spsParser = _dereq_('./sps-parser.js');

                    var _spsParser2 = _interopRequireDefault(_spsParser);

                    var _demuxErrors = _dereq_('./demux-errors.js');

                    var _demuxErrors2 = _interopRequireDefault(_demuxErrors);

                    var _mediaInfo = _dereq_('../core/media-info.js');

                    var _mediaInfo2 = _interopRequireDefault(_mediaInfo);

                    var _exception = _dereq_('../utils/exception.js');

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    function Swap16(src) {
                        return ((src >>> 8) & 0xff) | ((src & 0xff) << 8);
                    }

                    function Swap32(src) {
                        return (
                            ((src & 0xff000000) >>> 24) |
                            ((src & 0x00ff0000) >>> 8) |
                            ((src & 0x0000ff00) << 8) |
                            ((src & 0x000000ff) << 24)
                        );
                    }

                    function ReadBig32(array, index) {
                        return (
                            (array[index] << 24) | (array[index + 1] << 16) | (array[index + 2] << 8) | array[index + 3]
                        );
                    }

                    var FLVDemuxer = (function () {
                        function FLVDemuxer(probeData, config) {
                            _classCallCheck(this, FLVDemuxer);

                            this.TAG = 'FLVDemuxer';

                            this._config = config;

                            this._onError = null;
                            this._onMediaInfo = null;
                            this._onTrackMetadata = null;
                            this._onDataAvailable = null;

                            this._dataOffset = probeData.dataOffset;
                            this._firstParse = true;
                            this._dispatch = false;

                            this._hasAudio = probeData.hasAudioTrack;
                            this._hasVideo = probeData.hasVideoTrack;

                            this._audioInitialMetadataDispatched = false;
                            this._videoInitialMetadataDispatched = false;

                            this._mediaInfo = new _mediaInfo2.default();
                            this._mediaInfo.hasAudio = this._hasAudio;
                            this._mediaInfo.hasVideo = this._hasVideo;
                            this._metadata = null;
                            this._audioMetadata = null;
                            this._videoMetadata = null;

                            this._naluLengthSize = 4;
                            this._timestampBase = 0; // int32, in milliseconds
                            this._timescale = 1000;
                            this._duration = 0; // int32, in milliseconds
                            this._durationOverrided = false;
                            this._referenceFrameRate = {
                                fixed: true,
                                fps: 23.976,
                                fps_num: 23976,
                                fps_den: 1000
                            };

                            this._videoTrack = { type: 'video', id: 1, sequenceNumber: 0, samples: [], length: 0 };
                            this._audioTrack = { type: 'audio', id: 2, sequenceNumber: 0, samples: [], length: 0 };

                            this._littleEndian = (function () {
                                var buf = new ArrayBuffer(2);
                                new DataView(buf).setInt16(0, 256, true); // little-endian write
                                return new Int16Array(buf)[0] === 256; // platform-spec read, if equal then LE
                            })();
                        }

                        _createClass(
                            FLVDemuxer,
                            [
                                {
                                    key: 'destroy',
                                    value: function destroy() {
                                        this._mediaInfo = null;
                                        this._metadata = null;
                                        this._audioMetadata = null;
                                        this._videoMetadata = null;
                                        this._videoTrack = null;
                                        this._audioTrack = null;

                                        this._onError = null;
                                        this._onMediaInfo = null;
                                        this._onTrackMetadata = null;
                                        this._onDataAvailable = null;
                                    }
                                },
                                {
                                    key: 'bindDataSource',
                                    value: function bindDataSource(loader) {
                                        loader.onDataArrival = this.parseChunks.bind(this);
                                        return this;
                                    }

                                    // prototype: function(type: string, metadata: any): void
                                },
                                {
                                    key: 'resetMediaInfo',
                                    value: function resetMediaInfo() {
                                        this._mediaInfo = new _mediaInfo2.default();
                                    }
                                },
                                {
                                    key: '_isInitialMetadataDispatched',
                                    value: function _isInitialMetadataDispatched() {
                                        if (this._hasAudio && this._hasVideo) {
                                            // both audio & video
                                            return (
                                                this._audioInitialMetadataDispatched &&
                                                this._videoInitialMetadataDispatched
                                            );
                                        }
                                        if (this._hasAudio && !this._hasVideo) {
                                            // audio only
                                            return this._audioInitialMetadataDispatched;
                                        }
                                        if (!this._hasAudio && this._hasVideo) {
                                            // video only
                                            return this._videoInitialMetadataDispatched;
                                        }
                                    }

                                    // function parseChunks(chunk: ArrayBuffer, byteStart: number): number;
                                },
                                {
                                    key: 'parseChunks',
                                    value: function parseChunks(chunk, byteStart) {
                                        if (
                                            !this._onError ||
                                            !this._onMediaInfo ||
                                            !this._onTrackMetadata ||
                                            !this._onDataAvailable
                                        ) {
                                            throw new _exception.IllegalStateException(
                                                'Flv: onError & onMediaInfo & onTrackMetadata & onDataAvailable callback must be specified'
                                            );
                                        }

                                        var offset = 0;
                                        var le = this._littleEndian;

                                        if (byteStart === 0) {
                                            // buffer with FLV header
                                            if (chunk.byteLength > 13) {
                                                var probeData = FLVDemuxer.probe(chunk);
                                                offset = probeData.dataOffset;
                                                byteStart = probeData.dataOffset;
                                            } else {
                                                return 0;
                                            }
                                        }

                                        if (this._firstParse) {
                                            // handle PreviousTagSize0 before Tag1
                                            this._firstParse = false;
                                            if (byteStart !== this._dataOffset) {
                                                _logger2.default.w(
                                                    this.TAG,
                                                    'First time parsing but chunk byteStart invalid!'
                                                );
                                            }

                                            var v = new DataView(chunk, offset);
                                            var prevTagSize0 = v.getUint32(0, !le);
                                            if (prevTagSize0 !== 0) {
                                                _logger2.default.w(this.TAG, 'PrevTagSize0 !== 0 !!!');
                                            }
                                            offset += 4;
                                        }

                                        while (offset < chunk.byteLength) {
                                            this._dispatch = true;

                                            var _v = new DataView(chunk, offset);

                                            if (offset + 11 + 4 > chunk.byteLength) {
                                                // data not enough for parsing an flv tag
                                                break;
                                            }

                                            var tagType = _v.getUint8(0);
                                            var dataSize = _v.getUint32(0, !le) & 0x00ffffff;

                                            if (offset + 11 + dataSize + 4 > chunk.byteLength) {
                                                // data not enough for parsing actual data body
                                                break;
                                            }

                                            if (tagType !== 8 && tagType !== 9 && tagType !== 18) {
                                                _logger2.default.w(
                                                    this.TAG,
                                                    'Unsupported tag type ' + tagType + ', skipped'
                                                );
                                                // consume the whole tag (skip it)
                                                offset += 11 + dataSize + 4;
                                                continue;
                                            }

                                            var ts2 = _v.getUint8(4);
                                            var ts1 = _v.getUint8(5);
                                            var ts0 = _v.getUint8(6);
                                            var ts3 = _v.getUint8(7);

                                            var timestamp = ts0 | (ts1 << 8) | (ts2 << 16) | (ts3 << 24);

                                            var streamId = _v.getUint32(7, !le) & 0x00ffffff;
                                            if (streamId !== 0) {
                                                _logger2.default.w(this.TAG, 'Meet tag which has StreamID != 0!');
                                            }

                                            var dataOffset = offset + 11;

                                            switch (tagType) {
                                                case 8:
                                                    // Audio
                                                    this._parseAudioData(chunk, dataOffset, dataSize, timestamp);
                                                    break;
                                                case 9:
                                                    // Video
                                                    this._parseVideoData(
                                                        chunk,
                                                        dataOffset,
                                                        dataSize,
                                                        timestamp,
                                                        byteStart + offset
                                                    );
                                                    break;
                                                case 18:
                                                    // ScriptDataObject
                                                    this._parseScriptData(chunk, dataOffset, dataSize);
                                                    break;
                                            }

                                            var prevTagSize = _v.getUint32(11 + dataSize, !le);
                                            if (prevTagSize !== 11 + dataSize) {
                                                _logger2.default.w(this.TAG, 'Invalid PrevTagSize ' + prevTagSize);
                                            }

                                            offset += 11 + dataSize + 4; // tagBody + dataSize + prevTagSize
                                        }

                                        // dispatch parsed frames to consumer (typically, the remuxer)
                                        if (this._isInitialMetadataDispatched()) {
                                            if (
                                                this._dispatch &&
                                                (this._audioTrack.length || this._videoTrack.length)
                                            ) {
                                                this._onDataAvailable(this._audioTrack, this._videoTrack);
                                            }
                                        }

                                        return offset; // consumed bytes, just equals latest offset index
                                    }
                                },
                                {
                                    key: '_parseScriptData',
                                    value: function _parseScriptData(arrayBuffer, dataOffset, dataSize) {
                                        var scriptData = _amfParser2.default.parseScriptData(
                                            arrayBuffer,
                                            dataOffset,
                                            dataSize
                                        );

                                        if (scriptData.hasOwnProperty('onMetaData')) {
                                            if (this._metadata) {
                                                _logger2.default.w(this.TAG, 'Found another onMetaData tag!');
                                            }
                                            this._metadata = scriptData;
                                            var onMetaData = this._metadata.onMetaData;

                                            if (typeof onMetaData.hasAudio === 'boolean') {
                                                // hasAudio
                                                this._hasAudio = onMetaData.hasAudio;
                                                this._mediaInfo.hasAudio = this._hasAudio;
                                            }
                                            if (typeof onMetaData.hasVideo === 'boolean') {
                                                // hasVideo
                                                this._hasVideo = onMetaData.hasVideo;
                                                this._mediaInfo.hasVideo = this._hasVideo;
                                            }
                                            if (typeof onMetaData.audiodatarate === 'number') {
                                                // audiodatarate
                                                this._mediaInfo.audioDataRate = onMetaData.audiodatarate;
                                            }
                                            if (typeof onMetaData.videodatarate === 'number') {
                                                // videodatarate
                                                this._mediaInfo.videoDataRate = onMetaData.videodatarate;
                                            }
                                            if (typeof onMetaData.width === 'number') {
                                                // width
                                                this._mediaInfo.width = onMetaData.width;
                                            }
                                            if (typeof onMetaData.height === 'number') {
                                                // height
                                                this._mediaInfo.height = onMetaData.height;
                                            }
                                            if (typeof onMetaData.duration === 'number') {
                                                // duration
                                                if (!this._durationOverrided) {
                                                    var duration = Math.floor(onMetaData.duration * this._timescale);
                                                    this._duration = duration;
                                                    this._mediaInfo.duration = duration;
                                                }
                                            } else {
                                                this._mediaInfo.duration = 0;
                                            }
                                            if (typeof onMetaData.framerate === 'number') {
                                                // framerate
                                                var fps_num = Math.floor(onMetaData.framerate * 1000);
                                                if (fps_num > 0) {
                                                    var fps = fps_num / 1000;
                                                    this._referenceFrameRate.fixed = true;
                                                    this._referenceFrameRate.fps = fps;
                                                    this._referenceFrameRate.fps_num = fps_num;
                                                    this._referenceFrameRate.fps_den = 1000;
                                                    this._mediaInfo.fps = fps;
                                                }
                                            }
                                            if (_typeof(onMetaData.keyframes) === 'object') {
                                                // keyframes
                                                this._mediaInfo.hasKeyframesIndex = true;
                                                var keyframes = onMetaData.keyframes;
                                                this._mediaInfo.keyframesIndex = this._parseKeyframesIndex(keyframes);
                                                onMetaData.keyframes = null; // keyframes has been extracted, remove it
                                            } else {
                                                this._mediaInfo.hasKeyframesIndex = false;
                                            }
                                            this._dispatch = false;
                                            this._mediaInfo.metadata = onMetaData;
                                            _logger2.default.v(this.TAG, 'Parsed onMetaData');
                                            if (this._mediaInfo.isComplete()) {
                                                this._onMediaInfo(this._mediaInfo);
                                            }
                                        }
                                    }
                                },
                                {
                                    key: '_parseKeyframesIndex',
                                    value: function _parseKeyframesIndex(keyframes) {
                                        var times = [];
                                        var filepositions = [];

                                        // ignore first keyframe which is actually AVC Sequence Header (AVCDecoderConfigurationRecord)
                                        for (var i = 1; i < keyframes.times.length; i++) {
                                            var time = this._timestampBase + Math.floor(keyframes.times[i] * 1000);
                                            times.push(time);
                                            filepositions.push(keyframes.filepositions[i]);
                                        }

                                        return {
                                            times: times,
                                            filepositions: filepositions
                                        };
                                    }
                                },
                                {
                                    key: '_parseAudioData',
                                    value: function _parseAudioData(arrayBuffer, dataOffset, dataSize, tagTimestamp) {
                                        if (dataSize <= 1) {
                                            _logger2.default.w(
                                                this.TAG,
                                                'Flv: Invalid audio packet, missing SoundData payload!'
                                            );
                                            return;
                                        }

                                        var meta = this._audioMetadata;
                                        var track = this._audioTrack;

                                        if (!meta || !meta.codec) {
                                            // initial metadata
                                            meta = this._audioMetadata = {};
                                            meta.type = 'audio';
                                            meta.id = track.id;
                                            meta.timescale = this._timescale;
                                            meta.duration = this._duration;

                                            var le = this._littleEndian;
                                            var v = new DataView(arrayBuffer, dataOffset, dataSize);

                                            var soundSpec = v.getUint8(0);

                                            var soundFormat = soundSpec >>> 4;
                                            if (soundFormat !== 10) {
                                                // AAC
                                                // TODO: support MP3 audio codec
                                                this._onError(
                                                    _demuxErrors2.default.CODEC_UNSUPPORTED,
                                                    'Flv: Unsupported audio codec idx: ' + soundFormat
                                                );
                                                return;
                                            }

                                            var soundRate = 0;
                                            var soundRateIndex = (soundSpec & 12) >>> 2;

                                            var soundRateTable = [5500, 11025, 22050, 44100, 48000];

                                            if (soundRateIndex < soundRateTable.length) {
                                                soundRate = soundRateTable[soundRateIndex];
                                            } else {
                                                this._onError(
                                                    _demuxErrors2.default.FORMAT_ERROR,
                                                    'Flv: Invalid audio sample rate idx: ' + soundRateIndex
                                                );
                                                return;
                                            }

                                            var soundSize = (soundSpec & 2) >>> 1; // unused
                                            var soundType = soundSpec & 1;

                                            meta.audioSampleRate = soundRate;
                                            meta.channelCount = soundType === 0 ? 1 : 2;
                                            meta.refSampleDuration = Math.floor(
                                                (1024 / meta.audioSampleRate) * meta.timescale
                                            );
                                            meta.codec = 'mp4a.40.5';
                                        }

                                        var aacData = this._parseAACAudioData(
                                            arrayBuffer,
                                            dataOffset + 1,
                                            dataSize - 1
                                        );
                                        if (aacData == undefined) {
                                            return;
                                        }

                                        if (aacData.packetType === 0) {
                                            // AAC sequence header (AudioSpecificConfig)
                                            if (meta.config) {
                                                _logger2.default.w(this.TAG, 'Found another AudioSpecificConfig!');
                                            }
                                            var misc = aacData.data;
                                            meta.audioSampleRate = misc.samplingRate;
                                            meta.channelCount = misc.channelCount;
                                            meta.codec = misc.codec;
                                            meta.config = misc.config;
                                            // The decode result of an aac sample is 1024 PCM samples
                                            meta.refSampleDuration = Math.floor(
                                                (1024 / meta.audioSampleRate) * meta.timescale
                                            );
                                            _logger2.default.v(this.TAG, 'Parsed AudioSpecificConfig');

                                            if (this._isInitialMetadataDispatched()) {
                                                // Non-initial metadata, force dispatch (or flush) parsed frames to remuxer
                                                if (
                                                    this._dispatch &&
                                                    (this._audioTrack.length || this._videoTrack.length)
                                                ) {
                                                    this._onDataAvailable(this._audioTrack, this._videoTrack);
                                                }
                                            } else {
                                                this._audioInitialMetadataDispatched = true;
                                            }
                                            // then notify new metadata
                                            this._dispatch = false;
                                            this._onTrackMetadata('audio', meta);

                                            var mi = this._mediaInfo;
                                            mi.audioCodec = 'mp4a.40.' + misc.originalAudioObjectType;
                                            mi.audioSampleRate = meta.audioSampleRate;
                                            mi.audioChannelCount = meta.channelCount;
                                            if (mi.hasVideo) {
                                                if (mi.videoCodec != null) {
                                                    mi.mimeType =
                                                        'video/x-flv; codecs="' +
                                                        mi.videoCodec +
                                                        ',' +
                                                        mi.audioCodec +
                                                        '"';
                                                }
                                            } else {
                                                mi.mimeType = 'video/x-flv; codecs="' + mi.audioCodec + '"';
                                            }
                                            if (mi.isComplete()) {
                                                this._onMediaInfo(mi);
                                            }
                                            return;
                                        } else if (aacData.packetType === 1) {
                                            // AAC raw frame data
                                            var dts = this._timestampBase + tagTimestamp;
                                            var aacSample = { unit: aacData.data, dts: dts, pts: dts };
                                            track.samples.push(aacSample);
                                            track.length += aacData.data.length;
                                        } else {
                                            _logger2.default.e(
                                                this.TAG,
                                                'Flv: Unsupported AAC data type ' + aacData.packetType
                                            );
                                        }
                                    }
                                },
                                {
                                    key: '_parseAACAudioData',
                                    value: function _parseAACAudioData(arrayBuffer, dataOffset, dataSize) {
                                        if (dataSize <= 1) {
                                            _logger2.default.w(
                                                this.TAG,
                                                'Flv: Invalid AAC packet, missing AACPacketType or/and Data!'
                                            );
                                            return;
                                        }

                                        var result = {};
                                        var array = new Uint8Array(arrayBuffer, dataOffset, dataSize);

                                        result.packetType = array[0];

                                        if (array[0] === 0) {
                                            result.data = this._parseAACAudioSpecificConfig(
                                                arrayBuffer,
                                                dataOffset + 1,
                                                dataSize - 1
                                            );
                                        } else {
                                            result.data = array.subarray(1);
                                        }

                                        return result;
                                    }
                                },
                                {
                                    key: '_parseAACAudioSpecificConfig',
                                    value: function _parseAACAudioSpecificConfig(arrayBuffer, dataOffset, dataSize) {
                                        var array = new Uint8Array(arrayBuffer, dataOffset, dataSize);
                                        var config = null;

                                        var mpegSamplingRates = [
                                            96000,
                                            88200,
                                            64000,
                                            48000,
                                            44100,
                                            32000,
                                            24000,
                                            22050,
                                            16000,
                                            12000,
                                            11025,
                                            8000,
                                            7350
                                        ];

                                        /* Audio Object Type:
               0: Null
               1: AAC Main
               2: AAC LC
               3: AAC SSR (Scalable Sample Rate)
               4: AAC LTP (Long Term Prediction)
               5: HE-AAC / SBR (Spectral Band Replication)
               6: AAC Scalable
            */

                                        var audioObjectType = 0;
                                        var originalAudioObjectType = 0;
                                        var audioExtensionObjectType = null;
                                        var samplingIndex = 0;
                                        var extensionSamplingIndex = null;

                                        // 5 bits
                                        audioObjectType = originalAudioObjectType = array[0] >>> 3;
                                        // 4 bits
                                        samplingIndex = ((array[0] & 0x07) << 1) | (array[1] >>> 7);
                                        if (samplingIndex < 0 || samplingIndex >= mpegSamplingRates.length) {
                                            this._onError(
                                                _demuxErrors2.default.FORMAT_ERROR,
                                                'Flv: AAC invalid sampling frequency index!'
                                            );
                                            return;
                                        }

                                        var samplingFrequence = mpegSamplingRates[samplingIndex];

                                        // 4 bits
                                        var channelConfig = (array[1] & 0x78) >>> 3;
                                        if (channelConfig < 0 || channelConfig >= 8) {
                                            this._onError(
                                                _demuxErrors2.default.FORMAT_ERROR,
                                                'Flv: AAC invalid channel configuration'
                                            );
                                            return;
                                        }

                                        if (audioObjectType === 5) {
                                            // HE-AAC?
                                            // 4 bits
                                            extensionSamplingIndex = ((array[1] & 0x07) << 1) | (array[2] >>> 7);
                                            // 5 bits
                                            audioExtensionObjectType = (array[2] & 0x7c) >>> 2;
                                        }

                                        // workarounds for various browsers
                                        var userAgent = self.navigator.userAgent.toLowerCase();

                                        if (userAgent.indexOf('firefox') !== -1) {
                                            // firefox: use SBR (HE-AAC) if freq less than 24kHz
                                            if (samplingIndex >= 6) {
                                                audioObjectType = 5;
                                                config = new Array(4);
                                                extensionSamplingIndex = samplingIndex - 3;
                                            } else {
                                                // use LC-AAC
                                                audioObjectType = 2;
                                                config = new Array(2);
                                                extensionSamplingIndex = samplingIndex;
                                            }
                                        } else if (userAgent.indexOf('android') !== -1) {
                                            // android: always use LC-AAC
                                            audioObjectType = 2;
                                            config = new Array(2);
                                            extensionSamplingIndex = samplingIndex;
                                        } else {
                                            // for other browsers, e.g. chrome...
                                            // Always use HE-AAC to make it easier to switch aac codec profile
                                            audioObjectType = 5;
                                            extensionSamplingIndex = samplingIndex;
                                            config = new Array(4);

                                            if (samplingIndex >= 6) {
                                                extensionSamplingIndex = samplingIndex - 3;
                                            } else if (channelConfig === 1) {
                                                // Mono channel
                                                audioObjectType = 2;
                                                config = new Array(2);
                                                extensionSamplingIndex = samplingIndex;
                                            }
                                        }

                                        config[0] = audioObjectType << 3;
                                        config[0] |= (samplingIndex & 0x0f) >>> 1;
                                        config[1] = (samplingIndex & 0x0f) << 7;
                                        config[1] |= (channelConfig & 0x0f) << 3;
                                        if (audioObjectType === 5) {
                                            config[1] |= (extensionSamplingIndex & 0x0f) >>> 1;
                                            config[2] = (extensionSamplingIndex & 0x01) << 7;
                                            // extended audio object type: force to 2 (LC-AAC)
                                            config[2] |= 2 << 2;
                                            config[3] = 0;
                                        }

                                        return {
                                            config: config,
                                            samplingRate: samplingFrequence,
                                            channelCount: channelConfig,
                                            codec: 'mp4a.40.' + audioObjectType,
                                            originalAudioObjectType: originalAudioObjectType
                                        };
                                    }
                                },
                                {
                                    key: '_parseVideoData',
                                    value: function _parseVideoData(
                                        arrayBuffer,
                                        dataOffset,
                                        dataSize,
                                        tagTimestamp,
                                        tagPosition
                                    ) {
                                        if (dataSize <= 1) {
                                            _logger2.default.w(
                                                this.TAG,
                                                'Flv: Invalid video packet, missing VideoData payload!'
                                            );
                                            return;
                                        }

                                        var spec = new Uint8Array(arrayBuffer, dataOffset, dataSize)[0];

                                        var frameType = (spec & 240) >>> 4;
                                        var codecId = spec & 15;

                                        if (codecId !== 7) {
                                            this._onError(
                                                _demuxErrors2.default.CODEC_UNSUPPORTED,
                                                'Flv: Unsupported codec in video frame: ' + codecId
                                            );
                                            return;
                                        }

                                        this._parseAVCVideoPacket(
                                            arrayBuffer,
                                            dataOffset + 1,
                                            dataSize - 1,
                                            tagTimestamp,
                                            tagPosition,
                                            frameType
                                        );
                                    }
                                },
                                {
                                    key: '_parseAVCVideoPacket',
                                    value: function _parseAVCVideoPacket(
                                        arrayBuffer,
                                        dataOffset,
                                        dataSize,
                                        tagTimestamp,
                                        tagPosition,
                                        frameType
                                    ) {
                                        if (dataSize < 4) {
                                            _logger2.default.w(
                                                this.TAG,
                                                'Flv: Invalid AVC packet, missing AVCPacketType or/and CompositionTime'
                                            );
                                            return;
                                        }

                                        var le = this._littleEndian;
                                        var v = new DataView(arrayBuffer, dataOffset, dataSize);

                                        var packetType = v.getUint8(0);
                                        var cts = v.getUint32(0, !le) & 0x00ffffff;

                                        if (packetType === 0) {
                                            // AVCDecoderConfigurationRecord
                                            this._parseAVCDecoderConfigurationRecord(
                                                arrayBuffer,
                                                dataOffset + 4,
                                                dataSize - 4
                                            );
                                        } else if (packetType === 1) {
                                            // One or more Nalus
                                            this._parseAVCVideoData(
                                                arrayBuffer,
                                                dataOffset + 4,
                                                dataSize - 4,
                                                tagTimestamp,
                                                tagPosition,
                                                frameType,
                                                cts
                                            );
                                        } else if (packetType === 2) {
                                            // empty, AVC end of sequence
                                        } else {
                                            this._onError(
                                                _demuxErrors2.default.FORMAT_ERROR,
                                                'Flv: Invalid video packet type ' + packetType
                                            );
                                            return;
                                        }
                                    }
                                },
                                {
                                    key: '_parseAVCDecoderConfigurationRecord',
                                    value: function _parseAVCDecoderConfigurationRecord(
                                        arrayBuffer,
                                        dataOffset,
                                        dataSize
                                    ) {
                                        if (dataSize < 7) {
                                            _logger2.default.w(
                                                this.TAG,
                                                'Flv: Invalid AVCDecoderConfigurationRecord, lack of data!'
                                            );
                                            return;
                                        }

                                        var meta = this._videoMetadata;
                                        var track = this._videoTrack;
                                        var le = this._littleEndian;
                                        var v = new DataView(arrayBuffer, dataOffset, dataSize);

                                        if (!meta) {
                                            meta = this._videoMetadata = {};
                                            meta.type = 'video';
                                            meta.id = track.id;
                                            meta.timescale = this._timescale;
                                            meta.duration = this._duration;
                                        } else {
                                            if (typeof meta.avcc !== 'undefined') {
                                                _logger2.default.w(
                                                    this.TAG,
                                                    'Found another AVCDecoderConfigurationRecord!'
                                                );
                                            }
                                        }

                                        var version = v.getUint8(0); // configurationVersion
                                        var avcProfile = v.getUint8(1); // avcProfileIndication
                                        var profileCompatibility = v.getUint8(2); // profile_compatibility
                                        var avcLevel = v.getUint8(3); // AVCLevelIndication

                                        if (version !== 1 || avcProfile === 0) {
                                            this._onError(
                                                _demuxErrors2.default.FORMAT_ERROR,
                                                'Flv: Invalid AVCDecoderConfigurationRecord'
                                            );
                                            return;
                                        }

                                        this._naluLengthSize = (v.getUint8(4) & 3) + 1; // lengthSizeMinusOne
                                        if (this._naluLengthSize !== 3 && this._naluLengthSize !== 4) {
                                            // holy shit!!!
                                            this._onError(
                                                _demuxErrors2.default.FORMAT_ERROR,
                                                'Flv: Strange NaluLengthSizeMinusOne: ' + (this._naluLengthSize - 1)
                                            );
                                            return;
                                        }

                                        var spsCount = v.getUint8(5) & 31; // numOfSequenceParameterSets
                                        if (spsCount === 0 || spsCount > 1) {
                                            this._onError(
                                                _demuxErrors2.default.FORMAT_ERROR,
                                                'Flv: Invalid H264 SPS count: ' + spsCount
                                            );
                                            return;
                                        }

                                        var offset = 6;

                                        for (var i = 0; i < spsCount; i++) {
                                            var len = v.getUint16(offset, !le); // sequenceParameterSetLength
                                            offset += 2;

                                            if (len === 0) {
                                                continue;
                                            }

                                            // Notice: Nalu without startcode header (00 00 00 01)
                                            var sps = new Uint8Array(arrayBuffer, dataOffset + offset, len);
                                            offset += len;

                                            var config = _spsParser2.default.parseSPS(sps);
                                            meta.codecWidth = config.codec_size.width;
                                            meta.codecHeight = config.codec_size.height;
                                            meta.presentWidth = config.present_size.width;
                                            meta.presentHeight = config.present_size.height;

                                            meta.profile = config.profile_string;
                                            meta.level = config.level_string;
                                            meta.bitDepth = config.bit_depth;
                                            meta.chromaFormat = config.chroma_format;
                                            meta.sarRatio = config.sar_ratio;
                                            meta.frameRate = config.frame_rate;

                                            if (
                                                config.frame_rate.fixed === false ||
                                                config.frame_rate.fps_num === 0 ||
                                                config.frame_rate.fps_den === 0
                                            ) {
                                                meta.frameRate = this._referenceFrameRate;
                                            }

                                            var fps_den = meta.frameRate.fps_den;
                                            var fps_num = meta.frameRate.fps_num;
                                            meta.refSampleDuration = Math.floor(meta.timescale * (fps_den / fps_num));

                                            var codecArray = sps.subarray(1, 4);
                                            var codecString = 'avc1.';
                                            for (var j = 0; j < 3; j++) {
                                                var h = codecArray[j].toString(16);
                                                if (h.length < 2) {
                                                    h = '0' + h;
                                                }
                                                codecString += h;
                                            }
                                            meta.codec = codecString;

                                            var mi = this._mediaInfo;
                                            mi.width = meta.codecWidth;
                                            mi.height = meta.codecHeight;
                                            mi.fps = meta.frameRate.fps;
                                            mi.profile = meta.profile;
                                            mi.level = meta.level;
                                            mi.chromaFormat = config.chroma_format_string;
                                            mi.sarNum = meta.sarRatio.width;
                                            mi.sarDen = meta.sarRatio.height;
                                            mi.videoCodec = codecString;

                                            if (mi.hasAudio) {
                                                if (mi.audioCodec != null) {
                                                    mi.mimeType =
                                                        'video/x-flv; codecs="' +
                                                        mi.videoCodec +
                                                        ',' +
                                                        mi.audioCodec +
                                                        '"';
                                                }
                                            } else {
                                                mi.mimeType = 'video/x-flv; codecs="' + mi.videoCodec + '"';
                                            }
                                            if (mi.isComplete()) {
                                                this._onMediaInfo(mi);
                                            }
                                        }

                                        var ppsCount = v.getUint8(offset); // numOfPictureParameterSets
                                        if (ppsCount === 0 || ppsCount > 1) {
                                            this._onError(
                                                _demuxErrors2.default.FORMAT_ERROR,
                                                'Flv: Invalid H264 PPS count: ' + ppsCount
                                            );
                                            return;
                                        }

                                        offset++;

                                        for (var _i = 0; _i < ppsCount; _i++) {
                                            var _len = v.getUint16(offset, !le); // pictureParameterSetLength
                                            offset += 2;

                                            if (_len === 0) {
                                                continue;
                                            }

                                            // pps is useless for extracting video information
                                            offset += _len;
                                        }

                                        meta.avcc = new Uint8Array(dataSize);
                                        meta.avcc.set(new Uint8Array(arrayBuffer, dataOffset, dataSize), 0);
                                        _logger2.default.v(this.TAG, 'Parsed AVCDecoderConfigurationRecord');

                                        if (this._isInitialMetadataDispatched()) {
                                            // flush parsed frames
                                            if (
                                                this._dispatch &&
                                                (this._audioTrack.length || this._videoTrack.length)
                                            ) {
                                                this._onDataAvailable(this._audioTrack, this._videoTrack);
                                            }
                                        } else {
                                            this._videoInitialMetadataDispatched = true;
                                        }
                                        // notify new metadata
                                        this._dispatch = false;
                                        this._onTrackMetadata('video', meta);
                                    }
                                },
                                {
                                    key: '_parseAVCVideoData',
                                    value: function _parseAVCVideoData(
                                        arrayBuffer,
                                        dataOffset,
                                        dataSize,
                                        tagTimestamp,
                                        tagPosition,
                                        frameType,
                                        cts
                                    ) {
                                        var le = this._littleEndian;
                                        var v = new DataView(arrayBuffer, dataOffset, dataSize);

                                        var units = [],
                                            length = 0;

                                        var offset = 0;
                                        var lengthSize = this._naluLengthSize;
                                        var dts = this._timestampBase + tagTimestamp;
                                        var keyframe = frameType === 1; // from FLV Frame Type constants

                                        while (offset < dataSize) {
                                            if (offset + 4 >= dataSize) {
                                                _logger2.default.w(
                                                    this.TAG,
                                                    'Malformed Nalu near timestamp ' +
                                                        dts +
                                                        ', offset = ' +
                                                        offset +
                                                        ', dataSize = ' +
                                                        dataSize
                                                );
                                                break; // data not enough for next Nalu
                                            }
                                            // Nalu with length-header (AVC1)
                                            var naluSize = v.getUint32(offset, !le); // Big-Endian read
                                            if (lengthSize === 3) {
                                                naluSize >>>= 8;
                                            }
                                            if (naluSize > dataSize - lengthSize) {
                                                _logger2.default.w(
                                                    this.TAG,
                                                    'Malformed Nalus near timestamp ' + dts + ', NaluSize > DataSize!'
                                                );
                                                return;
                                            }

                                            var unitType = v.getUint8(offset + lengthSize) & 0x1f;

                                            if (unitType === 5) {
                                                // IDR
                                                keyframe = true;
                                            }

                                            var data = new Uint8Array(
                                                arrayBuffer,
                                                dataOffset + offset,
                                                lengthSize + naluSize
                                            );
                                            var unit = { type: unitType, data: data };
                                            units.push(unit);
                                            length += data.byteLength;

                                            offset += lengthSize + naluSize;
                                        }

                                        if (units.length) {
                                            var track = this._videoTrack;
                                            var avcSample = {
                                                units: units,
                                                length: length,
                                                isKeyframe: keyframe,
                                                dts: dts,
                                                cts: cts,
                                                pts: dts + cts
                                            };
                                            if (keyframe) {
                                                avcSample.fileposition = tagPosition;
                                            }
                                            track.samples.push(avcSample);
                                            track.length += length;
                                        }
                                    }
                                },
                                {
                                    key: 'onTrackMetadata',
                                    get: function get() {
                                        return this._onTrackMetadata;
                                    },
                                    set: function set(callback) {
                                        this._onTrackMetadata = callback;
                                    }

                                    // prototype: function(mediaInfo: MediaInfo): void
                                },
                                {
                                    key: 'onMediaInfo',
                                    get: function get() {
                                        return this._onMediaInfo;
                                    },
                                    set: function set(callback) {
                                        this._onMediaInfo = callback;
                                    }

                                    // prototype: function(type: number, info: string): void
                                },
                                {
                                    key: 'onError',
                                    get: function get() {
                                        return this._onError;
                                    },
                                    set: function set(callback) {
                                        this._onError = callback;
                                    }

                                    // prototype: function(videoTrack: any, audioTrack: any): void
                                },
                                {
                                    key: 'onDataAvailable',
                                    get: function get() {
                                        return this._onDataAvailable;
                                    },
                                    set: function set(callback) {
                                        this._onDataAvailable = callback;
                                    }

                                    // timestamp base for output samples, must be in milliseconds
                                },
                                {
                                    key: 'timestampBase',
                                    get: function get() {
                                        return this._timestampBase;
                                    },
                                    set: function set(base) {
                                        this._timestampBase = base;
                                    }
                                },
                                {
                                    key: 'overridedDuration',
                                    get: function get() {
                                        return this._duration;
                                    },

                                    // Force-override media duration. Must be in milliseconds, int32
                                    set: function set(duration) {
                                        this._durationOverrided = true;
                                        this._duration = duration;
                                        this._mediaInfo.duration = duration;
                                    }
                                }
                            ],
                            [
                                {
                                    key: 'probe',
                                    value: function probe(buffer) {
                                        var data = new Uint8Array(buffer);
                                        var mismatch = { match: false };

                                        if (
                                            data[0] !== 0x46 ||
                                            data[1] !== 0x4c ||
                                            data[2] !== 0x56 ||
                                            data[3] !== 0x01
                                        ) {
                                            return mismatch;
                                        }

                                        var hasAudio = (data[4] & 4) >>> 2 !== 0;
                                        var hasVideo = (data[4] & 1) !== 0;

                                        if (!hasAudio && !hasVideo) {
                                            return mismatch;
                                        }

                                        var offset = ReadBig32(data, 5);

                                        if (offset < 9) {
                                            return mismatch;
                                        }

                                        return {
                                            match: true,
                                            consumed: offset,
                                            dataOffset: offset,
                                            hasAudioTrack: hasAudio,
                                            hasVideoTrack: hasVideo
                                        };
                                    }
                                }
                            ]
                        );

                        return FLVDemuxer;
                    })();

                    exports.default = FLVDemuxer;
                },
                {
                    '../core/media-info.js': 7,
                    '../utils/exception.js': 40,
                    '../utils/logger.js': 41,
                    './amf-parser.js': 15,
                    './demux-errors.js': 16,
                    './sps-parser.js': 19
                }
            ],
            19: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var _expGolomb = _dereq_('./exp-golomb.js');

                    var _expGolomb2 = _interopRequireDefault(_expGolomb);

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    var SPSParser = (function () {
                        function SPSParser() {
                            _classCallCheck(this, SPSParser);
                        }

                        _createClass(SPSParser, null, [
                            {
                                key: '_ebsp2rbsp',
                                value: function _ebsp2rbsp(uint8array) {
                                    var src = uint8array;
                                    var src_length = src.byteLength;
                                    var dst = new Uint8Array(src_length);
                                    var dst_idx = 0;

                                    for (var i = 0; i < src_length; i++) {
                                        if (i >= 2) {
                                            // Unescape: Skip 0x03 after 00 00
                                            if (src[i] === 0x03 && src[i - 1] === 0x00 && src[i - 2] === 0x00) {
                                                continue;
                                            }
                                        }
                                        dst[dst_idx] = src[i];
                                        dst_idx++;
                                    }

                                    return new Uint8Array(dst.buffer, 0, dst_idx);
                                }
                            },
                            {
                                key: 'parseSPS',
                                value: function parseSPS(uint8array) {
                                    var rbsp = SPSParser._ebsp2rbsp(uint8array);
                                    var gb = new _expGolomb2.default(rbsp);

                                    gb.readByte();
                                    var profile_idc = gb.readByte(); // profile_idc
                                    gb.readByte(); // constraint_set_flags[5] + reserved_zero[3]
                                    var level_idc = gb.readByte(); // level_idc
                                    gb.readUEG(); // seq_parameter_set_id

                                    var profile_string = SPSParser.getProfileString(profile_idc);
                                    var level_string = SPSParser.getLevelString(level_idc);
                                    var chroma_format_idc = 1;
                                    var chroma_format = 420;
                                    var chroma_format_table = [0, 420, 422, 444];
                                    var bit_depth = 8;

                                    if (
                                        profile_idc === 100 ||
                                        profile_idc === 110 ||
                                        profile_idc === 122 ||
                                        profile_idc === 244 ||
                                        profile_idc === 44 ||
                                        profile_idc === 83 ||
                                        profile_idc === 86 ||
                                        profile_idc === 118 ||
                                        profile_idc === 128 ||
                                        profile_idc === 138 ||
                                        profile_idc === 144
                                    ) {
                                        chroma_format_idc = gb.readUEG();
                                        if (chroma_format_idc === 3) {
                                            gb.readBits(1); // separate_colour_plane_flag
                                        }
                                        if (chroma_format_idc <= 3) {
                                            chroma_format = chroma_format_table[chroma_format_idc];
                                        }

                                        bit_depth = gb.readUEG() + 8; // bit_depth_luma_minus8
                                        gb.readUEG(); // bit_depth_chroma_minus8
                                        gb.readBits(1); // qpprime_y_zero_transform_bypass_flag
                                        if (gb.readBool()) {
                                            // seq_scaling_matrix_present_flag
                                            var scaling_list_count = chroma_format_idc !== 3 ? 8 : 12;
                                            for (var i = 0; i < scaling_list_count; i++) {
                                                if (gb.readBool()) {
                                                    // seq_scaling_list_present_flag
                                                    if (i < 6) {
                                                        SPSParser._skipScalingList(gb, 16);
                                                    } else {
                                                        SPSParser._skipScalingList(gb, 64);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    gb.readUEG(); // log2_max_frame_num_minus4
                                    var pic_order_cnt_type = gb.readUEG();
                                    if (pic_order_cnt_type === 0) {
                                        gb.readUEG(); // log2_max_pic_order_cnt_lsb_minus_4
                                    } else if (pic_order_cnt_type === 1) {
                                        gb.readBits(1); // delta_pic_order_always_zero_flag
                                        gb.readSEG(); // offset_for_non_ref_pic
                                        gb.readSEG(); // offset_for_top_to_bottom_field
                                        var num_ref_frames_in_pic_order_cnt_cycle = gb.readUEG();
                                        for (var _i = 0; _i < num_ref_frames_in_pic_order_cnt_cycle; _i++) {
                                            gb.readSEG(); // offset_for_ref_frame
                                        }
                                    }
                                    gb.readUEG(); // max_num_ref_frames
                                    gb.readBits(1); // gaps_in_frame_num_value_allowed_flag

                                    var pic_width_in_mbs_minus1 = gb.readUEG();
                                    var pic_height_in_map_units_minus1 = gb.readUEG();

                                    var frame_mbs_only_flag = gb.readBits(1);
                                    if (frame_mbs_only_flag === 0) {
                                        gb.readBits(1); // mb_adaptive_frame_field_flag
                                    }
                                    gb.readBits(1); // direct_8x8_inference_flag

                                    var frame_crop_left_offset = 0;
                                    var frame_crop_right_offset = 0;
                                    var frame_crop_top_offset = 0;
                                    var frame_crop_bottom_offset = 0;

                                    var frame_cropping_flag = gb.readBool();
                                    if (frame_cropping_flag) {
                                        frame_crop_left_offset = gb.readUEG();
                                        frame_crop_right_offset = gb.readUEG();
                                        frame_crop_top_offset = gb.readUEG();
                                        frame_crop_bottom_offset = gb.readUEG();
                                    }

                                    var sar_width = 1,
                                        sar_height = 1;
                                    var fps = 0,
                                        fps_fixed = true,
                                        fps_num = 0,
                                        fps_den = 0;

                                    var vui_parameters_present_flag = gb.readBool();
                                    if (vui_parameters_present_flag) {
                                        if (gb.readBool()) {
                                            // aspect_ratio_info_present_flag
                                            var aspect_ratio_idc = gb.readByte();
                                            var sar_w_table = [
                                                1,
                                                12,
                                                10,
                                                16,
                                                40,
                                                24,
                                                20,
                                                32,
                                                80,
                                                18,
                                                15,
                                                64,
                                                160,
                                                4,
                                                3,
                                                2
                                            ];
                                            var sar_h_table = [
                                                1,
                                                11,
                                                11,
                                                11,
                                                33,
                                                11,
                                                11,
                                                11,
                                                33,
                                                11,
                                                11,
                                                33,
                                                99,
                                                3,
                                                2,
                                                1
                                            ];

                                            if (aspect_ratio_idc > 0 && aspect_ratio_idc < 16) {
                                                sar_width = sar_w_table[aspect_ratio_idc - 1];
                                                sar_height = sar_h_table[aspect_ratio_idc - 1];
                                            } else if (aspect_ratio_idc === 255) {
                                                sar_width = (gb.readByte() << 8) | gb.readByte();
                                                sar_height = (gb.readByte() << 8) | gb.readByte();
                                            }
                                        }

                                        if (gb.readBool()) {
                                            // overscan_info_present_flag
                                            gb.readBool(); // overscan_appropriate_flag
                                        }
                                        if (gb.readBool()) {
                                            // video_signal_type_present_flag
                                            gb.readBits(4); // video_format & video_full_range_flag
                                            if (gb.readBool()) {
                                                // colour_description_present_flag
                                                gb.readBits(24); // colour_primaries & transfer_characteristics & matrix_coefficients
                                            }
                                        }
                                        if (gb.readBool()) {
                                            // chroma_loc_info_present_flag
                                            gb.readUEG(); // chroma_sample_loc_type_top_field
                                            gb.readUEG(); // chroma_sample_loc_type_bottom_field
                                        }
                                        if (gb.readBool()) {
                                            // timing_info_present_flag
                                            var num_units_in_tick = gb.readBits(32);
                                            var time_scale = gb.readBits(32);
                                            fps_fixed = gb.readBool(); // fixed_frame_rate_flag

                                            fps_num = time_scale;
                                            fps_den = num_units_in_tick * 2;
                                            fps = fps_num / fps_den;
                                        }
                                    }

                                    var sarScale = 1;
                                    if (sar_width !== 1 || sar_height !== 1) {
                                        sarScale = sar_width / sar_height;
                                    }

                                    var crop_unit_x = 0,
                                        crop_unit_y = 0;
                                    if (chroma_format_idc === 0) {
                                        crop_unit_x = 1;
                                        crop_unit_y = 2 - frame_mbs_only_flag;
                                    } else {
                                        var sub_wc = chroma_format_idc === 3 ? 1 : 2;
                                        var sub_hc = chroma_format_idc === 1 ? 2 : 1;
                                        crop_unit_x = sub_wc;
                                        crop_unit_y = sub_hc * (2 - frame_mbs_only_flag);
                                    }

                                    var codec_width = (pic_width_in_mbs_minus1 + 1) * 16;
                                    var codec_height =
                                        (2 - frame_mbs_only_flag) * ((pic_height_in_map_units_minus1 + 1) * 16);

                                    codec_width -= (frame_crop_left_offset + frame_crop_right_offset) * crop_unit_x;
                                    codec_height -= (frame_crop_top_offset + frame_crop_bottom_offset) * crop_unit_y;

                                    var present_width = Math.ceil(codec_width * sarScale);

                                    gb.destroy();
                                    gb = null;

                                    return {
                                        profile_string: profile_string, // baseline, high, high10, ...
                                        level_string: level_string, // 3, 3.1, 4, 4.1, 5, 5.1, ...
                                        bit_depth: bit_depth, // 8bit, 10bit, ...
                                        chroma_format: chroma_format, // 4:2:0, 4:2:2, ...
                                        chroma_format_string: SPSParser.getChromaFormatString(chroma_format),

                                        frame_rate: {
                                            fixed: fps_fixed,
                                            fps: fps,
                                            fps_den: fps_den,
                                            fps_num: fps_num
                                        },

                                        sar_ratio: {
                                            width: sar_width,
                                            height: sar_height
                                        },

                                        codec_size: {
                                            width: codec_width,
                                            height: codec_height
                                        },

                                        present_size: {
                                            width: present_width,
                                            height: codec_height
                                        }
                                    };
                                }
                            },
                            {
                                key: '_skipScalingList',
                                value: function _skipScalingList(gb, count) {
                                    var last_scale = 8,
                                        next_scale = 8;
                                    var delta_scale = 0;
                                    for (var i = 0; i < count; i++) {
                                        if (next_scale !== 0) {
                                            delta_scale = gb.readSEG();
                                            next_scale = (last_scale + delta_scale + 256) % 256;
                                        }
                                        last_scale = next_scale === 0 ? last_scale : next_scale;
                                    }
                                }
                            },
                            {
                                key: 'getProfileString',
                                value: function getProfileString(profile_idc) {
                                    switch (profile_idc) {
                                        case 66:
                                            return 'Baseline';
                                        case 77:
                                            return 'Main';
                                        case 88:
                                            return 'Extended';
                                        case 100:
                                            return 'High';
                                        case 110:
                                            return 'High10';
                                        case 122:
                                            return 'High422';
                                        case 244:
                                            return 'High444';
                                        default:
                                            return 'Unknown';
                                    }
                                }
                            },
                            {
                                key: 'getLevelString',
                                value: function getLevelString(level_idc) {
                                    return (level_idc / 10).toFixed(1);
                                }
                            },
                            {
                                key: 'getChromaFormatString',
                                value: function getChromaFormatString(chroma) {
                                    switch (chroma) {
                                        case 420:
                                            return '4:2:0';
                                        case 422:
                                            return '4:2:2';
                                        case 444:
                                            return '4:4:4';
                                        default:
                                            return 'Unknown';
                                    }
                                }
                            }
                        ]);

                        return SPSParser;
                    })();

                    exports.default = SPSParser;
                },
                { './exp-golomb.js': 17 }
            ],
            20: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _typeof =
                        typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
                            ? function (obj) {
                                  return typeof obj;
                              }
                            : function (obj) {
                                  return obj &&
                                      typeof Symbol === 'function' &&
                                      obj.constructor === Symbol &&
                                      obj !== Symbol.prototype
                                      ? 'symbol'
                                      : typeof obj;
                              };
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var _polyfill = _dereq_('./utils/polyfill.js');

                    var _polyfill2 = _interopRequireDefault(_polyfill);

                    var _features = _dereq_('./core/features.js');

                    var _features2 = _interopRequireDefault(_features);

                    var _flvPlayer = _dereq_('./player/flv-player.js');

                    var _flvPlayer2 = _interopRequireDefault(_flvPlayer);

                    var _nativePlayer = _dereq_('./player/native-player.js');

                    var _nativePlayer2 = _interopRequireDefault(_nativePlayer);

                    var _playerEvents = _dereq_('./player/player-events.js');

                    var _playerEvents2 = _interopRequireDefault(_playerEvents);

                    var _playerErrors = _dereq_('./player/player-errors.js');

                    var _loggingControl = _dereq_('./utils/logging-control.js');

                    var _loggingControl2 = _interopRequireDefault(_loggingControl);

                    var _exception = _dereq_('./utils/exception.js');

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    // here are all the interfaces

                    // install polyfills
                    _polyfill2.default.install();

                    // factory method
                    function createPlayer(mediaDataSource, optionalConfig) {
                        var mds = mediaDataSource;
                        if (mds == null || (typeof mds === 'undefined' ? 'undefined' : _typeof(mds)) !== 'object') {
                            throw new _exception.InvalidArgumentException(
                                'MediaDataSource must be an javascript object!'
                            );
                        }

                        if (!mds.hasOwnProperty('type')) {
                            throw new _exception.InvalidArgumentException(
                                'MediaDataSource must has type field to indicate video file type!'
                            );
                        }

                        switch (mds.type) {
                            case 'flv':
                                return new _flvPlayer2.default(mds, optionalConfig);
                            default:
                                return new _nativePlayer2.default(mds, optionalConfig);
                        }
                    }

                    // feature detection
                    function isSupported() {
                        return _features2.default.supportMSEH264Playback();
                    }

                    function getFeatureList() {
                        return _features2.default.getFeatureList();
                    }

                    // interfaces
                    var flvjs = {};

                    flvjs.createPlayer = createPlayer;
                    flvjs.isSupported = isSupported;
                    flvjs.getFeatureList = getFeatureList;

                    flvjs.Events = _playerEvents2.default;
                    flvjs.ErrorTypes = _playerErrors.ErrorTypes;
                    flvjs.ErrorDetails = _playerErrors.ErrorDetails;

                    flvjs.FlvPlayer = _flvPlayer2.default;
                    flvjs.NativePlayer = _nativePlayer2.default;
                    flvjs.LoggingControl = _loggingControl2.default;

                    Object.defineProperty(flvjs, 'version', {
                        enumerable: true,
                        get: function get() {
                            // replaced by browserify-versionify transform
                            return '1.1.0';
                        }
                    });

                    exports.default = flvjs;
                },
                {
                    './core/features.js': 6,
                    './player/flv-player.js': 32,
                    './player/native-player.js': 33,
                    './player/player-errors.js': 34,
                    './player/player-events.js': 35,
                    './utils/exception.js': 40,
                    './utils/logging-control.js': 42,
                    './utils/polyfill.js': 43
                }
            ],
            21: [
                function (_dereq_, module, exports) {
                    'use strict';

                    // entry/index file

                    // make it compatible with browserify's umd wrapper
                    module.exports = _dereq_('./flv.js').default;
                },
                { './flv.js': 20 }
            ],
            22: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _typeof =
                        typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
                            ? function (obj) {
                                  return typeof obj;
                              }
                            : function (obj) {
                                  return obj &&
                                      typeof Symbol === 'function' &&
                                      obj.constructor === Symbol &&
                                      obj !== Symbol.prototype
                                      ? 'symbol'
                                      : typeof obj;
                              };

                    var _get = function get(object, property, receiver) {
                        if (object === null) object = Function.prototype;
                        var desc = Object.getOwnPropertyDescriptor(object, property);
                        if (desc === undefined) {
                            var parent = Object.getPrototypeOf(object);
                            if (parent === null) {
                                return undefined;
                            } else {
                                return get(parent, property, receiver);
                            }
                        } else if ('value' in desc) {
                            return desc.value;
                        } else {
                            var getter = desc.get;
                            if (getter === undefined) {
                                return undefined;
                            }
                            return getter.call(receiver);
                        }
                    };

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();

                    var _logger = _dereq_('../utils/logger.js');

                    var _logger2 = _interopRequireDefault(_logger);

                    var _browser = _dereq_('../utils/browser.js');

                    var _browser2 = _interopRequireDefault(_browser);

                    var _loader = _dereq_('./loader.js');

                    var _exception = _dereq_('../utils/exception.js');

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    function _possibleConstructorReturn(self, call) {
                        if (!self) {
                            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                        }
                        return call && (typeof call === 'object' || typeof call === 'function') ? call : self;
                    }

                    function _inherits(subClass, superClass) {
                        if (typeof superClass !== 'function' && superClass !== null) {
                            throw new TypeError(
                                'Super expression must either be null or a function, not ' + typeof superClass
                            );
                        }
                        subClass.prototype = Object.create(superClass && superClass.prototype, {
                            constructor: { value: subClass, enumerable: false, writable: true, configurable: true }
                        });
                        if (superClass)
                            Object.setPrototypeOf
                                ? Object.setPrototypeOf(subClass, superClass)
                                : (subClass.__proto__ = superClass);
                    }
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    /* fetch + stream IO loader. Currently working on chrome 43+.
                     * fetch provides a better alternative http API to XMLHttpRequest
                     *
                     * fetch spec   https://fetch.spec.whatwg.org/
                     * stream spec  https://streams.spec.whatwg.org/
                     */
                    var FetchStreamLoader = (function (_BaseLoader) {
                        _inherits(FetchStreamLoader, _BaseLoader);

                        _createClass(FetchStreamLoader, null, [
                            {
                                key: 'isSupported',
                                value: function isSupported() {
                                    try {
                                        // fetch + stream is broken on Microsoft Edge. Disable for now.
                                        // see https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8196907/
                                        return self.fetch && self.ReadableStream && !_browser2.default.msedge;
                                    } catch (e) {
                                        return false;
                                    }
                                }
                            }
                        ]);

                        function FetchStreamLoader(seekHandler) {
                            _classCallCheck(this, FetchStreamLoader);

                            var _this = _possibleConstructorReturn(
                                this,
                                (FetchStreamLoader.__proto__ || Object.getPrototypeOf(FetchStreamLoader)).call(
                                    this,
                                    'fetch-stream-loader'
                                )
                            );

                            _this.TAG = 'FetchStreamLoader';

                            _this._seekHandler = seekHandler;
                            _this._needStash = true;

                            _this._requestAbort = false;
                            _this._contentLength = null;
                            _this._receivedLength = 0;
                            return _this;
                        }

                        _createClass(FetchStreamLoader, [
                            {
                                key: 'destroy',
                                value: function destroy() {
                                    if (this.isWorking()) {
                                        this.abort();
                                    }
                                    _get(
                                        FetchStreamLoader.prototype.__proto__ ||
                                            Object.getPrototypeOf(FetchStreamLoader.prototype),
                                        'destroy',
                                        this
                                    ).call(this);
                                }
                            },
                            {
                                key: 'open',
                                value: function open(dataSource, range) {
                                    var _this2 = this;

                                    this._dataSource = dataSource;
                                    this._range = range;

                                    var seekConfig = this._seekHandler.getConfig(dataSource.url, range);

                                    var headers = new self.Headers();

                                    if (_typeof(seekConfig.headers) === 'object') {
                                        var configHeaders = seekConfig.headers;
                                        for (var key in configHeaders) {
                                            if (configHeaders.hasOwnProperty(key)) {
                                                headers.append(key, configHeaders[key]);
                                            }
                                        }
                                    }

                                    var url = seekConfig.url;
                                    var params = {
                                        method: 'GET',
                                        headers: headers,
                                        mode: 'cors',
                                        cache: 'default'
                                    };

                                    // cors is enabled by default
                                    if (dataSource.cors === false) {
                                        // no-cors means 'disregard cors policy', which can only be used in ServiceWorker
                                        params.mode = 'same-origin';
                                    }

                                    // withCredentials is disabled by default
                                    if (dataSource.withCredentials) {
                                        params.credentials = 'include';
                                    }

                                    this._status = _loader.LoaderStatus.kConnecting;
                                    self.fetch(url, params)
                                        .then(function (res) {
                                            if (_this2._requestAbort) {
                                                _this2._requestAbort = false;
                                                _this2._status = _loader.LoaderStatus.kIdle;
                                                return;
                                            }
                                            if (res.ok && res.status >= 200 && res.status <= 299) {
                                                var lengthHeader = res.headers.get('Content-Length');
                                                if (lengthHeader != null) {
                                                    _this2._contentLength = parseInt(lengthHeader);
                                                    if (_this2._contentLength !== 0) {
                                                        if (_this2._onContentLengthKnown) {
                                                            _this2._onContentLengthKnown(_this2._contentLength);
                                                        }
                                                    }
                                                }
                                                return _this2._pump.call(_this2, res.body.getReader());
                                            } else {
                                                _this2._status = _loader.LoaderStatus.kError;
                                                if (_this2._onError) {
                                                    _this2._onError(_loader.LoaderErrors.HTTP_STATUS_CODE_INVALID, {
                                                        code: res.status,
                                                        msg: res.statusText
                                                    });
                                                } else {
                                                    throw new _exception.RuntimeException(
                                                        'FetchStreamLoader: Http code invalid, ' +
                                                            res.status +
                                                            ' ' +
                                                            res.statusText
                                                    );
                                                }
                                            }
                                        })
                                        .catch(function (e) {
                                            _this2._status = _loader.LoaderStatus.kError;
                                            if (_this2._onError) {
                                                _this2._onError(_loader.LoaderErrors.EXCEPTION, {
                                                    code: -1,
                                                    msg: e.message
                                                });
                                            } else {
                                                throw e;
                                            }
                                        });
                                }
                            },
                            {
                                //wy
                                key: 'pause',
                                value: function pause(pause) {
                                    this._paused = pause;
                                    if (!pause && this.reader) this._pump(this.reader);
                                }
                            },
                            {
                                key: 'abort',
                                value: function abort() {
                                    this._requestAbort = true;
                                }
                            },
                            {
                                key: '_pump',
                                value: function _pump(reader) {
                                    var _this3 = this;
                                    this.reader = reader;
                                    // ReadableStreamReader
                                    return reader
                                        .read()
                                        .then(function (result) {
                                            if (result.done) {
                                                _this3._status = _loader.LoaderStatus.kComplete;
                                                if (_this3._onComplete) {
                                                    _this3._onComplete(
                                                        _this3._range.from,
                                                        _this3._range.from + _this3._receivedLength - 1
                                                    );
                                                }
                                            } else {
                                                if (_this3._requestAbort === true) {
                                                    _this3._requestAbort = false;
                                                    _this3._status = _loader.LoaderStatus.kComplete;
                                                    return reader.cancel();
                                                }

                                                _this3._status = _loader.LoaderStatus.kBuffering;

                                                var chunk = result.value.buffer;
                                                var byteStart = _this3._range.from + _this3._receivedLength;
                                                _this3._receivedLength += chunk.byteLength;

                                                if (_this3._onDataArrival) {
                                                    _this3._onDataArrival(chunk, byteStart, _this3._receivedLength);
                                                }
                                                //wy
                                                if (_this3._paused) return;
                                                //wy
                                                _this3._pump(reader);
                                                //return _this3._pump(reader);
                                            }
                                        })
                                        .catch(function (e) {
                                            _this3._status = _loader.LoaderStatus.kError;
                                            var type = 0;
                                            var info = null;

                                            if (
                                                e.code === 19 && // NETWORK_ERR
                                                (_this3._contentLength === null ||
                                                    (_this3._contentLength !== null &&
                                                        _this3._receivedLength < _this3._contentLength))
                                            ) {
                                                type = _loader.LoaderErrors.EARLY_EOF;
                                                info = { code: e.code, msg: 'Fetch stream meet Early-EOF' };
                                            } else {
                                                type = _loader.LoaderErrors.EXCEPTION;
                                                info = { code: e.code, msg: e.message };
                                            }

                                            if (_this3._onError) {
                                                _this3._onError(type, info);
                                            } else {
                                                throw new _exception.RuntimeException(info.msg);
                                            }
                                        });
                                }
                            }
                        ]);

                        return FetchStreamLoader;
                    })(_loader.BaseLoader);

                    exports.default = FetchStreamLoader;
                },
                { '../utils/browser.js': 39, '../utils/exception.js': 40, '../utils/logger.js': 41, './loader.js': 24 }
            ],
            23: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var _logger = _dereq_('../utils/logger.js');

                    var _logger2 = _interopRequireDefault(_logger);

                    var _speedSampler = _dereq_('./speed-sampler.js');

                    var _speedSampler2 = _interopRequireDefault(_speedSampler);

                    var _loader = _dereq_('./loader.js');

                    var _fetchStreamLoader = _dereq_('./fetch-stream-loader.js');

                    var _fetchStreamLoader2 = _interopRequireDefault(_fetchStreamLoader);

                    var _xhrMozChunkedLoader = _dereq_('./xhr-moz-chunked-loader.js');

                    var _xhrMozChunkedLoader2 = _interopRequireDefault(_xhrMozChunkedLoader);

                    var _xhrMsstreamLoader = _dereq_('./xhr-msstream-loader.js');

                    var _xhrMsstreamLoader2 = _interopRequireDefault(_xhrMsstreamLoader);

                    var _xhrRangeLoader = _dereq_('./xhr-range-loader.js');

                    var _xhrRangeLoader2 = _interopRequireDefault(_xhrRangeLoader);

                    var _websocketLoader = _dereq_('./websocket-loader.js');

                    var _websocketLoader2 = _interopRequireDefault(_websocketLoader);

                    var _rangeSeekHandler = _dereq_('./range-seek-handler.js');

                    var _rangeSeekHandler2 = _interopRequireDefault(_rangeSeekHandler);

                    var _paramSeekHandler = _dereq_('./param-seek-handler.js');

                    var _paramSeekHandler2 = _interopRequireDefault(_paramSeekHandler);

                    var _exception = _dereq_('../utils/exception.js');

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    /**
                     * DataSource: {
                     *     url: string,
                     *     filesize: number,
                     *     cors: boolean,
                     *     withCredentials: boolean
                     * }
                     *
                     */

                    // Manage IO Loaders
                    var IOController = (function () {
                        function IOController(dataSource, config, extraData) {
                            _classCallCheck(this, IOController);

                            this.TAG = 'IOController';

                            this._config = config;
                            this._extraData = extraData;

                            this._stashInitialSize = 1024 * 384; // default initial size: 384KB
                            if (config.isLive === true) {
                                this._stashInitialSize = 1024 * 512; // default live initial size: 512KB
                            }
                            if (config.stashInitialSize != undefined && config.stashInitialSize > 0) {
                                // apply from config
                                this._stashInitialSize = config.stashInitialSize;
                            }

                            this._stashUsed = 0;
                            this._stashSize = this._stashInitialSize;
                            this._bufferSize = 1024 * 1024 * 3; // initial size: 3MB
                            this._stashBuffer = new ArrayBuffer(this._bufferSize);
                            this._stashByteStart = 0;
                            this._enableStash = true;
                            if (config.enableStashBuffer === false) {
                                this._enableStash = false;
                            }

                            this._loader = null;
                            this._loaderClass = null;
                            this._seekHandler = null;

                            this._dataSource = dataSource;
                            this._isWebSocketURL = /wss?:\/\/(.+?)/.test(dataSource.url);
                            this._refTotalLength = dataSource.filesize ? dataSource.filesize : null;
                            this._totalLength = this._refTotalLength;
                            this._fullRequestFlag = false;
                            this._currentRange = null;

                            this._speedNormalized = 0;
                            this._speedSampler = new _speedSampler2.default();
                            this._speedNormalizeList = [64, 128, 256, 384, 512, 768, 1024, 1536, 2048, 3072, 4096];

                            this._isEarlyEofReconnecting = false;

                            this._paused = false;
                            this._resumeFrom = 0;

                            this._onDataArrival = null;
                            this._onSeeked = null;
                            this._onError = null;
                            this._onComplete = null;
                            this._onRecoveredEarlyEof = null;

                            this._selectSeekHandler();
                            this._selectLoader();
                            this._createLoader();
                        }

                        _createClass(IOController, [
                            {
                                key: 'destroy',
                                value: function destroy() {
                                    if (this._loader.isWorking()) {
                                        this._loader.abort();
                                    }
                                    this._loader.destroy();
                                    this._loader = null;
                                    this._loaderClass = null;
                                    this._dataSource = null;
                                    this._stashBuffer = null;
                                    this._stashUsed = this._stashSize = this._bufferSize = this._stashByteStart = 0;
                                    this._currentRange = null;
                                    this._speedSampler = null;

                                    this._isEarlyEofReconnecting = false;

                                    this._onDataArrival = null;
                                    this._onSeeked = null;
                                    this._onError = null;
                                    this._onComplete = null;
                                    this._onRecoveredEarlyEof = null;

                                    this._extraData = null;
                                }
                            },
                            {
                                key: 'isWorking',
                                value: function isWorking() {
                                    return this._loader && this._loader.isWorking() && !this._paused;
                                }
                            },
                            {
                                key: 'isPaused',
                                value: function isPaused() {
                                    return this._paused;
                                }
                            },
                            {
                                key: '_selectSeekHandler',
                                value: function _selectSeekHandler() {
                                    var config = this._config;

                                    if (config.seekType === 'range') {
                                        this._seekHandler = new _rangeSeekHandler2.default(
                                            this._config.rangeLoadZeroStart
                                        );
                                    } else if (config.seekType === 'param') {
                                        var paramStart = config.seekParamStart || 'bstart';
                                        var paramEnd = config.seekParamEnd || 'bend';

                                        this._seekHandler = new _paramSeekHandler2.default(paramStart, paramEnd);
                                    } else if (config.seekType === 'custom') {
                                        if (typeof config.customSeekHandler !== 'function') {
                                            throw new _exception.InvalidArgumentException(
                                                'Custom seekType specified in config but invalid customSeekHandler!'
                                            );
                                        }
                                        this._seekHandler = new config.customSeekHandler();
                                    } else {
                                        throw new _exception.InvalidArgumentException(
                                            'Invalid seekType in config: ' + config.seekType
                                        );
                                    }
                                }
                            },
                            {
                                key: '_selectLoader',
                                value: function _selectLoader() {
                                    if (this._isWebSocketURL) {
                                        this._loaderClass = _websocketLoader2.default;
                                    } else if (_fetchStreamLoader2.default.isSupported()) {
                                        this._loaderClass = _fetchStreamLoader2.default;
                                    } else if (_xhrMozChunkedLoader2.default.isSupported()) {
                                        this._loaderClass = _xhrMozChunkedLoader2.default;
                                    } else if (_xhrRangeLoader2.default.isSupported()) {
                                        this._loaderClass = _xhrRangeLoader2.default;
                                    } else {
                                        throw new _exception.RuntimeException(
                                            "Your browser doesn't support xhr with arraybuffer responseType!"
                                        );
                                    }
                                }
                            },
                            {
                                key: '_createLoader',
                                value: function _createLoader() {
                                    this._loader = new this._loaderClass(this._seekHandler);
                                    if (this._loader.needStashBuffer === false) {
                                        this._enableStash = false;
                                    }
                                    this._loader.onContentLengthKnown = this._onContentLengthKnown.bind(this);
                                    this._loader.onDataArrival = this._onLoaderChunkArrival.bind(this);
                                    this._loader.onComplete = this._onLoaderComplete.bind(this);
                                    this._loader.onError = this._onLoaderError.bind(this);
                                }
                            },
                            {
                                key: 'open',
                                value: function open(optionalFrom) {
                                    this._currentRange = { from: 0, to: -1 };
                                    if (optionalFrom) {
                                        this._currentRange.from = optionalFrom;
                                    }

                                    this._speedSampler.reset();
                                    if (!optionalFrom) {
                                        this._fullRequestFlag = true;
                                    }

                                    this._loader.open(this._dataSource, Object.assign({}, this._currentRange));
                                }
                            },
                            {
                                key: 'abort',
                                value: function abort() {
                                    this._loader.abort();

                                    if (this._paused) {
                                        this._paused = false;
                                        this._resumeFrom = 0;
                                    }
                                }
                            },
                            {
                                key: 'pause',
                                value: function pause() {
                                    /*
            if (this.isWorking()) {
                this._loader.abort();

                if (this._stashUsed !== 0) {
                    this._resumeFrom = this._stashByteStart;
                    this._currentRange.to = this._stashByteStart - 1;
                } else {
                    this._resumeFrom = this._currentRange.to + 1;
                }
                this._stashUsed = 0;
                this._stashByteStart = 0;
                this._paused = true;
            }
            */
                                    //wy
                                    this._loader.pause(true);
                                    this._paused = true;
                                }
                            },
                            {
                                key: 'resume',
                                value: function resume(time) {
                                    if (this._paused) {
                                        /*
                this._paused = false;
                var bytes = this._resumeFrom;
                this._resumeFrom = 0;
                this._internalSeek(bytes, true);
                */
                                        //wy
                                        this._loader.pause(false);
                                        this._paused = false;
                                    }
                                }
                            },
                            {
                                key: 'seek',
                                value: function seek(bytes) {
                                    this._paused = false;
                                    this._stashUsed = 0;
                                    this._stashByteStart = 0;
                                    this._internalSeek(bytes, true);
                                }

                                /**
                                 * When seeking request is from media seeking, unconsumed stash data should be dropped
                                 * However, stash data shouldn't be dropped if seeking requested from http reconnection
                                 *
                                 * @dropUnconsumed: Ignore and discard all unconsumed data in stash buffer
                                 */
                            },
                            {
                                key: '_internalSeek',
                                value: function _internalSeek(bytes, dropUnconsumed) {
                                    if (this._loader.isWorking()) {
                                        this._loader.abort();
                                    }

                                    // dispatch & flush stash buffer before seek
                                    this._flushStashBuffer(dropUnconsumed);

                                    this._loader.destroy();
                                    this._loader = null;

                                    var requestRange = { from: bytes, to: -1 };
                                    this._currentRange = { from: requestRange.from, to: -1 };

                                    this._speedSampler.reset();
                                    this._stashSize = this._stashInitialSize;
                                    this._createLoader();
                                    this._loader.open(this._dataSource, requestRange);

                                    if (this._onSeeked) {
                                        this._onSeeked();
                                    }
                                }
                            },
                            {
                                key: 'updateUrl',
                                value: function updateUrl(url) {
                                    if (!url || typeof url !== 'string' || url.length === 0) {
                                        throw new _exception.InvalidArgumentException(
                                            'Url must be a non-empty string!'
                                        );
                                    }

                                    this._dataSource.url = url;

                                    // TODO: replace with new url
                                }
                            },
                            {
                                key: '_expandBuffer',
                                value: function _expandBuffer(expectedBytes) {
                                    var bufferNewSize = this._stashSize;
                                    while (bufferNewSize + 1024 * 1024 * 1 < expectedBytes) {
                                        bufferNewSize *= 2;
                                    }

                                    bufferNewSize += 1024 * 1024 * 1; // bufferSize = stashSize + 1MB
                                    if (bufferNewSize === this._bufferSize) {
                                        return;
                                    }

                                    var newBuffer = new ArrayBuffer(bufferNewSize);

                                    if (this._stashUsed > 0) {
                                        // copy existing data into new buffer
                                        var stashOldArray = new Uint8Array(this._stashBuffer, 0, this._stashUsed);
                                        var stashNewArray = new Uint8Array(newBuffer, 0, bufferNewSize);
                                        stashNewArray.set(stashOldArray, 0);
                                    }

                                    this._stashBuffer = newBuffer;
                                    this._bufferSize = bufferNewSize;
                                }
                            },
                            {
                                key: '_normalizeSpeed',
                                value: function _normalizeSpeed(input) {
                                    var list = this._speedNormalizeList;
                                    var last = list.length - 1;
                                    var mid = 0;
                                    var lbound = 0;
                                    var ubound = last;

                                    if (input < list[0]) {
                                        return list[0];
                                    }

                                    // binary search
                                    while (lbound <= ubound) {
                                        mid = lbound + Math.floor((ubound - lbound) / 2);
                                        if (mid === last || (input >= list[mid] && input < list[mid + 1])) {
                                            return list[mid];
                                        } else if (list[mid] < input) {
                                            lbound = mid + 1;
                                        } else {
                                            ubound = mid - 1;
                                        }
                                    }
                                }
                            },
                            {
                                key: '_adjustStashSize',
                                value: function _adjustStashSize(normalized) {
                                    var stashSizeKB = 0;

                                    if (this._config.isLive) {
                                        // live stream: always use single normalized speed for size of stashSizeKB
                                        stashSizeKB = normalized;
                                    } else {
                                        if (normalized < 512) {
                                            stashSizeKB = normalized;
                                        } else if (normalized >= 512 && normalized <= 1024) {
                                            stashSizeKB = Math.floor(normalized * 1.5);
                                        } else {
                                            stashSizeKB = normalized * 2;
                                        }
                                    }

                                    if (stashSizeKB > 8192) {
                                        stashSizeKB = 8192;
                                    }

                                    var bufferSize = stashSizeKB * 1024 + 1024 * 1024 * 1; // stashSize + 1MB
                                    if (this._bufferSize < bufferSize) {
                                        this._expandBuffer(bufferSize);
                                    }
                                    this._stashSize = stashSizeKB * 1024;
                                }
                            },
                            {
                                key: '_dispatchChunks',
                                value: function _dispatchChunks(chunks, byteStart) {
                                    this._currentRange.to = byteStart + chunks.byteLength - 1;
                                    return this._onDataArrival(chunks, byteStart);
                                }
                            },
                            {
                                key: '_onContentLengthKnown',
                                value: function _onContentLengthKnown(contentLength) {
                                    if (contentLength && this._fullRequestFlag) {
                                        this._totalLength = contentLength;
                                        this._fullRequestFlag = false;
                                    }
                                }
                            },
                            {
                                key: '_onLoaderChunkArrival',
                                value: function _onLoaderChunkArrival(chunk, byteStart, receivedLength) {
                                    if (!this._onDataArrival) {
                                        throw new _exception.IllegalStateException(
                                            'IOController: No existing consumer (onDataArrival) callback!'
                                        );
                                    }
                                    //wy
                                    /*
            if (this._paused) {
                return;
            }
            */

                                    if (this._isEarlyEofReconnecting) {
                                        // Auto-reconnect for EarlyEof succeed, notify to upper-layer by callback
                                        this._isEarlyEofReconnecting = false;
                                        if (this._onRecoveredEarlyEof) {
                                            this._onRecoveredEarlyEof();
                                        }
                                    }

                                    this._speedSampler.addBytes(chunk.byteLength);

                                    // adjust stash buffer size according to network speed dynamically
                                    var KBps = this._speedSampler.lastSecondKBps;
                                    if (KBps !== 0) {
                                        var normalized = this._normalizeSpeed(KBps);
                                        if (this._speedNormalized !== normalized) {
                                            this._speedNormalized = normalized;
                                            this._adjustStashSize(normalized);
                                        }
                                    }

                                    if (!this._enableStash) {
                                        // disable stash
                                        if (this._stashUsed === 0) {
                                            // dispatch chunk directly to consumer;
                                            // check ret value (consumed bytes) and stash unconsumed to stashBuffer
                                            var consumed = this._dispatchChunks(chunk, byteStart);
                                            if (consumed < chunk.byteLength) {
                                                // unconsumed data remain.
                                                var remain = chunk.byteLength - consumed;
                                                if (remain > this._bufferSize) {
                                                    this._expandBuffer(remain);
                                                }
                                                var stashArray = new Uint8Array(this._stashBuffer, 0, this._bufferSize);
                                                stashArray.set(new Uint8Array(chunk, consumed), 0);
                                                this._stashUsed += remain;
                                                this._stashByteStart = byteStart + consumed;
                                            }
                                        } else {
                                            // else: Merge chunk into stashBuffer, and dispatch stashBuffer to consumer.
                                            if (this._stashUsed + chunk.byteLength > this._bufferSize) {
                                                this._expandBuffer(this._stashUsed + chunk.byteLength);
                                            }
                                            var _stashArray = new Uint8Array(this._stashBuffer, 0, this._bufferSize);
                                            _stashArray.set(new Uint8Array(chunk), this._stashUsed);
                                            this._stashUsed += chunk.byteLength;
                                            var _consumed = this._dispatchChunks(
                                                this._stashBuffer.slice(0, this._stashUsed),
                                                this._stashByteStart
                                            );
                                            if (_consumed < this._stashUsed && _consumed > 0) {
                                                // unconsumed data remain
                                                var remainArray = new Uint8Array(this._stashBuffer, _consumed);
                                                _stashArray.set(remainArray, 0);
                                            }
                                            this._stashUsed -= _consumed;
                                            this._stashByteStart += _consumed;
                                        }
                                    } else {
                                        // enable stash
                                        if (this._stashUsed === 0 && this._stashByteStart === 0) {
                                            // seeked? or init chunk?
                                            // This is the first chunk after seek action
                                            this._stashByteStart = byteStart;
                                        }
                                        if (this._stashUsed + chunk.byteLength <= this._stashSize) {
                                            // just stash
                                            var _stashArray2 = new Uint8Array(this._stashBuffer, 0, this._stashSize);
                                            _stashArray2.set(new Uint8Array(chunk), this._stashUsed);
                                            this._stashUsed += chunk.byteLength;
                                        } else {
                                            // stashUsed + chunkSize > stashSize, size limit exceeded
                                            var _stashArray3 = new Uint8Array(this._stashBuffer, 0, this._bufferSize);
                                            if (this._stashUsed > 0) {
                                                // There're stash datas in buffer
                                                // dispatch the whole stashBuffer, and stash remain data
                                                // then append chunk to stashBuffer (stash)
                                                var buffer = this._stashBuffer.slice(0, this._stashUsed);
                                                var _consumed2 = this._dispatchChunks(buffer, this._stashByteStart);
                                                if (_consumed2 < buffer.byteLength) {
                                                    if (_consumed2 > 0) {
                                                        var _remainArray = new Uint8Array(buffer, _consumed2);
                                                        _stashArray3.set(_remainArray, 0);
                                                        this._stashUsed = _remainArray.byteLength;
                                                        this._stashByteStart += _consumed2;
                                                    }
                                                } else {
                                                    this._stashUsed = 0;
                                                    this._stashByteStart += _consumed2;
                                                }
                                                if (this._stashUsed + chunk.byteLength > this._bufferSize) {
                                                    this._expandBuffer(this._stashUsed + chunk.byteLength);
                                                    _stashArray3 = new Uint8Array(
                                                        this._stashBuffer,
                                                        0,
                                                        this._bufferSize
                                                    );
                                                }
                                                _stashArray3.set(new Uint8Array(chunk), this._stashUsed);
                                                this._stashUsed += chunk.byteLength;
                                            } else {
                                                // stash buffer empty, but chunkSize > stashSize (oh, holy shit)
                                                // dispatch chunk directly and stash remain data
                                                var _consumed3 = this._dispatchChunks(chunk, byteStart);
                                                if (_consumed3 < chunk.byteLength) {
                                                    var _remain = chunk.byteLength - _consumed3;
                                                    if (_remain > this._bufferSize) {
                                                        this._expandBuffer(_remain);
                                                        _stashArray3 = new Uint8Array(
                                                            this._stashBuffer,
                                                            0,
                                                            this._bufferSize
                                                        );
                                                    }
                                                    _stashArray3.set(new Uint8Array(chunk, _consumed3), 0);
                                                    this._stashUsed += _remain;
                                                    this._stashByteStart = byteStart + _consumed3;
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            {
                                key: '_flushStashBuffer',
                                value: function _flushStashBuffer(dropUnconsumed) {
                                    if (this._stashUsed > 0) {
                                        var buffer = this._stashBuffer.slice(0, this._stashUsed);
                                        var consumed = this._dispatchChunks(buffer, this._stashByteStart);
                                        var remain = buffer.byteLength - consumed;

                                        if (consumed < buffer.byteLength) {
                                            if (dropUnconsumed) {
                                                _logger2.default.w(
                                                    this.TAG,
                                                    remain + ' bytes unconsumed data remain when flush buffer, dropped'
                                                );
                                            } else {
                                                if (consumed > 0) {
                                                    var stashArray = new Uint8Array(
                                                        this._stashBuffer,
                                                        0,
                                                        this._bufferSize
                                                    );
                                                    var remainArray = new Uint8Array(buffer, consumed);
                                                    stashArray.set(remainArray, 0);
                                                    this._stashUsed = remainArray.byteLength;
                                                    this._stashByteStart += consumed;
                                                }
                                                return 0;
                                            }
                                        }
                                        this._stashUsed = 0;
                                        this._stashByteStart = 0;
                                        return remain;
                                    }
                                    return 0;
                                }
                            },
                            {
                                key: '_onLoaderComplete',
                                value: function _onLoaderComplete(from, to) {
                                    // Force-flush stash buffer, and drop unconsumed data
                                    this._flushStashBuffer(true);

                                    if (this._onComplete) {
                                        this._onComplete(this._extraData);
                                    }
                                }
                            },
                            {
                                key: '_onLoaderError',
                                value: function _onLoaderError(type, data) {
                                    _logger2.default.e(
                                        this.TAG,
                                        'Loader error, code = ' + data.code + ', msg = ' + data.msg
                                    );

                                    this._flushStashBuffer(false);

                                    if (this._isEarlyEofReconnecting) {
                                        // Auto-reconnect for EarlyEof failed, throw UnrecoverableEarlyEof error to upper-layer
                                        this._isEarlyEofReconnecting = false;
                                        type = _loader.LoaderErrors.UNRECOVERABLE_EARLY_EOF;
                                    }

                                    switch (type) {
                                        case _loader.LoaderErrors.EARLY_EOF: {
                                            if (!this._config.isLive) {
                                                // Do internal http reconnect if not live stream
                                                if (this._totalLength) {
                                                    var nextFrom = this._currentRange.to + 1;
                                                    if (nextFrom < this._totalLength) {
                                                        _logger2.default.w(
                                                            this.TAG,
                                                            'Connection lost, trying reconnect...'
                                                        );
                                                        this._isEarlyEofReconnecting = true;
                                                        this._internalSeek(nextFrom, false);
                                                    }
                                                    return;
                                                }
                                                // else: We don't know totalLength, throw UnrecoverableEarlyEof
                                            }
                                            // live stream: throw UnrecoverableEarlyEof error to upper-layer
                                            type = _loader.LoaderErrors.UNRECOVERABLE_EARLY_EOF;
                                            break;
                                        }
                                        case _loader.LoaderErrors.UNRECOVERABLE_EARLY_EOF:
                                        case _loader.LoaderErrors.CONNECTING_TIMEOUT:
                                        case _loader.LoaderErrors.HTTP_STATUS_CODE_INVALID:
                                        case _loader.LoaderErrors.EXCEPTION:
                                            break;
                                    }

                                    if (this._onError) {
                                        this._onError(type, data);
                                    } else {
                                        throw new _exception.RuntimeException('IOException: ' + data.msg);
                                    }
                                }
                            },
                            {
                                key: 'status',
                                get: function get() {
                                    return this._loader.status;
                                }
                            },
                            {
                                key: 'extraData',
                                get: function get() {
                                    return this._extraData;
                                },
                                set: function set(data) {
                                    this._extraData = data;
                                }

                                // prototype: function onDataArrival(chunks: ArrayBuffer, byteStart: number): number
                            },
                            {
                                key: 'onDataArrival',
                                get: function get() {
                                    return this._onDataArrival;
                                },
                                set: function set(callback) {
                                    this._onDataArrival = callback;
                                }
                            },
                            {
                                key: 'onSeeked',
                                get: function get() {
                                    return this._onSeeked;
                                },
                                set: function set(callback) {
                                    this._onSeeked = callback;
                                }

                                // prototype: function onError(type: number, info: {code: number, msg: string}): void
                            },
                            {
                                key: 'onError',
                                get: function get() {
                                    return this._onError;
                                },
                                set: function set(callback) {
                                    this._onError = callback;
                                }
                            },
                            {
                                key: 'onComplete',
                                get: function get() {
                                    return this._onComplete;
                                },
                                set: function set(callback) {
                                    this._onComplete = callback;
                                }
                            },
                            {
                                key: 'onRecoveredEarlyEof',
                                get: function get() {
                                    return this._onRecoveredEarlyEof;
                                },
                                set: function set(callback) {
                                    this._onRecoveredEarlyEof = callback;
                                }
                            },
                            {
                                key: 'currentUrl',
                                get: function get() {
                                    return this._dataSource.url;
                                }

                                // in KB/s
                            },
                            {
                                key: 'currentSpeed',
                                get: function get() {
                                    if (this._loaderClass === _xhrRangeLoader2.default) {
                                        // SpeedSampler is inaccuracy if loader is RangeLoader
                                        return this._loader.currentSpeed;
                                    }
                                    return this._speedSampler.lastSecondKBps;
                                }
                            },
                            {
                                key: 'loaderType',
                                get: function get() {
                                    return this._loader.type;
                                }
                            }
                        ]);

                        return IOController;
                    })();

                    exports.default = IOController;
                },
                {
                    '../utils/exception.js': 40,
                    '../utils/logger.js': 41,
                    './fetch-stream-loader.js': 22,
                    './loader.js': 24,
                    './param-seek-handler.js': 25,
                    './range-seek-handler.js': 26,
                    './speed-sampler.js': 27,
                    './websocket-loader.js': 28,
                    './xhr-moz-chunked-loader.js': 29,
                    './xhr-msstream-loader.js': 30,
                    './xhr-range-loader.js': 31
                }
            ],
            24: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });
                    exports.BaseLoader = exports.LoaderErrors = exports.LoaderStatus = undefined;

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var _exception = _dereq_('../utils/exception.js');

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    var LoaderStatus = (exports.LoaderStatus = {
                        kIdle: 0,
                        kConnecting: 1,
                        kBuffering: 2,
                        kError: 3,
                        kComplete: 4
                    });

                    var LoaderErrors = (exports.LoaderErrors = {
                        OK: 'OK',
                        EXCEPTION: 'Exception',
                        HTTP_STATUS_CODE_INVALID: 'HttpStatusCodeInvalid',
                        CONNECTING_TIMEOUT: 'ConnectingTimeout',
                        EARLY_EOF: 'EarlyEof',
                        UNRECOVERABLE_EARLY_EOF: 'UnrecoverableEarlyEof'
                    });

                    /* Loader has callbacks which have following prototypes:
                     *     function onContentLengthKnown(contentLength: number): void
                     *     function onDataArrival(chunk: ArrayBuffer, byteStart: number, receivedLength: number): void
                     *     function onError(errorType: number, errorInfo: {code: number, msg: string}): void
                     *     function onComplete(rangeFrom: number, rangeTo: number): void
                     */

                    var BaseLoader = (exports.BaseLoader = (function () {
                        function BaseLoader(typeName) {
                            _classCallCheck(this, BaseLoader);

                            this._type = typeName || 'undefined';
                            this._status = LoaderStatus.kIdle;
                            this._needStash = false;
                            // callbacks
                            this._onContentLengthKnown = null;
                            this._onDataArrival = null;
                            this._onError = null;
                            this._onComplete = null;
                        }

                        _createClass(BaseLoader, [
                            {
                                key: 'destroy',
                                value: function destroy() {
                                    this._status = LoaderStatus.kIdle;
                                    this._onContentLengthKnown = null;
                                    this._onDataArrival = null;
                                    this._onError = null;
                                    this._onComplete = null;
                                }
                            },
                            {
                                key: 'isWorking',
                                value: function isWorking() {
                                    return (
                                        this._status === LoaderStatus.kConnecting ||
                                        this._status === LoaderStatus.kBuffering
                                    );
                                }
                            },
                            {
                                key: 'open',

                                // pure virtual
                                value: function open(dataSource, range) {
                                    throw new _exception.NotImplementedException('Unimplemented abstract function!');
                                }
                            },
                            {
                                key: 'abort',
                                value: function abort() {
                                    throw new _exception.NotImplementedException('Unimplemented abstract function!');
                                }
                            },
                            {
                                key: 'type',
                                get: function get() {
                                    return this._type;
                                }
                            },
                            {
                                key: 'status',
                                get: function get() {
                                    return this._status;
                                }
                            },
                            {
                                key: 'needStashBuffer',
                                get: function get() {
                                    return this._needStash;
                                }
                            },
                            {
                                key: 'onContentLengthKnown',
                                get: function get() {
                                    return this._onContentLengthKnown;
                                },
                                set: function set(callback) {
                                    this._onContentLengthKnown = callback;
                                }
                            },
                            {
                                key: 'onDataArrival',
                                get: function get() {
                                    return this._onDataArrival;
                                },
                                set: function set(callback) {
                                    this._onDataArrival = callback;
                                }
                            },
                            {
                                key: 'onError',
                                get: function get() {
                                    return this._onError;
                                },
                                set: function set(callback) {
                                    this._onError = callback;
                                }
                            },
                            {
                                key: 'onComplete',
                                get: function get() {
                                    return this._onComplete;
                                },
                                set: function set(callback) {
                                    this._onComplete = callback;
                                }
                            }
                        ]);

                        return BaseLoader;
                    })());
                },
                { '../utils/exception.js': 40 }
            ],
            25: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var ParamSeekHandler = (function () {
                        function ParamSeekHandler(paramStart, paramEnd) {
                            _classCallCheck(this, ParamSeekHandler);

                            this._startName = paramStart;
                            this._endName = paramEnd;
                        }

                        _createClass(ParamSeekHandler, [
                            {
                                key: 'getConfig',
                                value: function getConfig(baseUrl, range) {
                                    var url = baseUrl;

                                    if (range.from !== 0 || range.to !== -1) {
                                        var needAnd = true;
                                        if (url.indexOf('?') === -1) {
                                            url += '?';
                                            needAnd = false;
                                        }

                                        if (needAnd) {
                                            url += '&';
                                        }

                                        url += this._startName + '=' + range.from.toString();

                                        if (range.to !== -1) {
                                            url += '&' + this._endName + '=' + range.to.toString();
                                        }
                                    }

                                    return {
                                        url: url,
                                        headers: {}
                                    };
                                }
                            }
                        ]);

                        return ParamSeekHandler;
                    })();

                    exports.default = ParamSeekHandler;
                },
                {}
            ],
            26: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var RangeSeekHandler = (function () {
                        function RangeSeekHandler(zeroStart) {
                            _classCallCheck(this, RangeSeekHandler);

                            this._zeroStart = zeroStart || false;
                        }

                        _createClass(RangeSeekHandler, [
                            {
                                key: 'getConfig',
                                value: function getConfig(url, range) {
                                    var headers = {};

                                    if (range.from !== 0 || range.to !== -1) {
                                        var param = void 0;
                                        if (range.to !== -1) {
                                            param = 'bytes=' + range.from.toString() + '-' + range.to.toString();
                                        } else {
                                            param = 'bytes=' + range.from.toString() + '-';
                                        }
                                        headers['Range'] = param;
                                    } else if (this._zeroStart) {
                                        headers['Range'] = 'bytes=0-';
                                    }

                                    return {
                                        url: url,
                                        headers: headers
                                    };
                                }
                            }
                        ]);

                        return RangeSeekHandler;
                    })();

                    exports.default = RangeSeekHandler;
                },
                {}
            ],
            27: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    // Utility class to calculate realtime network I/O speed
                    var SpeedSampler = (function () {
                        function SpeedSampler() {
                            _classCallCheck(this, SpeedSampler);

                            // milliseconds
                            this._firstCheckpoint = 0;
                            this._lastCheckpoint = 0;
                            this._intervalBytes = 0;
                            this._totalBytes = 0;
                            this._lastSecondBytes = 0;

                            // compatibility detection
                            if (self.performance && self.performance.now) {
                                this._now = self.performance.now.bind(self.performance);
                            } else {
                                this._now = Date.now;
                            }
                        }

                        _createClass(SpeedSampler, [
                            {
                                key: 'reset',
                                value: function reset() {
                                    this._firstCheckpoint = this._lastCheckpoint = 0;
                                    this._totalBytes = this._intervalBytes = 0;
                                    this._lastSecondBytes = 0;
                                }
                            },
                            {
                                key: 'addBytes',
                                value: function addBytes(bytes) {
                                    if (this._firstCheckpoint === 0) {
                                        this._firstCheckpoint = this._now();
                                        this._lastCheckpoint = this._firstCheckpoint;
                                        this._intervalBytes += bytes;
                                        this._totalBytes += bytes;
                                    } else if (this._now() - this._lastCheckpoint < 1000) {
                                        this._intervalBytes += bytes;
                                        this._totalBytes += bytes;
                                    } else {
                                        // duration >= 1000
                                        this._lastSecondBytes = this._intervalBytes;
                                        this._intervalBytes = bytes;
                                        this._totalBytes += bytes;
                                        this._lastCheckpoint = this._now();
                                    }
                                }
                            },
                            {
                                key: 'currentKBps',
                                get: function get() {
                                    this.addBytes(0);

                                    var durationSeconds = (this._now() - this._lastCheckpoint) / 1000;
                                    if (durationSeconds == 0) durationSeconds = 1;
                                    return this._intervalBytes / durationSeconds / 1024;
                                }
                            },
                            {
                                key: 'lastSecondKBps',
                                get: function get() {
                                    this.addBytes(0);

                                    if (this._lastSecondBytes !== 0) {
                                        return this._lastSecondBytes / 1024;
                                    } else {
                                        // lastSecondBytes === 0
                                        if (this._now() - this._lastCheckpoint >= 500) {
                                            // if time interval since last checkpoint has exceeded 500ms
                                            // the speed is nearly accurate
                                            return this.currentKBps;
                                        } else {
                                            // We don't know
                                            return 0;
                                        }
                                    }
                                }
                            },
                            {
                                key: 'averageKBps',
                                get: function get() {
                                    var durationSeconds = (this._now() - this._firstCheckpoint) / 1000;
                                    return this._totalBytes / durationSeconds / 1024;
                                }
                            }
                        ]);

                        return SpeedSampler;
                    })();

                    exports.default = SpeedSampler;
                },
                {}
            ],
            28: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _get = function get(object, property, receiver) {
                        if (object === null) object = Function.prototype;
                        var desc = Object.getOwnPropertyDescriptor(object, property);
                        if (desc === undefined) {
                            var parent = Object.getPrototypeOf(object);
                            if (parent === null) {
                                return undefined;
                            } else {
                                return get(parent, property, receiver);
                            }
                        } else if ('value' in desc) {
                            return desc.value;
                        } else {
                            var getter = desc.get;
                            if (getter === undefined) {
                                return undefined;
                            }
                            return getter.call(receiver);
                        }
                    };

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();

                    var _logger = _dereq_('../utils/logger.js');

                    var _logger2 = _interopRequireDefault(_logger);

                    var _loader = _dereq_('./loader.js');

                    var _exception = _dereq_('../utils/exception.js');

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    function _possibleConstructorReturn(self, call) {
                        if (!self) {
                            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                        }
                        return call && (typeof call === 'object' || typeof call === 'function') ? call : self;
                    }

                    function _inherits(subClass, superClass) {
                        if (typeof superClass !== 'function' && superClass !== null) {
                            throw new TypeError(
                                'Super expression must either be null or a function, not ' + typeof superClass
                            );
                        }
                        subClass.prototype = Object.create(superClass && superClass.prototype, {
                            constructor: { value: subClass, enumerable: false, writable: true, configurable: true }
                        });
                        if (superClass)
                            Object.setPrototypeOf
                                ? Object.setPrototypeOf(subClass, superClass)
                                : (subClass.__proto__ = superClass);
                    }
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    // For FLV over WebSocket live stream
                    var WebSocketLoader = (function (_BaseLoader) {
                        _inherits(WebSocketLoader, _BaseLoader);

                        _createClass(WebSocketLoader, null, [
                            {
                                key: 'isSupported',
                                value: function isSupported() {
                                    try {
                                        return typeof self.WebSocket !== 'undefined';
                                    } catch (e) {
                                        return false;
                                    }
                                }
                            }
                        ]);

                        function WebSocketLoader() {
                            _classCallCheck(this, WebSocketLoader);

                            var _this = _possibleConstructorReturn(
                                this,
                                (WebSocketLoader.__proto__ || Object.getPrototypeOf(WebSocketLoader)).call(
                                    this,
                                    'websocket-loader'
                                )
                            );

                            _this.TAG = 'WebSocketLoader';

                            _this._needStash = true;

                            _this._ws = null;
                            _this._requestAbort = false;
                            _this._receivedLength = 0;
                            return _this;
                        }

                        _createClass(WebSocketLoader, [
                            {
                                key: 'destroy',
                                value: function destroy() {
                                    if (this._ws) {
                                        this.abort();
                                    }
                                    _get(
                                        WebSocketLoader.prototype.__proto__ ||
                                            Object.getPrototypeOf(WebSocketLoader.prototype),
                                        'destroy',
                                        this
                                    ).call(this);
                                }
                            },
                            {
                                key: 'open',
                                value: function open(dataSource) {
                                    try {
                                        var ws = (this._ws = new self.WebSocket(dataSource.url));
                                        ws.binaryType = 'arraybuffer';
                                        ws.onopen = this._onWebSocketOpen.bind(this);
                                        ws.onclose = this._onWebSocketClose.bind(this);
                                        ws.onmessage = this._onWebSocketMessage.bind(this);
                                        ws.onerror = this._onWebSocketError.bind(this);

                                        this._status = _loader.LoaderStatus.kConnecting;
                                    } catch (e) {
                                        this._status = _loader.LoaderStatus.kError;

                                        var info = { code: e.code, msg: e.message };

                                        if (this._onError) {
                                            this._onError(_loader.LoaderErrors.EXCEPTION, info);
                                        } else {
                                            throw new _exception.RuntimeException(info.msg);
                                        }
                                    }
                                }
                            },
                            {
                                key: 'abort',
                                value: function abort() {
                                    var ws = this._ws;
                                    if (ws && (ws.readyState === 0 || ws.readyState === 1)) {
                                        // CONNECTING || OPEN
                                        this._requestAbort = true;
                                        ws.close();
                                    }

                                    this._ws = null;
                                    this._status = _loader.LoaderStatus.kComplete;
                                }
                            },
                            {
                                key: '_onWebSocketOpen',
                                value: function _onWebSocketOpen(e) {
                                    this._status = _loader.LoaderStatus.kBuffering;
                                }
                            },
                            {
                                key: '_onWebSocketClose',
                                value: function _onWebSocketClose(e) {
                                    if (this._requestAbort === true) {
                                        this._requestAbort = false;
                                        return;
                                    }

                                    this._status = _loader.LoaderStatus.kComplete;

                                    if (this._onComplete) {
                                        this._onComplete(0, this._receivedLength - 1);
                                    }
                                }
                            },
                            {
                                key: '_onWebSocketMessage',
                                value: function _onWebSocketMessage(e) {
                                    var _this2 = this;

                                    if (e.data instanceof ArrayBuffer) {
                                        this._dispatchArrayBuffer(e.data);
                                    } else if (e.data instanceof Blob) {
                                        (function () {
                                            var reader = new FileReader();
                                            reader.onload = function () {
                                                _this2._dispatchArrayBuffer(reader.result);
                                            };
                                            reader.readAsArrayBuffer(e.data);
                                        })();
                                    } else {
                                        this._status = _loader.LoaderStatus.kError;
                                        var info = {
                                            code: -1,
                                            msg: 'Unsupported WebSocket message type: ' + e.data.constructor.name
                                        };

                                        if (this._onError) {
                                            this._onError(_loader.LoaderErrors.EXCEPTION, info);
                                        } else {
                                            throw new _exception.RuntimeException(info.msg);
                                        }
                                    }
                                }
                            },
                            {
                                key: '_dispatchArrayBuffer',
                                value: function _dispatchArrayBuffer(arraybuffer) {
                                    var chunk = arraybuffer;
                                    var byteStart = this._receivedLength;
                                    this._receivedLength += chunk.byteLength;

                                    if (this._onDataArrival) {
                                        this._onDataArrival(chunk, byteStart, this._receivedLength);
                                    }
                                }
                            },
                            {
                                key: '_onWebSocketError',
                                value: function _onWebSocketError(e) {
                                    this._status = _loader.LoaderStatus.kError;

                                    var info = {
                                        code: e.code,
                                        msg: e.message
                                    };

                                    if (this._onError) {
                                        this._onError(_loader.LoaderErrors.EXCEPTION, info);
                                    } else {
                                        throw new _exception.RuntimeException(info.msg);
                                    }
                                }
                            }
                        ]);

                        return WebSocketLoader;
                    })(_loader.BaseLoader);

                    exports.default = WebSocketLoader;
                },
                { '../utils/exception.js': 40, '../utils/logger.js': 41, './loader.js': 24 }
            ],
            29: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _typeof =
                        typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
                            ? function (obj) {
                                  return typeof obj;
                              }
                            : function (obj) {
                                  return obj &&
                                      typeof Symbol === 'function' &&
                                      obj.constructor === Symbol &&
                                      obj !== Symbol.prototype
                                      ? 'symbol'
                                      : typeof obj;
                              };

                    var _get = function get(object, property, receiver) {
                        if (object === null) object = Function.prototype;
                        var desc = Object.getOwnPropertyDescriptor(object, property);
                        if (desc === undefined) {
                            var parent = Object.getPrototypeOf(object);
                            if (parent === null) {
                                return undefined;
                            } else {
                                return get(parent, property, receiver);
                            }
                        } else if ('value' in desc) {
                            return desc.value;
                        } else {
                            var getter = desc.get;
                            if (getter === undefined) {
                                return undefined;
                            }
                            return getter.call(receiver);
                        }
                    };

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();

                    var _logger = _dereq_('../utils/logger.js');

                    var _logger2 = _interopRequireDefault(_logger);

                    var _loader = _dereq_('./loader.js');

                    var _exception = _dereq_('../utils/exception.js');

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    function _possibleConstructorReturn(self, call) {
                        if (!self) {
                            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                        }
                        return call && (typeof call === 'object' || typeof call === 'function') ? call : self;
                    }

                    function _inherits(subClass, superClass) {
                        if (typeof superClass !== 'function' && superClass !== null) {
                            throw new TypeError(
                                'Super expression must either be null or a function, not ' + typeof superClass
                            );
                        }
                        subClass.prototype = Object.create(superClass && superClass.prototype, {
                            constructor: { value: subClass, enumerable: false, writable: true, configurable: true }
                        });
                        if (superClass)
                            Object.setPrototypeOf
                                ? Object.setPrototypeOf(subClass, superClass)
                                : (subClass.__proto__ = superClass);
                    }
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    // For FireFox browser which supports `xhr.responseType = 'moz-chunked-arraybuffer'`
                    var MozChunkedLoader = (function (_BaseLoader) {
                        _inherits(MozChunkedLoader, _BaseLoader);

                        _createClass(MozChunkedLoader, null, [
                            {
                                key: 'isSupported',
                                value: function isSupported() {
                                    try {
                                        var xhr = new XMLHttpRequest();
                                        // Firefox 37- requires .open() to be called before setting responseType
                                        xhr.open('GET', 'https://example.com', true);
                                        xhr.responseType = 'moz-chunked-arraybuffer';
                                        return xhr.responseType === 'moz-chunked-arraybuffer';
                                    } catch (e) {
                                        _logger2.default.w('MozChunkedLoader', e.message);
                                        return false;
                                    }
                                }
                            }
                        ]);

                        function MozChunkedLoader(seekHandler) {
                            _classCallCheck(this, MozChunkedLoader);

                            var _this = _possibleConstructorReturn(
                                this,
                                (MozChunkedLoader.__proto__ || Object.getPrototypeOf(MozChunkedLoader)).call(
                                    this,
                                    'xhr-moz-chunked-loader'
                                )
                            );

                            _this.TAG = 'MozChunkedLoader';

                            _this._seekHandler = seekHandler;
                            _this._needStash = true;

                            _this._xhr = null;
                            _this._requestAbort = false;
                            _this._contentLength = null;
                            _this._receivedLength = 0;
                            return _this;
                        }

                        _createClass(MozChunkedLoader, [
                            {
                                key: 'destroy',
                                value: function destroy() {
                                    if (this.isWorking()) {
                                        this.abort();
                                    }
                                    if (this._xhr) {
                                        this._xhr.onreadystatechange = null;
                                        this._xhr.onprogress = null;
                                        this._xhr.onloadend = null;
                                        this._xhr.onerror = null;
                                        this._xhr = null;
                                    }
                                    _get(
                                        MozChunkedLoader.prototype.__proto__ ||
                                            Object.getPrototypeOf(MozChunkedLoader.prototype),
                                        'destroy',
                                        this
                                    ).call(this);
                                }
                            },
                            {
                                key: 'open',
                                value: function open(dataSource, range) {
                                    this._dataSource = dataSource;
                                    this._range = range;

                                    var seekConfig = this._seekHandler.getConfig(dataSource.url, range);

                                    var xhr = (this._xhr = new XMLHttpRequest());
                                    xhr.open('GET', seekConfig.url, true);
                                    xhr.responseType = 'moz-chunked-arraybuffer';
                                    xhr.onreadystatechange = this._onReadyStateChange.bind(this);
                                    xhr.onprogress = this._onProgress.bind(this);
                                    xhr.onloadend = this._onLoadEnd.bind(this);
                                    xhr.onerror = this._onXhrError.bind(this);

                                    // cors is auto detected and enabled by xhr

                                    // withCredentials is disabled by default
                                    if (dataSource.withCredentials && xhr['withCredentials']) {
                                        xhr.withCredentials = true;
                                    }

                                    if (_typeof(seekConfig.headers) === 'object') {
                                        var headers = seekConfig.headers;

                                        for (var key in headers) {
                                            if (headers.hasOwnProperty(key)) {
                                                xhr.setRequestHeader(key, headers[key]);
                                            }
                                        }
                                    }

                                    this._status = _loader.LoaderStatus.kConnecting;
                                    xhr.send();
                                }
                            },
                            {
                                key: 'abort',
                                value: function abort() {
                                    this._requestAbort = true;
                                    if (this._xhr) {
                                        this._xhr.abort();
                                    }
                                    this._status = _loader.LoaderStatus.kComplete;
                                }
                            },
                            {
                                key: '_onReadyStateChange',
                                value: function _onReadyStateChange(e) {
                                    var xhr = e.target;

                                    if (xhr.readyState === 2) {
                                        // HEADERS_RECEIVED
                                        if (xhr.status !== 0 && (xhr.status < 200 || xhr.status > 299)) {
                                            this._status = _loader.LoaderStatus.kError;
                                            if (this._onError) {
                                                this._onError(_loader.LoaderErrors.HTTP_STATUS_CODE_INVALID, {
                                                    code: xhr.status,
                                                    msg: xhr.statusText
                                                });
                                            } else {
                                                throw new _exception.RuntimeException(
                                                    'MozChunkedLoader: Http code invalid, ' +
                                                        xhr.status +
                                                        ' ' +
                                                        xhr.statusText
                                                );
                                            }
                                        } else {
                                            this._status = _loader.LoaderStatus.kBuffering;
                                        }
                                    }
                                }
                            },
                            {
                                key: '_onProgress',
                                value: function _onProgress(e) {
                                    if (this._contentLength === null) {
                                        if (e.total !== null && e.total !== 0) {
                                            this._contentLength = e.total;
                                            if (this._onContentLengthKnown) {
                                                this._onContentLengthKnown(this._contentLength);
                                            }
                                        }
                                    }

                                    var chunk = e.target.response;
                                    var byteStart = this._range.from + this._receivedLength;
                                    this._receivedLength += chunk.byteLength;

                                    if (this._onDataArrival) {
                                        this._onDataArrival(chunk, byteStart, this._receivedLength);
                                    }
                                }
                            },
                            {
                                key: '_onLoadEnd',
                                value: function _onLoadEnd(e) {
                                    if (this._requestAbort === true) {
                                        this._requestAbort = false;
                                        return;
                                    } else if (this._status === _loader.LoaderStatus.kError) {
                                        return;
                                    }

                                    this._status = _loader.LoaderStatus.kComplete;
                                    if (this._onComplete) {
                                        this._onComplete(this._range.from, this._range.from + this._receivedLength - 1);
                                    }
                                }
                            },
                            {
                                key: '_onXhrError',
                                value: function _onXhrError(e) {
                                    this._status = _loader.LoaderStatus.kError;
                                    var type = 0;
                                    var info = null;

                                    if (this._contentLength && e.loaded < this._contentLength) {
                                        type = _loader.LoaderErrors.EARLY_EOF;
                                        info = { code: -1, msg: 'Moz-Chunked stream meet Early-Eof' };
                                    } else {
                                        type = _loader.LoaderErrors.EXCEPTION;
                                        info = { code: -1, msg: e.constructor.name + ' ' + e.type };
                                    }

                                    if (this._onError) {
                                        this._onError(type, info);
                                    } else {
                                        throw new _exception.RuntimeException(info.msg);
                                    }
                                }
                            }
                        ]);

                        return MozChunkedLoader;
                    })(_loader.BaseLoader);

                    exports.default = MozChunkedLoader;
                },
                { '../utils/exception.js': 40, '../utils/logger.js': 41, './loader.js': 24 }
            ],
            30: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _typeof =
                        typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
                            ? function (obj) {
                                  return typeof obj;
                              }
                            : function (obj) {
                                  return obj &&
                                      typeof Symbol === 'function' &&
                                      obj.constructor === Symbol &&
                                      obj !== Symbol.prototype
                                      ? 'symbol'
                                      : typeof obj;
                              };

                    var _get = function get(object, property, receiver) {
                        if (object === null) object = Function.prototype;
                        var desc = Object.getOwnPropertyDescriptor(object, property);
                        if (desc === undefined) {
                            var parent = Object.getPrototypeOf(object);
                            if (parent === null) {
                                return undefined;
                            } else {
                                return get(parent, property, receiver);
                            }
                        } else if ('value' in desc) {
                            return desc.value;
                        } else {
                            var getter = desc.get;
                            if (getter === undefined) {
                                return undefined;
                            }
                            return getter.call(receiver);
                        }
                    };

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();

                    var _logger = _dereq_('../utils/logger.js');

                    var _logger2 = _interopRequireDefault(_logger);

                    var _loader = _dereq_('./loader.js');

                    var _exception = _dereq_('../utils/exception.js');

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    function _possibleConstructorReturn(self, call) {
                        if (!self) {
                            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                        }
                        return call && (typeof call === 'object' || typeof call === 'function') ? call : self;
                    }

                    function _inherits(subClass, superClass) {
                        if (typeof superClass !== 'function' && superClass !== null) {
                            throw new TypeError(
                                'Super expression must either be null or a function, not ' + typeof superClass
                            );
                        }
                        subClass.prototype = Object.create(superClass && superClass.prototype, {
                            constructor: { value: subClass, enumerable: false, writable: true, configurable: true }
                        });
                        if (superClass)
                            Object.setPrototypeOf
                                ? Object.setPrototypeOf(subClass, superClass)
                                : (subClass.__proto__ = superClass);
                    }
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    /* Notice: ms-stream may cause IE/Edge browser crash if seek too frequently!!!
                     * The browser may crash in wininet.dll. Disable for now.
                     *
                     * For IE11/Edge browser by microsoft which supports `xhr.responseType = 'ms-stream'`
                     * Notice that ms-stream API sucks. The buffer is always expanding along with downloading.
                     *
                     * We need to abort the xhr if buffer size exceeded limit size (e.g. 16 MiB), then do reconnect.
                     * in order to release previous ArrayBuffer to avoid memory leak
                     *
                     * Otherwise, the ArrayBuffer will increase to a terrible size that equals final file size.
                     */
                    var MSStreamLoader = (function (_BaseLoader) {
                        _inherits(MSStreamLoader, _BaseLoader);

                        _createClass(MSStreamLoader, null, [
                            {
                                key: 'isSupported',
                                value: function isSupported() {
                                    try {
                                        if (
                                            typeof self.MSStream === 'undefined' ||
                                            typeof self.MSStreamReader === 'undefined'
                                        ) {
                                            return false;
                                        }

                                        var xhr = new XMLHttpRequest();
                                        xhr.open('GET', 'https://example.com', true);
                                        xhr.responseType = 'ms-stream';
                                        return xhr.responseType === 'ms-stream';
                                    } catch (e) {
                                        _logger2.default.w('MSStreamLoader', e.message);
                                        return false;
                                    }
                                }
                            }
                        ]);

                        function MSStreamLoader(seekHandler) {
                            _classCallCheck(this, MSStreamLoader);

                            var _this = _possibleConstructorReturn(
                                this,
                                (MSStreamLoader.__proto__ || Object.getPrototypeOf(MSStreamLoader)).call(
                                    this,
                                    'xhr-msstream-loader'
                                )
                            );

                            _this.TAG = 'MSStreamLoader';

                            _this._seekHandler = seekHandler;
                            _this._needStash = true;

                            _this._xhr = null;
                            _this._reader = null; // MSStreamReader

                            _this._totalRange = null;
                            _this._currentRange = null;

                            _this._contentLength = null;
                            _this._receivedLength = 0;

                            _this._bufferLimit = 16 * 1024 * 1024; // 16MB
                            _this._lastTimeBufferSize = 0;
                            _this._isReconnecting = false;
                            return _this;
                        }

                        _createClass(MSStreamLoader, [
                            {
                                key: 'destroy',
                                value: function destroy() {
                                    if (this.isWorking()) {
                                        this.abort();
                                    }
                                    if (this._reader) {
                                        this._reader.onprogress = null;
                                        this._reader.onload = null;
                                        this._reader.onerror = null;
                                        this._reader = null;
                                    }
                                    if (this._xhr) {
                                        this._xhr.onreadystatechange = null;
                                        this._xhr = null;
                                    }
                                    _get(
                                        MSStreamLoader.prototype.__proto__ ||
                                            Object.getPrototypeOf(MSStreamLoader.prototype),
                                        'destroy',
                                        this
                                    ).call(this);
                                }
                            },
                            {
                                key: 'open',
                                value: function open(dataSource, range) {
                                    this._internalOpen(dataSource, range, false);
                                }
                            },
                            {
                                key: '_internalOpen',
                                value: function _internalOpen(dataSource, range, isSubrange) {
                                    this._dataSource = dataSource;

                                    if (!isSubrange) {
                                        this._totalRange = range;
                                    } else {
                                        this._currentRange = range;
                                    }

                                    var seekConfig = this._seekHandler.getConfig(dataSource.url, range);

                                    var reader = (this._reader = new self.MSStreamReader());
                                    reader.onprogress = this._msrOnProgress.bind(this);
                                    reader.onload = this._msrOnLoad.bind(this);
                                    reader.onerror = this._msrOnError.bind(this);

                                    var xhr = (this._xhr = new XMLHttpRequest());
                                    xhr.open('GET', seekConfig.url, true);
                                    xhr.responseType = 'ms-stream';
                                    xhr.onreadystatechange = this._xhrOnReadyStateChange.bind(this);
                                    xhr.onerror = this._xhrOnError.bind(this);

                                    if (dataSource.withCredentials) {
                                        xhr.withCredentials = true;
                                    }

                                    if (_typeof(seekConfig.headers) === 'object') {
                                        var headers = seekConfig.headers;

                                        for (var key in headers) {
                                            if (headers.hasOwnProperty(key)) {
                                                xhr.setRequestHeader(key, headers[key]);
                                            }
                                        }
                                    }

                                    if (this._isReconnecting) {
                                        this._isReconnecting = false;
                                    } else {
                                        this._status = _loader.LoaderStatus.kConnecting;
                                    }
                                    xhr.send();
                                }
                            },
                            {
                                key: 'abort',
                                value: function abort() {
                                    this._internalAbort();
                                    this._status = _loader.LoaderStatus.kComplete;
                                }
                            },
                            {
                                key: '_internalAbort',
                                value: function _internalAbort() {
                                    if (this._reader) {
                                        if (this._reader.readyState === 1) {
                                            // LOADING
                                            this._reader.abort();
                                        }
                                        this._reader.onprogress = null;
                                        this._reader.onload = null;
                                        this._reader.onerror = null;
                                        this._reader = null;
                                    }
                                    if (this._xhr) {
                                        this._xhr.abort();
                                        this._xhr.onreadystatechange = null;
                                        this._xhr = null;
                                    }
                                }
                            },
                            {
                                key: '_xhrOnReadyStateChange',
                                value: function _xhrOnReadyStateChange(e) {
                                    var xhr = e.target;

                                    if (xhr.readyState === 3) {
                                        if (xhr.status >= 200 && xhr.status <= 299) {
                                            this._status = _loader.LoaderStatus.kBuffering;

                                            var lengthHeader = xhr.getResponseHeader('Content-Length');
                                            if (lengthHeader != null && this._contentLength == null) {
                                                var length = parseInt(lengthHeader);
                                                if (length > 0) {
                                                    this._contentLength = length;
                                                    if (this._onContentLengthKnown) {
                                                        this._onContentLengthKnown(this._contentLength);
                                                    }
                                                }
                                            }

                                            var msstream = xhr.response;
                                            this._reader.readAsArrayBuffer(msstream);
                                        } else {
                                            this._status = _loader.LoaderStatus.kError;
                                            if (this._onError) {
                                                this._onError(_loader.LoaderErrors.HTTP_STATUS_CODE_INVALID, {
                                                    code: xhr.status,
                                                    msg: xhr.statusText
                                                });
                                            } else {
                                                throw new _exception.RuntimeException(
                                                    'MSStreamLoader: Http code invalid, ' +
                                                        xhr.status +
                                                        ' ' +
                                                        xhr.statusText
                                                );
                                            }
                                        }
                                    }
                                }
                            },
                            {
                                key: '_xhrOnError',
                                value: function _xhrOnError(e) {
                                    this._status = _loader.LoaderStatus.kError;
                                    var type = _loader.LoaderErrors.EXCEPTION;
                                    var info = { code: -1, msg: e.constructor.name + ' ' + e.type };

                                    if (this._onError) {
                                        this._onError(type, info);
                                    } else {
                                        throw new _exception.RuntimeException(info.msg);
                                    }
                                }
                            },
                            {
                                key: '_msrOnProgress',
                                value: function _msrOnProgress(e) {
                                    var reader = e.target;
                                    var bigbuffer = reader.result;
                                    if (bigbuffer == null) {
                                        // result may be null, workaround for buggy M$
                                        this._doReconnectIfNeeded();
                                        return;
                                    }

                                    var slice = bigbuffer.slice(this._lastTimeBufferSize);
                                    this._lastTimeBufferSize = bigbuffer.byteLength;
                                    var byteStart = this._totalRange.from + this._receivedLength;
                                    this._receivedLength += slice.byteLength;

                                    if (this._onDataArrival) {
                                        this._onDataArrival(slice, byteStart, this._receivedLength);
                                    }

                                    if (bigbuffer.byteLength >= this._bufferLimit) {
                                        _logger2.default.v(
                                            this.TAG,
                                            'MSStream buffer exceeded max size near ' +
                                                (byteStart + slice.byteLength) +
                                                ', reconnecting...'
                                        );
                                        this._doReconnectIfNeeded();
                                    }
                                }
                            },
                            {
                                key: '_doReconnectIfNeeded',
                                value: function _doReconnectIfNeeded() {
                                    if (this._contentLength == null || this._receivedLength < this._contentLength) {
                                        this._isReconnecting = true;
                                        this._lastTimeBufferSize = 0;
                                        this._internalAbort();

                                        var range = {
                                            from: this._totalRange.from + this._receivedLength,
                                            to: -1
                                        };
                                        this._internalOpen(this._dataSource, range, true);
                                    }
                                }
                            },
                            {
                                key: '_msrOnLoad',
                                value: function _msrOnLoad(e) {
                                    // actually it is onComplete event
                                    this._status = _loader.LoaderStatus.kComplete;
                                    if (this._onComplete) {
                                        this._onComplete(
                                            this._totalRange.from,
                                            this._totalRange.from + this._receivedLength - 1
                                        );
                                    }
                                }
                            },
                            {
                                key: '_msrOnError',
                                value: function _msrOnError(e) {
                                    this._status = _loader.LoaderStatus.kError;
                                    var type = 0;
                                    var info = null;

                                    if (this._contentLength && this._receivedLength < this._contentLength) {
                                        type = _loader.LoaderErrors.EARLY_EOF;
                                        info = { code: -1, msg: 'MSStream meet Early-Eof' };
                                    } else {
                                        type = _loader.LoaderErrors.EARLY_EOF;
                                        info = { code: -1, msg: e.constructor.name + ' ' + e.type };
                                    }

                                    if (this._onError) {
                                        this._onError(type, info);
                                    } else {
                                        throw new _exception.RuntimeException(info.msg);
                                    }
                                }
                            }
                        ]);

                        return MSStreamLoader;
                    })(_loader.BaseLoader);

                    exports.default = MSStreamLoader;
                },
                { '../utils/exception.js': 40, '../utils/logger.js': 41, './loader.js': 24 }
            ],
            31: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _typeof =
                        typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
                            ? function (obj) {
                                  return typeof obj;
                              }
                            : function (obj) {
                                  return obj &&
                                      typeof Symbol === 'function' &&
                                      obj.constructor === Symbol &&
                                      obj !== Symbol.prototype
                                      ? 'symbol'
                                      : typeof obj;
                              };

                    var _get = function get(object, property, receiver) {
                        if (object === null) object = Function.prototype;
                        var desc = Object.getOwnPropertyDescriptor(object, property);
                        if (desc === undefined) {
                            var parent = Object.getPrototypeOf(object);
                            if (parent === null) {
                                return undefined;
                            } else {
                                return get(parent, property, receiver);
                            }
                        } else if ('value' in desc) {
                            return desc.value;
                        } else {
                            var getter = desc.get;
                            if (getter === undefined) {
                                return undefined;
                            }
                            return getter.call(receiver);
                        }
                    };

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();

                    var _logger = _dereq_('../utils/logger.js');

                    var _logger2 = _interopRequireDefault(_logger);

                    var _speedSampler = _dereq_('./speed-sampler.js');

                    var _speedSampler2 = _interopRequireDefault(_speedSampler);

                    var _loader = _dereq_('./loader.js');

                    var _exception = _dereq_('../utils/exception.js');

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    function _possibleConstructorReturn(self, call) {
                        if (!self) {
                            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                        }
                        return call && (typeof call === 'object' || typeof call === 'function') ? call : self;
                    }

                    function _inherits(subClass, superClass) {
                        if (typeof superClass !== 'function' && superClass !== null) {
                            throw new TypeError(
                                'Super expression must either be null or a function, not ' + typeof superClass
                            );
                        }
                        subClass.prototype = Object.create(superClass && superClass.prototype, {
                            constructor: { value: subClass, enumerable: false, writable: true, configurable: true }
                        });
                        if (superClass)
                            Object.setPrototypeOf
                                ? Object.setPrototypeOf(subClass, superClass)
                                : (subClass.__proto__ = superClass);
                    }
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    // Universal IO Loader, implemented by adding Range header in xhr's request header
                    var RangeLoader = (function (_BaseLoader) {
                        _inherits(RangeLoader, _BaseLoader);

                        _createClass(RangeLoader, null, [
                            {
                                key: 'isSupported',
                                value: function isSupported() {
                                    try {
                                        var xhr = new XMLHttpRequest();
                                        xhr.open('GET', 'https://example.com', true);
                                        xhr.responseType = 'arraybuffer';
                                        return xhr.responseType === 'arraybuffer';
                                    } catch (e) {
                                        _logger2.default.w('RangeLoader', e.message);
                                        return false;
                                    }
                                }
                            }
                        ]);

                        function RangeLoader(seekHandler) {
                            _classCallCheck(this, RangeLoader);

                            var _this = _possibleConstructorReturn(
                                this,
                                (RangeLoader.__proto__ || Object.getPrototypeOf(RangeLoader)).call(
                                    this,
                                    'xhr-range-loader'
                                )
                            );

                            _this.TAG = 'RangeLoader';

                            _this._seekHandler = seekHandler;
                            _this._needStash = false;

                            _this._chunkSizeKBList = [
                                128,
                                256,
                                384,
                                512,
                                768,
                                1024,
                                1536,
                                2048,
                                3072,
                                4096,
                                5120,
                                6144,
                                7168,
                                8192
                            ];
                            _this._currentChunkSizeKB = 384;
                            _this._currentSpeedNormalized = 0;
                            _this._zeroSpeedChunkCount = 0;

                            _this._xhr = null;
                            _this._speedSampler = new _speedSampler2.default();

                            _this._requestAbort = false;
                            _this._waitForTotalLength = false;
                            _this._totalLengthReceived = false;

                            _this._currentRequestRange = null;
                            _this._totalLength = null; // size of the entire file
                            _this._contentLength = null; // Content-Length of entire request range
                            _this._receivedLength = 0; // total received bytes
                            _this._lastTimeLoaded = 0; // received bytes of current request sub-range
                            return _this;
                        }

                        _createClass(RangeLoader, [
                            {
                                key: 'destroy',
                                value: function destroy() {
                                    if (this.isWorking()) {
                                        this.abort();
                                    }
                                    if (this._xhr) {
                                        this._xhr.onreadystatechange = null;
                                        this._xhr.onprogress = null;
                                        this._xhr.onload = null;
                                        this._xhr.onerror = null;
                                        this._xhr = null;
                                    }
                                    _get(
                                        RangeLoader.prototype.__proto__ || Object.getPrototypeOf(RangeLoader.prototype),
                                        'destroy',
                                        this
                                    ).call(this);
                                }
                            },
                            {
                                key: 'open',
                                value: function open(dataSource, range) {
                                    this._dataSource = dataSource;
                                    this._range = range;
                                    this._status = _loader.LoaderStatus.kConnecting;

                                    if (!this._totalLengthReceived) {
                                        // We need total filesize
                                        this._waitForTotalLength = true;
                                        this._internalOpen(this._dataSource, { from: 0, to: -1 });
                                    } else {
                                        // We have filesize, start loading
                                        this._openSubRange();
                                    }
                                }
                            },
                            {
                                key: '_openSubRange',
                                value: function _openSubRange() {
                                    var chunkSize = this._currentChunkSizeKB * 1024;

                                    var from = this._range.from + this._receivedLength;
                                    var to = from + chunkSize;

                                    if (this._contentLength != null) {
                                        if (to - this._range.from >= this._contentLength) {
                                            to = this._range.from + this._contentLength - 1;
                                        }
                                    }

                                    this._currentRequestRange = { from: from, to: to };
                                    this._internalOpen(this._dataSource, this._currentRequestRange);
                                }
                            },
                            {
                                key: '_internalOpen',
                                value: function _internalOpen(dataSource, range) {
                                    this._lastTimeLoaded = 0;

                                    var seekConfig = this._seekHandler.getConfig(dataSource.url, range);

                                    var xhr = (this._xhr = new XMLHttpRequest());
                                    xhr.open('GET', seekConfig.url, true);
                                    xhr.responseType = 'arraybuffer';
                                    xhr.onreadystatechange = this._onReadyStateChange.bind(this);
                                    xhr.onprogress = this._onProgress.bind(this);
                                    xhr.onload = this._onLoad.bind(this);
                                    xhr.onerror = this._onXhrError.bind(this);

                                    if (dataSource.withCredentials && xhr['withCredentials']) {
                                        xhr.withCredentials = true;
                                    }

                                    if (_typeof(seekConfig.headers) === 'object') {
                                        var headers = seekConfig.headers;

                                        for (var key in headers) {
                                            if (headers.hasOwnProperty(key)) {
                                                xhr.setRequestHeader(key, headers[key]);
                                            }
                                        }
                                    }

                                    xhr.send();
                                }
                            },
                            {
                                key: 'abort',
                                value: function abort() {
                                    this._requestAbort = true;
                                    this._internalAbort();
                                    this._status = _loader.LoaderStatus.kComplete;
                                }
                            },
                            {
                                key: '_internalAbort',
                                value: function _internalAbort() {
                                    if (this._xhr) {
                                        this._xhr.onreadystatechange = null;
                                        this._xhr.onprogress = null;
                                        this._xhr.onload = null;
                                        this._xhr.onerror = null;
                                        this._xhr.abort();
                                        this._xhr = null;
                                    }
                                }
                            },
                            {
                                key: '_onReadyStateChange',
                                value: function _onReadyStateChange(e) {
                                    var xhr = e.target;

                                    if (xhr.readyState === 2) {
                                        // HEADERS_RECEIVED
                                        if (xhr.status >= 200 && xhr.status < 300) {
                                            if (this._waitForTotalLength) {
                                                return;
                                            }
                                            this._status = _loader.LoaderStatus.kBuffering;
                                        } else {
                                            this._status = _loader.LoaderStatus.kError;
                                            if (this._onError) {
                                                this._onError(_loader.LoaderErrors.HTTP_STATUS_CODE_INVALID, {
                                                    code: xhr.status,
                                                    msg: xhr.statusText
                                                });
                                            } else {
                                                throw new _exception.RuntimeException(
                                                    'RangeLoader: Http code invalid, ' +
                                                        xhr.status +
                                                        ' ' +
                                                        xhr.statusText
                                                );
                                            }
                                        }
                                    }
                                }
                            },
                            {
                                key: '_onProgress',
                                value: function _onProgress(e) {
                                    if (this._contentLength === null) {
                                        var openNextRange = false;

                                        if (this._waitForTotalLength) {
                                            this._waitForTotalLength = false;
                                            this._totalLengthReceived = true;
                                            openNextRange = true;

                                            var total = e.total;
                                            this._internalAbort();
                                            if ((total != null) & (total !== 0)) {
                                                this._totalLength = total;
                                            }
                                        }

                                        // calculate currrent request range's contentLength
                                        if (this._range.to === -1) {
                                            this._contentLength = this._totalLength - this._range.from;
                                        } else {
                                            // to !== -1
                                            this._contentLength = this._range.to - this._range.from + 1;
                                        }

                                        if (openNextRange) {
                                            this._openSubRange();
                                            return;
                                        }
                                        if (this._onContentLengthKnown) {
                                            this._onContentLengthKnown(this._contentLength);
                                        }
                                    }

                                    var delta = e.loaded - this._lastTimeLoaded;
                                    this._lastTimeLoaded = e.loaded;
                                    this._speedSampler.addBytes(delta);
                                }
                            },
                            {
                                key: '_normalizeSpeed',
                                value: function _normalizeSpeed(input) {
                                    var list = this._chunkSizeKBList;
                                    var last = list.length - 1;
                                    var mid = 0;
                                    var lbound = 0;
                                    var ubound = last;

                                    if (input < list[0]) {
                                        return list[0];
                                    }

                                    while (lbound <= ubound) {
                                        mid = lbound + Math.floor((ubound - lbound) / 2);
                                        if (mid === last || (input >= list[mid] && input < list[mid + 1])) {
                                            return list[mid];
                                        } else if (list[mid] < input) {
                                            lbound = mid + 1;
                                        } else {
                                            ubound = mid - 1;
                                        }
                                    }
                                }
                            },
                            {
                                key: '_onLoad',
                                value: function _onLoad(e) {
                                    if (this._waitForTotalLength) {
                                        this._waitForTotalLength = false;
                                        return;
                                    }

                                    this._lastTimeLoaded = 0;
                                    var KBps = this._speedSampler.lastSecondKBps;
                                    if (KBps === 0) {
                                        this._zeroSpeedChunkCount++;
                                        if (this._zeroSpeedChunkCount >= 3) {
                                            // Try get currentKBps after 3 chunks
                                            KBps = this._speedSampler.currentKBps;
                                        }
                                    }

                                    if (KBps !== 0) {
                                        var normalized = this._normalizeSpeed(KBps);
                                        if (this._currentSpeedNormalized !== normalized) {
                                            this._currentSpeedNormalized = normalized;
                                            this._currentChunkSizeKB = normalized;
                                        }
                                    }

                                    var chunk = e.target.response;
                                    var byteStart = this._range.from + this._receivedLength;
                                    this._receivedLength += chunk.byteLength;

                                    var reportComplete = false;

                                    if (this._contentLength != null && this._receivedLength < this._contentLength) {
                                        // continue load next chunk
                                        this._openSubRange();
                                    } else {
                                        reportComplete = true;
                                    }

                                    // dispatch received chunk
                                    if (this._onDataArrival) {
                                        this._onDataArrival(chunk, byteStart, this._receivedLength);
                                    }

                                    if (reportComplete) {
                                        this._status = _loader.LoaderStatus.kComplete;
                                        if (this._onComplete) {
                                            this._onComplete(
                                                this._range.from,
                                                this._range.from + this._receivedLength - 1
                                            );
                                        }
                                    }
                                }
                            },
                            {
                                key: '_onXhrError',
                                value: function _onXhrError(e) {
                                    this._status = _loader.LoaderStatus.kError;
                                    var type = 0;
                                    var info = null;

                                    if (
                                        this._contentLength &&
                                        this._receivedLength > 0 &&
                                        this._receivedLength < this._contentLength
                                    ) {
                                        type = _loader.LoaderErrors.EARLY_EOF;
                                        info = { code: -1, msg: 'RangeLoader meet Early-Eof' };
                                    } else {
                                        type = _loader.LoaderErrors.EXCEPTION;
                                        info = { code: -1, msg: e.constructor.name + ' ' + e.type };
                                    }

                                    if (this._onError) {
                                        this._onError(type, info);
                                    } else {
                                        throw new _exception.RuntimeException(info.msg);
                                    }
                                }
                            },
                            {
                                key: 'currentSpeed',
                                get: function get() {
                                    return this._speedSampler.lastSecondKBps;
                                }
                            }
                        ]);

                        return RangeLoader;
                    })(_loader.BaseLoader);

                    exports.default = RangeLoader;
                },
                { '../utils/exception.js': 40, '../utils/logger.js': 41, './loader.js': 24, './speed-sampler.js': 27 }
            ],
            32: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _typeof =
                        typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
                            ? function (obj) {
                                  return typeof obj;
                              }
                            : function (obj) {
                                  return obj &&
                                      typeof Symbol === 'function' &&
                                      obj.constructor === Symbol &&
                                      obj !== Symbol.prototype
                                      ? 'symbol'
                                      : typeof obj;
                              };

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var _events = _dereq_('events');

                    var _events2 = _interopRequireDefault(_events);

                    var _logger = _dereq_('../utils/logger.js');

                    var _logger2 = _interopRequireDefault(_logger);

                    var _browser = _dereq_('../utils/browser.js');

                    var _browser2 = _interopRequireDefault(_browser);

                    var _playerEvents = _dereq_('./player-events.js');

                    var _playerEvents2 = _interopRequireDefault(_playerEvents);

                    var _transmuxer = _dereq_('../core/transmuxer.js');

                    var _transmuxer2 = _interopRequireDefault(_transmuxer);

                    var _transmuxingEvents = _dereq_('../core/transmuxing-events.js');

                    var _transmuxingEvents2 = _interopRequireDefault(_transmuxingEvents);

                    var _mseController = _dereq_('../core/mse-controller.js');

                    var _mseController2 = _interopRequireDefault(_mseController);

                    var _mseEvents = _dereq_('../core/mse-events.js');

                    var _mseEvents2 = _interopRequireDefault(_mseEvents);

                    var _playerErrors = _dereq_('./player-errors.js');

                    var _config = _dereq_('../config.js');

                    var _exception = _dereq_('../utils/exception.js');

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    var FlvPlayer = (function () {
                        function FlvPlayer(mediaDataSource, config) {
                            _classCallCheck(this, FlvPlayer);

                            this.TAG = 'FlvPlayer';
                            this._type = 'FlvPlayer';
                            this._emitter = new _events2.default();

                            this._config = (0, _config.createDefaultConfig)();
                            if ((typeof config === 'undefined' ? 'undefined' : _typeof(config)) === 'object') {
                                Object.assign(this._config, config);
                            }

                            if (mediaDataSource.type.toLowerCase() !== 'flv') {
                                throw new _exception.InvalidArgumentException(
                                    'FlvPlayer requires an flv MediaDataSource input!'
                                );
                            }

                            if (mediaDataSource.isLive === true) {
                                this._config.isLive = true;
                            }

                            this.e = {
                                onvLoadedMetadata: this._onvLoadedMetadata.bind(this),
                                onvSeeking: this._onvSeeking.bind(this),
                                onvCanPlay: this._onvCanPlay.bind(this),
                                onvStalled: this._onvStalled.bind(this),
                                onvProgress: this._onvProgress.bind(this)
                            };

                            if (self.performance && self.performance.now) {
                                this._now = self.performance.now.bind(self.performance);
                            } else {
                                this._now = Date.now;
                            }

                            this._pendingSeekTime = null; // in seconds
                            this._requestSetTime = false;
                            this._seekpointRecord = null;
                            this._progressChecker = null;

                            this._mediaDataSource = mediaDataSource;
                            this._mediaElement = null;
                            this._msectl = null;
                            this._transmuxer = null;

                            this._mseSourceOpened = false;
                            this._hasPendingLoad = false;
                            this._receivedCanPlay = false;

                            this._mediaInfo = null;
                            this._statisticsInfo = null;

                            var chromeNeedIDRFix =
                                _browser2.default.chrome &&
                                (_browser2.default.version.major < 50 ||
                                    (_browser2.default.version.major === 50 && _browser2.default.version.build < 2661));
                            this._alwaysSeekKeyframe =
                                chromeNeedIDRFix || _browser2.default.msedge || _browser2.default.msie ? true : false;

                            if (this._alwaysSeekKeyframe) {
                                this._config.accurateSeek = false;
                            }
                        }

                        _createClass(FlvPlayer, [
                            {
                                key: 'destroy',
                                value: function destroy() {
                                    if (this._progressChecker != null) {
                                        window.clearInterval(this._progressChecker);
                                        this._progressChecker = null;
                                    }
                                    if (this._transmuxer) {
                                        this.unload();
                                    }
                                    if (this._mediaElement) {
                                        this.detachMediaElement();
                                    }
                                    this.e = null;
                                    this._mediaDataSource = null;

                                    this._emitter.removeAllListeners();
                                    this._emitter = null;
                                }
                            },
                            {
                                key: 'on',
                                value: function on(event, listener) {
                                    var _this = this;

                                    if (event === _playerEvents2.default.MEDIA_INFO) {
                                        if (this._mediaInfo != null) {
                                            Promise.resolve().then(function () {
                                                _this._emitter.emit(_playerEvents2.default.MEDIA_INFO, _this.mediaInfo);
                                            });
                                        }
                                    } else if (event === _playerEvents2.default.STATISTICS_INFO) {
                                        if (this._statisticsInfo != null) {
                                            Promise.resolve().then(function () {
                                                _this._emitter.emit(
                                                    _playerEvents2.default.STATISTICS_INFO,
                                                    _this.statisticsInfo
                                                );
                                            });
                                        }
                                    }
                                    this._emitter.addListener(event, listener);
                                }
                            },
                            {
                                key: 'off',
                                value: function off(event, listener) {
                                    this._emitter.removeListener(event, listener);
                                }
                            },
                            {
                                key: 'attachMediaElement',
                                value: function attachMediaElement(mediaElement) {
                                    var _this2 = this;

                                    this._mediaElement = mediaElement;
                                    mediaElement.addEventListener('loadedmetadata', this.e.onvLoadedMetadata);
                                    mediaElement.addEventListener('seeking', this.e.onvSeeking);
                                    mediaElement.addEventListener('canplay', this.e.onvCanPlay);
                                    mediaElement.addEventListener('stalled', this.e.onvStalled);
                                    mediaElement.addEventListener('progress', this.e.onvProgress);

                                    this._msectl = new _mseController2.default();

                                    this._msectl.on(_mseEvents2.default.UPDATE_END, this._onmseUpdateEnd.bind(this));
                                    this._msectl.on(_mseEvents2.default.BUFFER_FULL, this._onmseBufferFull.bind(this));
                                    this._msectl.on(_mseEvents2.default.SOURCE_OPEN, function () {
                                        _this2._mseSourceOpened = true;
                                        if (_this2._hasPendingLoad) {
                                            _this2._hasPendingLoad = false;
                                            _this2.load();
                                        }
                                    });
                                    this._msectl.on(_mseEvents2.default.ERROR, function (info) {
                                        _this2._emitter.emit(
                                            _playerEvents2.default.ERROR,
                                            _playerErrors.ErrorTypes.MEDIA_ERROR,
                                            _playerErrors.ErrorDetails.MEDIA_MSE_ERROR,
                                            info
                                        );
                                    });

                                    this._msectl.attachMediaElement(mediaElement);

                                    if (this._pendingSeekTime != null) {
                                        try {
                                            mediaElement.currentTime = this._pendingSeekTime;
                                            this._pendingSeekTime = null;
                                        } catch (e) {
                                            // IE11 may throw InvalidStateError if readyState === 0
                                            // We can defer set currentTime operation after loadedmetadata
                                        }
                                    }
                                }
                            },
                            {
                                key: 'detachMediaElement',
                                value: function detachMediaElement() {
                                    if (this._mediaElement) {
                                        this._msectl.detachMediaElement();
                                        this._mediaElement.removeEventListener(
                                            'loadedmetadata',
                                            this.e.onvLoadedMetadata
                                        );
                                        this._mediaElement.removeEventListener('seeking', this.e.onvSeeking);
                                        this._mediaElement.removeEventListener('canplay', this.e.onvCanPlay);
                                        this._mediaElement.removeEventListener('stalled', this.e.onvStalled);
                                        this._mediaElement.removeEventListener('progress', this.e.onvProgress);
                                        this._mediaElement = null;
                                    }
                                    if (this._msectl) {
                                        this._msectl.destroy();
                                        this._msectl = null;
                                    }
                                }
                            },
                            {
                                key: 'load',
                                value: function load() {
                                    var _this3 = this;

                                    if (!this._mediaElement) {
                                        throw new _exception.IllegalStateException(
                                            'HTMLMediaElement must be attached before load()!'
                                        );
                                    }
                                    if (this._transmuxer) {
                                        throw new _exception.IllegalStateException(
                                            'FlvPlayer.load() has been called, please call unload() first!'
                                        );
                                    }
                                    if (this._hasPendingLoad) {
                                        return;
                                    }

                                    if (this._config.deferLoadAfterSourceOpen && this._mseSourceOpened === false) {
                                        this._hasPendingLoad = true;
                                        return;
                                    }

                                    if (this._mediaElement.readyState > 0) {
                                        this._requestSetTime = true;
                                        // IE11 may throw InvalidStateError if readyState === 0
                                        this._mediaElement.currentTime = 0;
                                    }

                                    this._transmuxer = new _transmuxer2.default(this._mediaDataSource, this._config);

                                    this._transmuxer.on(_transmuxingEvents2.default.INIT_SEGMENT, function (type, is) {
                                        _this3._msectl.appendInitSegment(is);
                                    });
                                    this._transmuxer.on(_transmuxingEvents2.default.MEDIA_SEGMENT, function (type, ms) {
                                        //wytest
                                        //return;

                                        _this3._msectl.appendMediaSegment(ms);

                                        //wy更新播放状态
                                        _this3._msectl.update(_this3._config.isLive);

                                        // lazyLoad check
                                        if (_this3._config.lazyLoad && !_this3._config.isLive) {
                                            var currentTime = _this3._mediaElement.currentTime;
                                            if (
                                                ms.info.endDts >=
                                                (currentTime + _this3._config.lazyLoadMaxDuration) * 1000
                                            ) {
                                                if (_this3._progressChecker == null) {
                                                    //_logger2.default.v(_this3.TAG, 'Maximum buffering duration exceeded, suspend transmuxing task');
                                                    //_this3._msectl.log();
                                                    //_this3._suspendTransmuxer();
                                                }
                                            }
                                        }
                                    });
                                    this._transmuxer.on(_transmuxingEvents2.default.LOADING_COMPLETE, function () {
                                        _this3._msectl.endOfStream();
                                        _this3._emitter.emit(_playerEvents2.default.LOADING_COMPLETE);
                                    });
                                    this._transmuxer.on(_transmuxingEvents2.default.RECOVERED_EARLY_EOF, function () {
                                        _this3._emitter.emit(_playerEvents2.default.RECOVERED_EARLY_EOF);
                                    });
                                    this._transmuxer.on(_transmuxingEvents2.default.IO_ERROR, function (detail, info) {
                                        _this3._emitter.emit(
                                            _playerEvents2.default.ERROR,
                                            _playerErrors.ErrorTypes.NETWORK_ERROR,
                                            detail,
                                            info
                                        );
                                    });
                                    this._transmuxer.on(_transmuxingEvents2.default.DEMUX_ERROR, function (
                                        detail,
                                        info
                                    ) {
                                        _this3._emitter.emit(
                                            _playerEvents2.default.ERROR,
                                            _playerErrors.ErrorTypes.MEDIA_ERROR,
                                            detail,
                                            { code: -1, msg: info }
                                        );
                                    });
                                    this._transmuxer.on(_transmuxingEvents2.default.MEDIA_INFO, function (mediaInfo) {
                                        _this3._mediaInfo = mediaInfo;
                                        _this3._emitter.emit(
                                            _playerEvents2.default.MEDIA_INFO,
                                            Object.assign({}, mediaInfo)
                                        );
                                    });
                                    this._transmuxer.on(_transmuxingEvents2.default.STATISTICS_INFO, function (
                                        statInfo
                                    ) {
                                        _this3._statisticsInfo = _this3._fillStatisticsInfo(statInfo);
                                        _this3._emitter.emit(
                                            _playerEvents2.default.STATISTICS_INFO,
                                            Object.assign({}, _this3._statisticsInfo)
                                        );
                                    });
                                    this._transmuxer.on(_transmuxingEvents2.default.RECOMMEND_SEEKPOINT, function (
                                        milliseconds
                                    ) {
                                        if (_this3._mediaElement && !_this3._config.accurateSeek) {
                                            _this3._requestSetTime = true;
                                            _this3._mediaElement.currentTime = milliseconds / 1000;
                                        }
                                    });

                                    this._transmuxer.open();
                                }
                            },
                            {
                                key: 'unload',
                                value: function unload() {
                                    if (this._mediaElement) {
                                        this._mediaElement.pause();
                                    }
                                    if (this._msectl) {
                                        this._msectl.seek(0);
                                    }
                                    if (this._transmuxer) {
                                        this._transmuxer.close();
                                        this._transmuxer.destroy();
                                        this._transmuxer = null;
                                    }
                                }
                            },
                            {
                                key: 'play',
                                value: function play() {
                                    this._mediaElement.play();
                                }
                            },
                            {
                                //wy
                                key: 'changestream',
                                value: function changestream(streamtype) {
                                    var url = this._mediaDataSource.url;
                                    var newurl;
                                    if (streamtype) {
                                        if (url.indexOf('st=') > 0) newurl = url.replace('st=0', 'st=1');
                                        else newurl = url + '&st=1';
                                    } else {
                                        if (url.indexOf('st=') > 0) newurl = url.replace('st=1', 'st=0');
                                        else newurl = url + '&st=0';
                                    }

                                    this.unload();
                                    this._mediaDataSource.url = newurl;
                                    this._mediaDataSource.segments[0].url = newurl;
                                    this.load();
                                    this.play();
                                }
                            },
                            {
                                //wy
                                key: 'seek',
                                value: function seek(time) {
                                    var url = this._mediaDataSource.url;
                                    var newurl;
                                    if (time) {
                                        var pos = url.indexOf('starttime=');
                                        if (pos > 0) {
                                            var timestr = url.substr(pos, 24);
                                            newurl = url.replace(timestr, 'starttime=' + time);
                                        }
                                    }
                                    this.unload();
                                    this._mediaDataSource.url = newurl;
                                    this._mediaDataSource.segments[0].url = newurl;
                                    this.load();
                                    this.play();
                                }
                            },
                            {
                                key: 'pause',
                                value: function pause() {
                                    this._mediaElement.pause();
                                }
                            },
                            {
                                key: '_fillStatisticsInfo',
                                value: function _fillStatisticsInfo(statInfo) {
                                    statInfo.playerType = this._type;

                                    if (!(this._mediaElement instanceof HTMLVideoElement)) {
                                        return statInfo;
                                    }

                                    var hasQualityInfo = true;
                                    var decoded = 0;
                                    var dropped = 0;

                                    if (this._mediaElement.getVideoPlaybackQuality) {
                                        var quality = this._mediaElement.getVideoPlaybackQuality();
                                        decoded = quality.totalVideoFrames;
                                        dropped = quality.droppedVideoFrames;
                                    } else if (this._mediaElement.webkitDecodedFrameCount != undefined) {
                                        decoded = this._mediaElement.webkitDecodedFrameCount;
                                        dropped = this._mediaElement.webkitDroppedFrameCount;
                                    } else {
                                        hasQualityInfo = false;
                                    }

                                    if (hasQualityInfo) {
                                        statInfo.decodedFrames = decoded;
                                        statInfo.droppedFrames = dropped;
                                    }

                                    return statInfo;
                                }
                            },
                            {
                                key: '_onmseUpdateEnd',
                                value: function _onmseUpdateEnd() {
                                    if (!this._config.lazyLoad || this._config.isLive) {
                                        return;
                                    }

                                    var buffered = this._mediaElement.buffered;
                                    var currentTime = this._mediaElement.currentTime;
                                    var currentRangeStart = 0;
                                    var currentRangeEnd = 0;

                                    for (var i = 0; i < buffered.length; i++) {
                                        var start = buffered.start(i);
                                        var end = buffered.end(i);
                                        if (start <= currentTime && currentTime < end) {
                                            currentRangeStart = start;
                                            currentRangeEnd = end;
                                            break;
                                        }
                                    }

                                    if (
                                        currentRangeEnd >= currentTime + this._config.lazyLoadMaxDuration &&
                                        this._progressChecker == null
                                    ) {
                                        _logger2.default.v(
                                            this.TAG,
                                            'Maximum buffering duration exceeded, suspend transmuxing task'
                                        );
                                        this._suspendTransmuxer();
                                    }
                                }
                            },
                            {
                                key: '_onmseBufferFull',
                                value: function _onmseBufferFull() {
                                    _logger2.default.v(this.TAG, 'MSE SourceBuffer is full, suspend transmuxing task');
                                    if (this._progressChecker == null) {
                                        this._suspendTransmuxer();
                                    }
                                }
                            },
                            {
                                key: '_suspendTransmuxer',
                                value: function _suspendTransmuxer() {
                                    if (this._transmuxer) {
                                        this._transmuxer.pause();

                                        if (this._progressChecker == null) {
                                            this._progressChecker = window.setInterval(
                                                this._checkProgressAndResume.bind(this),
                                                1000
                                            );
                                        }
                                    }
                                }
                            },
                            {
                                key: '_checkProgressAndResume',
                                value: function _checkProgressAndResume() {
                                    var currentTime = this._mediaElement.currentTime;
                                    var buffered = this._mediaElement.buffered;

                                    var needResume = 0;

                                    for (var i = 0; i < buffered.length; i++) {
                                        var from = buffered.start(i);
                                        var to = buffered.end(i);
                                        /*
                if (currentTime >= from && currentTime < to) {
                    if (currentTime >= to - this._config.lazyLoadRecoverDuration) {
                        needResume = to;
                    }
                    break;
                }
                */
                                        //wy
                                        if (currentTime >= from) {
                                            if (currentTime >= to - this._config.lazyLoadRecoverDuration) {
                                                needResume = to;
                                            }
                                            break;
                                        }
                                    }

                                    if (needResume) {
                                        window.clearInterval(this._progressChecker);
                                        this._progressChecker = null;
                                        if (needResume) {
                                            _logger2.default.v(this.TAG, 'Continue loading from paused position');
                                            this._transmuxer.resume(needResume * 1000);
                                        }
                                    }
                                }
                            },
                            {
                                key: '_isTimepointBuffered',
                                value: function _isTimepointBuffered(seconds) {
                                    var buffered = this._mediaElement.buffered;

                                    for (var i = 0; i < buffered.length; i++) {
                                        var from = buffered.start(i);
                                        var to = buffered.end(i);
                                        if (seconds >= from && seconds < to) {
                                            return true;
                                        }
                                    }
                                    return false;
                                }
                            },
                            {
                                key: '_internalSeek',
                                value: function _internalSeek(seconds) {
                                    var directSeek = this._isTimepointBuffered(seconds);

                                    var directSeekBegin = false;
                                    var directSeekBeginTime = 0;

                                    if (seconds < 1.0 && this._mediaElement.buffered.length > 0) {
                                        var videoBeginTime = this._mediaElement.buffered.start(0);
                                        if (
                                            (videoBeginTime < 1.0 && seconds < videoBeginTime) ||
                                            _browser2.default.safari
                                        ) {
                                            directSeekBegin = true;
                                            // also workaround for Safari: Seek to 0 may cause video stuck, use 0.1 to avoid
                                            directSeekBeginTime = _browser2.default.safari ? 0.1 : videoBeginTime;
                                        }
                                    }

                                    if (directSeekBegin) {
                                        // seek to video begin, set currentTime directly if beginPTS buffered
                                        this._requestSetTime = true;
                                        this._mediaElement.currentTime = directSeekBeginTime;
                                    } else if (directSeek) {
                                        // buffered position
                                        if (!this._alwaysSeekKeyframe) {
                                            this._requestSetTime = true;
                                            this._mediaElement.currentTime = seconds;
                                        } else {
                                            var idr = this._msectl.getNearestKeyframe(Math.floor(seconds * 1000));
                                            this._requestSetTime = true;
                                            if (idr != null) {
                                                this._mediaElement.currentTime = idr.dts / 1000;
                                            } else {
                                                this._mediaElement.currentTime = seconds;
                                            }
                                        }
                                        if (this._progressChecker != null) {
                                            this._checkProgressAndResume();
                                        }
                                    } else {
                                        if (this._progressChecker != null) {
                                            window.clearInterval(this._progressChecker);
                                            this._progressChecker = null;
                                        }
                                        this._msectl.seek(seconds);
                                        this._transmuxer.seek(Math.floor(seconds * 1000)); // in milliseconds
                                        // no need to set mediaElement.currentTime if non-accurateSeek,
                                        // just wait for the recommend_seekpoint callback
                                        if (this._config.accurateSeek) {
                                            this._requestSetTime = true;
                                            this._mediaElement.currentTime = seconds;
                                        }
                                    }
                                }
                            },
                            {
                                key: '_checkAndApplyUnbufferedSeekpoint',
                                value: function _checkAndApplyUnbufferedSeekpoint() {
                                    if (this._seekpointRecord) {
                                        if (this._seekpointRecord.recordTime <= this._now() - 100) {
                                            var target = this._mediaElement.currentTime;
                                            this._seekpointRecord = null;
                                            if (!this._isTimepointBuffered(target)) {
                                                if (this._progressChecker != null) {
                                                    window.clearTimeout(this._progressChecker);
                                                    this._progressChecker = null;
                                                }
                                                // .currentTime is consists with .buffered timestamp
                                                // Chrome/Edge use DTS, while FireFox/Safari use PTS
                                                this._msectl.seek(target);
                                                this._transmuxer.seek(Math.floor(target * 1000));
                                                // set currentTime if accurateSeek, or wait for recommend_seekpoint callback
                                                if (this._config.accurateSeek) {
                                                    this._requestSetTime = true;
                                                    this._mediaElement.currentTime = target;
                                                }
                                            }
                                        } else {
                                            window.setTimeout(this._checkAndApplyUnbufferedSeekpoint.bind(this), 50);
                                        }
                                    }
                                }
                            },
                            {
                                key: '_checkAndResumeStuckPlayback',
                                value: function _checkAndResumeStuckPlayback(stalled) {
                                    var media = this._mediaElement;
                                    if (stalled || !this._receivedCanPlay || media.readyState < 2) {
                                        // HAVE_CURRENT_DATA
                                        var buffered = media.buffered;

                                        if (buffered.length > 0 && media.currentTime < buffered.start(0)) {
                                            _logger2.default.w(
                                                this.TAG,
                                                'Playback seems stuck at ' +
                                                    media.currentTime +
                                                    ', seek to ' +
                                                    buffered.start(0)
                                            );
                                            this._requestSetTime = true;
                                            this._mediaElement.currentTime = buffered.start(0);
                                            this._mediaElement.removeEventListener('progress', this.e.onvProgress);
                                        }
                                    } else {
                                        // Playback didn't stuck, remove progress event listener
                                        this._mediaElement.removeEventListener('progress', this.e.onvProgress);
                                    }
                                }
                            },
                            {
                                key: '_onvLoadedMetadata',
                                value: function _onvLoadedMetadata(e) {
                                    if (this._pendingSeekTime != null) {
                                        this._mediaElement.currentTime = this._pendingSeekTime;
                                        this._pendingSeekTime = null;
                                    }
                                }
                            },
                            {
                                key: '_onvSeeking',
                                value: function _onvSeeking(e) {
                                    // handle seeking request from browser's progress bar
                                    var target = this._mediaElement.currentTime;
                                    var buffered = this._mediaElement.buffered;

                                    if (this._requestSetTime) {
                                        this._requestSetTime = false;
                                        return;
                                    }

                                    if (target < 1.0 && buffered.length > 0) {
                                        // seek to video begin, set currentTime directly if beginPTS buffered
                                        var videoBeginTime = buffered.start(0);
                                        if (
                                            (videoBeginTime < 1.0 && target < videoBeginTime) ||
                                            _browser2.default.safari
                                        ) {
                                            this._requestSetTime = true;
                                            // also workaround for Safari: Seek to 0 may cause video stuck, use 0.1 to avoid
                                            this._mediaElement.currentTime = _browser2.default.safari
                                                ? 0.1
                                                : videoBeginTime;
                                            return;
                                        }
                                    }

                                    if (this._isTimepointBuffered(target)) {
                                        if (this._alwaysSeekKeyframe) {
                                            var idr = this._msectl.getNearestKeyframe(Math.floor(target * 1000));
                                            if (idr != null) {
                                                this._requestSetTime = true;
                                                this._mediaElement.currentTime = idr.dts / 1000;
                                            }
                                        }
                                        if (this._progressChecker != null) {
                                            this._checkProgressAndResume();
                                        }
                                        return;
                                    }

                                    this._seekpointRecord = {
                                        seekPoint: target,
                                        recordTime: this._now()
                                    };
                                    window.setTimeout(this._checkAndApplyUnbufferedSeekpoint.bind(this), 50);
                                }
                            },
                            {
                                key: '_onvCanPlay',
                                value: function _onvCanPlay(e) {
                                    this._receivedCanPlay = true;
                                    this._mediaElement.removeEventListener('canplay', this.e.onvCanPlay);
                                }
                            },
                            {
                                key: '_onvStalled',
                                value: function _onvStalled(e) {
                                    this._checkAndResumeStuckPlayback(true);
                                }
                            },
                            {
                                key: '_onvProgress',
                                value: function _onvProgress(e) {
                                    this._checkAndResumeStuckPlayback();
                                }
                            },
                            {
                                key: 'type',
                                get: function get() {
                                    return this._type;
                                }
                            },
                            {
                                key: 'buffered',
                                get: function get() {
                                    return this._mediaElement.buffered;
                                }
                            },
                            {
                                key: 'duration',
                                get: function get() {
                                    return this._mediaElement.duration;
                                }
                            },
                            {
                                key: 'volume',
                                get: function get() {
                                    return this._mediaElement.volume;
                                },
                                set: function set(value) {
                                    this._mediaElement.volume = value;
                                }
                            },
                            {
                                key: 'muted',
                                get: function get() {
                                    return this._mediaElement.muted;
                                },
                                set: function set(muted) {
                                    this._mediaElement.muted = muted;
                                }
                            },
                            {
                                key: 'currentTime',
                                get: function get() {
                                    if (this._mediaElement) {
                                        return this._mediaElement.currentTime;
                                    }
                                    return 0;
                                },
                                set: function set(seconds) {
                                    if (this._mediaElement) {
                                        this._internalSeek(seconds);
                                    } else {
                                        this._pendingSeekTime = seconds;
                                    }
                                }
                            },
                            {
                                key: 'mediaInfo',
                                get: function get() {
                                    return Object.assign({}, this._mediaInfo);
                                }
                            },
                            {
                                key: 'statisticsInfo',
                                get: function get() {
                                    if (this._statisticsInfo == null) {
                                        this._statisticsInfo = {};
                                    }
                                    this._statisticsInfo = this._fillStatisticsInfo(this._statisticsInfo);
                                    return Object.assign({}, this._statisticsInfo);
                                }
                            }
                        ]);

                        return FlvPlayer;
                    })();

                    exports.default = FlvPlayer;
                },
                {
                    '../config.js': 5,
                    '../core/mse-controller.js': 9,
                    '../core/mse-events.js': 10,
                    '../core/transmuxer.js': 11,
                    '../core/transmuxing-events.js': 13,
                    '../utils/browser.js': 39,
                    '../utils/exception.js': 40,
                    '../utils/logger.js': 41,
                    './player-errors.js': 34,
                    './player-events.js': 35,
                    events: 2
                }
            ],
            33: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _typeof =
                        typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
                            ? function (obj) {
                                  return typeof obj;
                              }
                            : function (obj) {
                                  return obj &&
                                      typeof Symbol === 'function' &&
                                      obj.constructor === Symbol &&
                                      obj !== Symbol.prototype
                                      ? 'symbol'
                                      : typeof obj;
                              };

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var _events = _dereq_('events');

                    var _events2 = _interopRequireDefault(_events);

                    var _playerEvents = _dereq_('./player-events.js');

                    var _playerEvents2 = _interopRequireDefault(_playerEvents);

                    var _config = _dereq_('../config.js');

                    var _exception = _dereq_('../utils/exception.js');

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    // Player wrapper for browser's native player (HTMLVideoElement) without MediaSource src.
                    var NativePlayer = (function () {
                        function NativePlayer(mediaDataSource, config) {
                            _classCallCheck(this, NativePlayer);

                            this.TAG = 'NativePlayer';
                            this._type = 'NativePlayer';
                            this._emitter = new _events2.default();

                            this._config = (0, _config.createDefaultConfig)();
                            if ((typeof config === 'undefined' ? 'undefined' : _typeof(config)) === 'object') {
                                Object.assign(this._config, config);
                            }

                            if (mediaDataSource.type.toLowerCase() === 'flv') {
                                throw new _exception.InvalidArgumentException(
                                    "NativePlayer does't support flv MediaDataSource input!"
                                );
                            }
                            if (mediaDataSource.hasOwnProperty('segments')) {
                                throw new _exception.InvalidArgumentException(
                                    'NativePlayer(' + mediaDataSource.type + ") doesn't support multipart playback!"
                                );
                            }

                            this.e = {
                                onvLoadedMetadata: this._onvLoadedMetadata.bind(this)
                            };

                            this._pendingSeekTime = null;
                            this._statisticsReporter = null;

                            this._mediaDataSource = mediaDataSource;
                            this._mediaElement = null;
                        }

                        _createClass(NativePlayer, [
                            {
                                key: 'destroy',
                                value: function destroy() {
                                    if (this._mediaElement) {
                                        this.unload();
                                        this.detachMediaElement();
                                    }
                                    this.e = null;
                                    this._mediaDataSource = null;
                                    this._emitter.removeAllListeners();
                                    this._emitter = null;
                                }
                            },
                            {
                                key: 'on',
                                value: function on(event, listener) {
                                    var _this = this;

                                    if (event === _playerEvents2.default.MEDIA_INFO) {
                                        if (this._mediaElement != null && this._mediaElement.readyState !== 0) {
                                            // HAVE_NOTHING
                                            Promise.resolve().then(function () {
                                                _this._emitter.emit(_playerEvents2.default.MEDIA_INFO, _this.mediaInfo);
                                            });
                                        }
                                    } else if (event === _playerEvents2.default.STATISTICS_INFO) {
                                        if (this._mediaElement != null && this._mediaElement.readyState !== 0) {
                                            Promise.resolve().then(function () {
                                                _this._emitter.emit(
                                                    _playerEvents2.default.STATISTICS_INFO,
                                                    _this.statisticsInfo
                                                );
                                            });
                                        }
                                    }
                                    this._emitter.addListener(event, listener);
                                }
                            },
                            {
                                key: 'off',
                                value: function off(event, listener) {
                                    this._emitter.removeListener(event, listener);
                                }
                            },
                            {
                                key: 'attachMediaElement',
                                value: function attachMediaElement(mediaElement) {
                                    this._mediaElement = mediaElement;
                                    mediaElement.addEventListener('loadedmetadata', this.e.onvLoadedMetadata);

                                    if (this._pendingSeekTime != null) {
                                        try {
                                            mediaElement.currentTime = this._pendingSeekTime;
                                            this._pendingSeekTime = null;
                                        } catch (e) {
                                            // IE11 may throw InvalidStateError if readyState === 0
                                            // Defer set currentTime operation after loadedmetadata
                                        }
                                    }
                                }
                            },
                            {
                                key: 'detachMediaElement',
                                value: function detachMediaElement() {
                                    if (this._mediaElement) {
                                        this._mediaElement.src = '';
                                        this._mediaElement.removeAttribute('src');
                                        this._mediaElement.removeEventListener(
                                            'loadedmetadata',
                                            this.e.onvLoadedMetadata
                                        );
                                        this._mediaElement = null;
                                    }
                                    if (this._statisticsReporter != null) {
                                        window.clearInterval(this._statisticsReporter);
                                        this._statisticsReporter = null;
                                    }
                                }
                            },
                            {
                                key: 'load',
                                value: function load() {
                                    if (!this._mediaElement) {
                                        throw new _exception.IllegalStateException(
                                            'HTMLMediaElement must be attached before load()!'
                                        );
                                    }
                                    this._mediaElement.src = this._mediaDataSource.url;

                                    if (this._mediaElement.readyState > 0) {
                                        this._mediaElement.currentTime = 0;
                                    }

                                    this._mediaElement.preload = 'auto';
                                    this._mediaElement.load();
                                    this._statisticsReporter = window.setInterval(
                                        this._reportStatisticsInfo.bind(this),
                                        this._config.statisticsInfoReportInterval
                                    );
                                }
                            },
                            {
                                key: 'unload',
                                value: function unload() {
                                    if (this._mediaElement) {
                                        this._mediaElement.src = '';
                                        this._mediaElement.removeAttribute('src');
                                    }
                                    if (this._statisticsReporter != null) {
                                        window.clearInterval(this._statisticsReporter);
                                        this._statisticsReporter = null;
                                    }
                                }
                            },
                            {
                                key: 'play',
                                value: function play() {
                                    this._mediaElement.play();
                                }
                            },
                            {
                                key: 'pause',
                                value: function pause() {
                                    this._mediaElement.pause();
                                }
                            },
                            {
                                key: '_onvLoadedMetadata',
                                value: function _onvLoadedMetadata(e) {
                                    if (this._pendingSeekTime != null) {
                                        this._mediaElement.currentTime = this._pendingSeekTime;
                                        this._pendingSeekTime = null;
                                    }
                                    this._emitter.emit(_playerEvents2.default.MEDIA_INFO, this.mediaInfo);
                                }
                            },
                            {
                                key: '_reportStatisticsInfo',
                                value: function _reportStatisticsInfo() {
                                    this._emitter.emit(_playerEvents2.default.STATISTICS_INFO, this.statisticsInfo);
                                }
                            },
                            {
                                key: 'type',
                                get: function get() {
                                    return this._type;
                                }
                            },
                            {
                                key: 'buffered',
                                get: function get() {
                                    return this._mediaElement.buffered;
                                }
                            },
                            {
                                key: 'duration',
                                get: function get() {
                                    return this._mediaElement.duration;
                                }
                            },
                            {
                                key: 'volume',
                                get: function get() {
                                    return this._mediaElement.volume;
                                },
                                set: function set(value) {
                                    this._mediaElement.volume = value;
                                }
                            },
                            {
                                key: 'muted',
                                get: function get() {
                                    return this._mediaElement.muted;
                                },
                                set: function set(muted) {
                                    this._mediaElement.muted = muted;
                                }
                            },
                            {
                                key: 'currentTime',
                                get: function get() {
                                    if (this._mediaElement) {
                                        return this._mediaElement.currentTime;
                                    }
                                    return 0;
                                },
                                set: function set(seconds) {
                                    if (this._mediaElement) {
                                        this._mediaElement.currentTime = seconds;
                                    } else {
                                        this._pendingSeekTime = seconds;
                                    }
                                }
                            },
                            {
                                key: 'mediaInfo',
                                get: function get() {
                                    var mediaPrefix =
                                        this._mediaElement instanceof HTMLAudioElement ? 'audio/' : 'video/';
                                    var info = {
                                        mimeType: mediaPrefix + this._mediaDataSource.type
                                    };
                                    if (this._mediaElement) {
                                        info.duration = Math.floor(this._mediaElement.duration * 1000);
                                        if (this._mediaElement instanceof HTMLVideoElement) {
                                            info.width = this._mediaElement.videoWidth;
                                            info.height = this._mediaElement.videoHeight;
                                        }
                                    }
                                    return info;
                                }
                            },
                            {
                                key: 'statisticsInfo',
                                get: function get() {
                                    var info = {
                                        playerType: this._type,
                                        url: this._mediaDataSource.url
                                    };

                                    if (!(this._mediaElement instanceof HTMLVideoElement)) {
                                        return info;
                                    }

                                    var hasQualityInfo = true;
                                    var decoded = 0;
                                    var dropped = 0;

                                    if (this._mediaElement.getVideoPlaybackQuality) {
                                        var quality = this._mediaElement.getVideoPlaybackQuality();
                                        decoded = quality.totalVideoFrames;
                                        dropped = quality.droppedVideoFrames;
                                    } else if (this._mediaElement.webkitDecodedFrameCount != undefined) {
                                        decoded = this._mediaElement.webkitDecodedFrameCount;
                                        dropped = this._mediaElement.webkitDroppedFrameCount;
                                    } else {
                                        hasQualityInfo = false;
                                    }

                                    if (hasQualityInfo) {
                                        info.decodedFrames = decoded;
                                        info.droppedFrames = dropped;
                                    }

                                    return info;
                                }
                            }
                        ]);

                        return NativePlayer;
                    })();

                    exports.default = NativePlayer;
                },
                { '../config.js': 5, '../utils/exception.js': 40, './player-events.js': 35, events: 2 }
            ],
            34: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });
                    exports.ErrorDetails = exports.ErrorTypes = undefined;

                    var _loader = _dereq_('../io/loader.js');

                    var _demuxErrors = _dereq_('../demux/demux-errors.js');

                    var _demuxErrors2 = _interopRequireDefault(_demuxErrors);

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var ErrorTypes = (exports.ErrorTypes = {
                        NETWORK_ERROR: 'NetworkError',
                        MEDIA_ERROR: 'MediaError',
                        OTHER_ERROR: 'OtherError'
                    });

                    var ErrorDetails = (exports.ErrorDetails = {
                        NETWORK_EXCEPTION: _loader.LoaderErrors.EXCEPTION,
                        NETWORK_STATUS_CODE_INVALID: _loader.LoaderErrors.HTTP_STATUS_CODE_INVALID,
                        NETWORK_TIMEOUT: _loader.LoaderErrors.CONNECTING_TIMEOUT,
                        NETWORK_UNRECOVERABLE_EARLY_EOF: _loader.LoaderErrors.UNRECOVERABLE_EARLY_EOF,

                        MEDIA_MSE_ERROR: 'MediaMSEError',

                        MEDIA_FORMAT_ERROR: _demuxErrors2.default.FORMAT_ERROR,
                        MEDIA_FORMAT_UNSUPPORTED: _demuxErrors2.default.FORMAT_UNSUPPORTED,
                        MEDIA_CODEC_UNSUPPORTED: _demuxErrors2.default.CODEC_UNSUPPORTED
                    });
                },
                { '../demux/demux-errors.js': 16, '../io/loader.js': 24 }
            ],
            35: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var PlayerEvents = {
                        ERROR: 'error',
                        LOADING_COMPLETE: 'loading_complete',
                        RECOVERED_EARLY_EOF: 'recovered_early_eof',
                        MEDIA_INFO: 'media_info',
                        STATISTICS_INFO: 'statistics_info'
                    };

                    exports.default = PlayerEvents;
                },
                {}
            ],
            36: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * This file is modified from dailymotion's hls.js library (hls.js/src/helper/aac.js)
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var AAC = (function () {
                        function AAC() {
                            _classCallCheck(this, AAC);
                        }

                        _createClass(AAC, null, [
                            {
                                key: 'getSilentFrame',
                                value: function getSilentFrame(channelCount) {
                                    if (channelCount === 1) {
                                        return new Uint8Array([0x00, 0xc8, 0x00, 0x80, 0x23, 0x80]);
                                    } else if (channelCount === 2) {
                                        return new Uint8Array([0x21, 0x00, 0x49, 0x90, 0x02, 0x19, 0x00, 0x23, 0x80]);
                                    } else if (channelCount === 3) {
                                        return new Uint8Array([
                                            0x00,
                                            0xc8,
                                            0x00,
                                            0x80,
                                            0x20,
                                            0x84,
                                            0x01,
                                            0x26,
                                            0x40,
                                            0x08,
                                            0x64,
                                            0x00,
                                            0x8e
                                        ]);
                                    } else if (channelCount === 4) {
                                        return new Uint8Array([
                                            0x00,
                                            0xc8,
                                            0x00,
                                            0x80,
                                            0x20,
                                            0x84,
                                            0x01,
                                            0x26,
                                            0x40,
                                            0x08,
                                            0x64,
                                            0x00,
                                            0x80,
                                            0x2c,
                                            0x80,
                                            0x08,
                                            0x02,
                                            0x38
                                        ]);
                                    } else if (channelCount === 5) {
                                        return new Uint8Array([
                                            0x00,
                                            0xc8,
                                            0x00,
                                            0x80,
                                            0x20,
                                            0x84,
                                            0x01,
                                            0x26,
                                            0x40,
                                            0x08,
                                            0x64,
                                            0x00,
                                            0x82,
                                            0x30,
                                            0x04,
                                            0x99,
                                            0x00,
                                            0x21,
                                            0x90,
                                            0x02,
                                            0x38
                                        ]);
                                    } else if (channelCount === 6) {
                                        return new Uint8Array([
                                            0x00,
                                            0xc8,
                                            0x00,
                                            0x80,
                                            0x20,
                                            0x84,
                                            0x01,
                                            0x26,
                                            0x40,
                                            0x08,
                                            0x64,
                                            0x00,
                                            0x82,
                                            0x30,
                                            0x04,
                                            0x99,
                                            0x00,
                                            0x21,
                                            0x90,
                                            0x02,
                                            0x00,
                                            0xb2,
                                            0x00,
                                            0x20,
                                            0x08,
                                            0xe0
                                        ]);
                                    }
                                    return null;
                                }
                            }
                        ]);

                        return AAC;
                    })();

                    exports.default = AAC;
                },
                {}
            ],
            37: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * This file is derived from dailymotion's hls.js library (hls.js/src/remux/mp4-generator.js)
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    //  MP4 boxes generator for ISO BMFF (ISO Base Media File Format, defined in ISO/IEC 14496-12)
                    var MP4 = (function () {
                        function MP4() {
                            _classCallCheck(this, MP4);
                        }

                        _createClass(MP4, null, [
                            {
                                key: 'init',
                                value: function init() {
                                    MP4.types = {
                                        avc1: [],
                                        avcC: [],
                                        btrt: [],
                                        dinf: [],
                                        dref: [],
                                        esds: [],
                                        ftyp: [],
                                        hdlr: [],
                                        mdat: [],
                                        mdhd: [],
                                        mdia: [],
                                        mfhd: [],
                                        minf: [],
                                        moof: [],
                                        moov: [],
                                        mp4a: [],
                                        mvex: [],
                                        mvhd: [],
                                        sdtp: [],
                                        stbl: [],
                                        stco: [],
                                        stsc: [],
                                        stsd: [],
                                        stsz: [],
                                        stts: [],
                                        tfdt: [],
                                        tfhd: [],
                                        traf: [],
                                        trak: [],
                                        trun: [],
                                        trex: [],
                                        tkhd: [],
                                        vmhd: [],
                                        smhd: []
                                    };

                                    for (var name in MP4.types) {
                                        if (MP4.types.hasOwnProperty(name)) {
                                            MP4.types[name] = [
                                                name.charCodeAt(0),
                                                name.charCodeAt(1),
                                                name.charCodeAt(2),
                                                name.charCodeAt(3)
                                            ];
                                        }
                                    }

                                    var constants = (MP4.constants = {});

                                    constants.FTYP = new Uint8Array([
                                        0x69,
                                        0x73,
                                        0x6f,
                                        0x6d, // major_brand: isom
                                        0x0,
                                        0x0,
                                        0x0,
                                        0x1, // minor_version: 0x01
                                        0x69,
                                        0x73,
                                        0x6f,
                                        0x6d, // isom
                                        0x61,
                                        0x76,
                                        0x63,
                                        0x31 // avc1
                                    ]);

                                    constants.STSD_PREFIX = new Uint8Array([
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // version(0) + flags
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x01 // entry_count
                                    ]);

                                    constants.STTS = new Uint8Array([
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // version(0) + flags
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00 // entry_count
                                    ]);

                                    constants.STSC = constants.STCO = constants.STTS;

                                    constants.STSZ = new Uint8Array([
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // version(0) + flags
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // sample_size
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00 // sample_count
                                    ]);

                                    constants.HDLR_VIDEO = new Uint8Array([
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // version(0) + flags
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // pre_defined
                                        0x76,
                                        0x69,
                                        0x64,
                                        0x65, // handler_type: 'vide'
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // reserved: 3 * 4 bytes
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x56,
                                        0x69,
                                        0x64,
                                        0x65,
                                        0x6f,
                                        0x48,
                                        0x61,
                                        0x6e,
                                        0x64,
                                        0x6c,
                                        0x65,
                                        0x72,
                                        0x00 // name: VideoHandler
                                    ]);

                                    constants.HDLR_AUDIO = new Uint8Array([
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // version(0) + flags
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // pre_defined
                                        0x73,
                                        0x6f,
                                        0x75,
                                        0x6e, // handler_type: 'soun'
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // reserved: 3 * 4 bytes
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x53,
                                        0x6f,
                                        0x75,
                                        0x6e,
                                        0x64,
                                        0x48,
                                        0x61,
                                        0x6e,
                                        0x64,
                                        0x6c,
                                        0x65,
                                        0x72,
                                        0x00 // name: SoundHandler
                                    ]);

                                    constants.DREF = new Uint8Array([
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // version(0) + flags
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x01, // entry_count
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x0c, // entry_size
                                        0x75,
                                        0x72,
                                        0x6c,
                                        0x20, // type 'url '
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x01 // version(0) + flags
                                    ]);

                                    // Sound media header
                                    constants.SMHD = new Uint8Array([
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // version(0) + flags
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00 // balance(2) + reserved(2)
                                    ]);

                                    // video media header
                                    constants.VMHD = new Uint8Array([
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x01, // version(0) + flags
                                        0x00,
                                        0x00, // graphicsmode: 2 bytes
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // opcolor: 3 * 2 bytes
                                        0x00,
                                        0x00
                                    ]);
                                }

                                // Generate a box
                            },
                            {
                                key: 'box',
                                value: function box(type) {
                                    var size = 8;
                                    var result = null;
                                    var datas = Array.prototype.slice.call(arguments, 1);
                                    var arrayCount = datas.length;

                                    for (var i = 0; i < arrayCount; i++) {
                                        size += datas[i].byteLength;
                                    }

                                    result = new Uint8Array(size);
                                    result[0] = (size >>> 24) & 0xff; // size
                                    result[1] = (size >>> 16) & 0xff;
                                    result[2] = (size >>> 8) & 0xff;
                                    result[3] = size & 0xff;

                                    result.set(type, 4); // type

                                    var offset = 8;
                                    for (var _i = 0; _i < arrayCount; _i++) {
                                        // data body
                                        result.set(datas[_i], offset);
                                        offset += datas[_i].byteLength;
                                    }

                                    return result;
                                }

                                // emit ftyp & moov
                            },
                            {
                                key: 'generateInitSegment',
                                value: function generateInitSegment(meta) {
                                    var ftyp = MP4.box(MP4.types.ftyp, MP4.constants.FTYP);
                                    var moov = MP4.moov(meta);

                                    var result = new Uint8Array(ftyp.byteLength + moov.byteLength);
                                    result.set(ftyp, 0);
                                    result.set(moov, ftyp.byteLength);
                                    return result;
                                }

                                // Movie metadata box
                            },
                            {
                                key: 'moov',
                                value: function moov(meta) {
                                    var mvhd = MP4.mvhd(meta.timescale, meta.duration);
                                    var trak = MP4.trak(meta);
                                    var mvex = MP4.mvex(meta);
                                    return MP4.box(MP4.types.moov, mvhd, trak, mvex);
                                }

                                // Movie header box
                            },
                            {
                                key: 'mvhd',
                                value: function mvhd(timescale, duration) {
                                    return MP4.box(
                                        MP4.types.mvhd,
                                        new Uint8Array([
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // version(0) + flags
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // creation_time
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // modification_time
                                            (timescale >>> 24) & 0xff, // timescale: 4 bytes
                                            (timescale >>> 16) & 0xff,
                                            (timescale >>> 8) & 0xff,
                                            timescale & 0xff,
                                            (duration >>> 24) & 0xff, // duration: 4 bytes
                                            (duration >>> 16) & 0xff,
                                            (duration >>> 8) & 0xff,
                                            duration & 0xff,
                                            0x00,
                                            0x01,
                                            0x00,
                                            0x00, // Preferred rate: 1.0
                                            0x01,
                                            0x00,
                                            0x00,
                                            0x00, // PreferredVolume(1.0, 2bytes) + reserved(2bytes)
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // reserved: 4 + 4 bytes
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x01,
                                            0x00,
                                            0x00, // ----begin composition matrix----
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x01,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x40,
                                            0x00,
                                            0x00,
                                            0x00, // ----end composition matrix----
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // ----begin pre_defined 6 * 4 bytes----
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // ----end pre_defined 6 * 4 bytes----
                                            0xff,
                                            0xff,
                                            0xff,
                                            0xff // next_track_ID
                                        ])
                                    );
                                }

                                // Track box
                            },
                            {
                                key: 'trak',
                                value: function trak(meta) {
                                    return MP4.box(MP4.types.trak, MP4.tkhd(meta), MP4.mdia(meta));
                                }

                                // Track header box
                            },
                            {
                                key: 'tkhd',
                                value: function tkhd(meta) {
                                    var trackId = meta.id,
                                        duration = meta.duration;
                                    var width = meta.presentWidth,
                                        height = meta.presentHeight;

                                    return MP4.box(
                                        MP4.types.tkhd,
                                        new Uint8Array([
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x07, // version(0) + flags
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // creation_time
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // modification_time
                                            (trackId >>> 24) & 0xff, // track_ID: 4 bytes
                                            (trackId >>> 16) & 0xff,
                                            (trackId >>> 8) & 0xff,
                                            trackId & 0xff,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // reserved: 4 bytes
                                            (duration >>> 24) & 0xff, // duration: 4 bytes
                                            (duration >>> 16) & 0xff,
                                            (duration >>> 8) & 0xff,
                                            duration & 0xff,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // reserved: 2 * 4 bytes
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // layer(2bytes) + alternate_group(2bytes)
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // volume(2bytes) + reserved(2bytes)
                                            0x00,
                                            0x01,
                                            0x00,
                                            0x00, // ----begin composition matrix----
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x01,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x40,
                                            0x00,
                                            0x00,
                                            0x00, // ----end composition matrix----
                                            (width >>> 8) & 0xff, // width and height
                                            width & 0xff,
                                            0x00,
                                            0x00,
                                            (height >>> 8) & 0xff,
                                            height & 0xff,
                                            0x00,
                                            0x00
                                        ])
                                    );
                                }

                                // Media Box
                            },
                            {
                                key: 'mdia',
                                value: function mdia(meta) {
                                    return MP4.box(MP4.types.mdia, MP4.mdhd(meta), MP4.hdlr(meta), MP4.minf(meta));
                                }

                                // Media header box
                            },
                            {
                                key: 'mdhd',
                                value: function mdhd(meta) {
                                    var timescale = meta.timescale;
                                    var duration = meta.duration;
                                    return MP4.box(
                                        MP4.types.mdhd,
                                        new Uint8Array([
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // version(0) + flags
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // creation_time
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // modification_time
                                            (timescale >>> 24) & 0xff, // timescale: 4 bytes
                                            (timescale >>> 16) & 0xff,
                                            (timescale >>> 8) & 0xff,
                                            timescale & 0xff,
                                            (duration >>> 24) & 0xff, // duration: 4 bytes
                                            (duration >>> 16) & 0xff,
                                            (duration >>> 8) & 0xff,
                                            duration & 0xff,
                                            0x55,
                                            0xc4, // language: und (undetermined)
                                            0x00,
                                            0x00 // pre_defined = 0
                                        ])
                                    );
                                }

                                // Media handler reference box
                            },
                            {
                                key: 'hdlr',
                                value: function hdlr(meta) {
                                    var data = null;
                                    if (meta.type === 'audio') {
                                        data = MP4.constants.HDLR_AUDIO;
                                    } else {
                                        data = MP4.constants.HDLR_VIDEO;
                                    }
                                    return MP4.box(MP4.types.hdlr, data);
                                }

                                // Media infomation box
                            },
                            {
                                key: 'minf',
                                value: function minf(meta) {
                                    var xmhd = null;
                                    if (meta.type === 'audio') {
                                        xmhd = MP4.box(MP4.types.smhd, MP4.constants.SMHD);
                                    } else {
                                        xmhd = MP4.box(MP4.types.vmhd, MP4.constants.VMHD);
                                    }
                                    return MP4.box(MP4.types.minf, xmhd, MP4.dinf(), MP4.stbl(meta));
                                }

                                // Data infomation box
                            },
                            {
                                key: 'dinf',
                                value: function dinf() {
                                    var result = MP4.box(MP4.types.dinf, MP4.box(MP4.types.dref, MP4.constants.DREF));
                                    return result;
                                }

                                // Sample table box
                            },
                            {
                                key: 'stbl',
                                value: function stbl(meta) {
                                    var result = MP4.box(
                                        MP4.types.stbl, // type: stbl
                                        MP4.stsd(meta), // Sample Description Table
                                        MP4.box(MP4.types.stts, MP4.constants.STTS), // Time-To-Sample
                                        MP4.box(MP4.types.stsc, MP4.constants.STSC), // Sample-To-Chunk
                                        MP4.box(MP4.types.stsz, MP4.constants.STSZ), // Sample size
                                        MP4.box(MP4.types.stco, MP4.constants.STCO) // Chunk offset
                                    );
                                    return result;
                                }

                                // Sample description box
                            },
                            {
                                key: 'stsd',
                                value: function stsd(meta) {
                                    if (meta.type === 'audio') {
                                        return MP4.box(MP4.types.stsd, MP4.constants.STSD_PREFIX, MP4.mp4a(meta));
                                    } else {
                                        return MP4.box(MP4.types.stsd, MP4.constants.STSD_PREFIX, MP4.avc1(meta));
                                    }
                                }
                            },
                            {
                                key: 'mp4a',
                                value: function mp4a(meta) {
                                    var channelCount = meta.channelCount;
                                    var sampleRate = meta.audioSampleRate;

                                    var data = new Uint8Array([
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // reserved(4)
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x01, // reserved(2) + data_reference_index(2)
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // reserved: 2 * 4 bytes
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        channelCount, // channelCount(2)
                                        0x00,
                                        0x10, // sampleSize(2)
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // reserved(4)
                                        (sampleRate >>> 8) & 0xff, // Audio sample rate
                                        sampleRate & 0xff,
                                        0x00,
                                        0x00
                                    ]);

                                    return MP4.box(MP4.types.mp4a, data, MP4.esds(meta));
                                }
                            },
                            {
                                key: 'esds',
                                value: function esds(meta) {
                                    var config = meta.config;
                                    var configSize = config.length;
                                    var data = new Uint8Array(
                                        [
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // version 0 + flags

                                            0x03, // descriptor_type
                                            0x17 + configSize, // length3
                                            0x00,
                                            0x01, // es_id
                                            0x00, // stream_priority

                                            0x04, // descriptor_type
                                            0x0f + configSize, // length
                                            0x40, // codec: mpeg4_audio
                                            0x15, // stream_type: Audio
                                            0x00,
                                            0x00,
                                            0x00, // buffer_size
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // maxBitrate
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // avgBitrate

                                            0x05 // descriptor_type
                                        ]
                                            .concat([configSize])
                                            .concat(config)
                                            .concat([
                                                0x06,
                                                0x01,
                                                0x02 // GASpecificConfig
                                            ])
                                    );
                                    return MP4.box(MP4.types.esds, data);
                                }
                            },
                            {
                                key: 'avc1',
                                value: function avc1(meta) {
                                    var avcc = meta.avcc;
                                    var width = meta.codecWidth,
                                        height = meta.codecHeight;

                                    var data = new Uint8Array([
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // reserved(4)
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x01, // reserved(2) + data_reference_index(2)
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // pre_defined(2) + reserved(2)
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // pre_defined: 3 * 4 bytes
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        (width >>> 8) & 0xff, // width: 2 bytes
                                        width & 0xff,
                                        (height >>> 8) & 0xff, // height: 2 bytes
                                        height & 0xff,
                                        0x00,
                                        0x48,
                                        0x00,
                                        0x00, // horizresolution: 4 bytes
                                        0x00,
                                        0x48,
                                        0x00,
                                        0x00, // vertresolution: 4 bytes
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // reserved: 4 bytes
                                        0x00,
                                        0x01, // frame_count
                                        0x0a, // strlen
                                        0x78,
                                        0x71,
                                        0x71,
                                        0x2f, // compressorname: 32 bytes
                                        0x66,
                                        0x6c,
                                        0x76,
                                        0x2e,
                                        0x6a,
                                        0x73,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x18, // depth
                                        0xff,
                                        0xff // pre_defined = -1
                                    ]);
                                    return MP4.box(MP4.types.avc1, data, MP4.box(MP4.types.avcC, avcc));
                                }

                                // Movie Extends box
                            },
                            {
                                key: 'mvex',
                                value: function mvex(meta) {
                                    return MP4.box(MP4.types.mvex, MP4.trex(meta));
                                }

                                // Track Extends box
                            },
                            {
                                key: 'trex',
                                value: function trex(meta) {
                                    var trackId = meta.id;
                                    var data = new Uint8Array([
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // version(0) + flags
                                        (trackId >>> 24) & 0xff, // track_ID
                                        (trackId >>> 16) & 0xff,
                                        (trackId >>> 8) & 0xff,
                                        trackId & 0xff,
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x01, // default_sample_description_index
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // default_sample_duration
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00, // default_sample_size
                                        0x00,
                                        0x01,
                                        0x00,
                                        0x01 // default_sample_flags
                                    ]);
                                    return MP4.box(MP4.types.trex, data);
                                }

                                // Movie fragment box
                            },
                            {
                                key: 'moof',
                                value: function moof(track, baseMediaDecodeTime) {
                                    return MP4.box(
                                        MP4.types.moof,
                                        MP4.mfhd(track.sequenceNumber),
                                        MP4.traf(track, baseMediaDecodeTime)
                                    );
                                }
                            },
                            {
                                key: 'mfhd',
                                value: function mfhd(sequenceNumber) {
                                    var data = new Uint8Array([
                                        0x00,
                                        0x00,
                                        0x00,
                                        0x00,
                                        (sequenceNumber >>> 24) & 0xff, // sequence_number: int32
                                        (sequenceNumber >>> 16) & 0xff,
                                        (sequenceNumber >>> 8) & 0xff,
                                        sequenceNumber & 0xff
                                    ]);
                                    return MP4.box(MP4.types.mfhd, data);
                                }

                                // Track fragment box
                            },
                            {
                                key: 'traf',
                                value: function traf(track, baseMediaDecodeTime) {
                                    var trackId = track.id;

                                    // Track fragment header box
                                    var tfhd = MP4.box(
                                        MP4.types.tfhd,
                                        new Uint8Array([
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // version(0) & flags
                                            (trackId >>> 24) & 0xff, // track_ID
                                            (trackId >>> 16) & 0xff,
                                            (trackId >>> 8) & 0xff,
                                            trackId & 0xff
                                        ])
                                    );
                                    // Track Fragment Decode Time
                                    var tfdt = MP4.box(
                                        MP4.types.tfdt,
                                        new Uint8Array([
                                            0x00,
                                            0x00,
                                            0x00,
                                            0x00, // version(0) & flags
                                            (baseMediaDecodeTime >>> 24) & 0xff, // baseMediaDecodeTime: int32
                                            (baseMediaDecodeTime >>> 16) & 0xff,
                                            (baseMediaDecodeTime >>> 8) & 0xff,
                                            baseMediaDecodeTime & 0xff
                                        ])
                                    );
                                    var sdtp = MP4.sdtp(track);
                                    var trun = MP4.trun(track, sdtp.byteLength + 16 + 16 + 8 + 16 + 8 + 8);

                                    return MP4.box(MP4.types.traf, tfhd, tfdt, trun, sdtp);
                                }

                                // Sample Dependency Type box
                            },
                            {
                                key: 'sdtp',
                                value: function sdtp(track) {
                                    var samples = track.samples || [];
                                    var sampleCount = samples.length;
                                    var data = new Uint8Array(4 + sampleCount);
                                    // 0~4 bytes: version(0) & flags
                                    for (var i = 0; i < sampleCount; i++) {
                                        var flags = samples[i].flags;
                                        data[i + 4] =
                                            (flags.isLeading << 6) | // is_leading: 2 (bit)
                                            (flags.dependsOn << 4) | // sample_depends_on
                                            (flags.isDependedOn << 2) | // sample_is_depended_on
                                            flags.hasRedundancy; // sample_has_redundancy
                                    }
                                    return MP4.box(MP4.types.sdtp, data);
                                }

                                // Track fragment run box
                            },
                            {
                                key: 'trun',
                                value: function trun(track, offset) {
                                    var samples = track.samples || [];
                                    var sampleCount = samples.length;
                                    var dataSize = 12 + 16 * sampleCount;
                                    var data = new Uint8Array(dataSize);
                                    offset += 8 + dataSize;

                                    data.set(
                                        [
                                            0x00,
                                            0x00,
                                            0x0f,
                                            0x01, // version(0) & flags
                                            (sampleCount >>> 24) & 0xff, // sample_count
                                            (sampleCount >>> 16) & 0xff,
                                            (sampleCount >>> 8) & 0xff,
                                            sampleCount & 0xff,
                                            (offset >>> 24) & 0xff, // data_offset
                                            (offset >>> 16) & 0xff,
                                            (offset >>> 8) & 0xff,
                                            offset & 0xff
                                        ],
                                        0
                                    );

                                    for (var i = 0; i < sampleCount; i++) {
                                        var duration = samples[i].duration;
                                        var size = samples[i].size;
                                        var flags = samples[i].flags;
                                        var cts = samples[i].cts;
                                        data.set(
                                            [
                                                (duration >>> 24) & 0xff, // sample_duration
                                                (duration >>> 16) & 0xff,
                                                (duration >>> 8) & 0xff,
                                                duration & 0xff,
                                                (size >>> 24) & 0xff, // sample_size
                                                (size >>> 16) & 0xff,
                                                (size >>> 8) & 0xff,
                                                size & 0xff,
                                                (flags.isLeading << 2) | flags.dependsOn, // sample_flags
                                                (flags.isDependedOn << 6) |
                                                    (flags.hasRedundancy << 4) |
                                                    flags.isNonSync,
                                                0x00,
                                                0x00, // sample_degradation_priority
                                                (cts >>> 24) & 0xff, // sample_composition_time_offset
                                                (cts >>> 16) & 0xff,
                                                (cts >>> 8) & 0xff,
                                                cts & 0xff
                                            ],
                                            12 + 16 * i
                                        );
                                    }
                                    return MP4.box(MP4.types.trun, data);
                                }
                            },
                            {
                                key: 'mdat',
                                value: function mdat(data) {
                                    return MP4.box(MP4.types.mdat, data);
                                }
                            }
                        ]);

                        return MP4;
                    })();

                    MP4.init();

                    exports.default = MP4;
                },
                {}
            ],
            38: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var _logger = _dereq_('../utils/logger.js');

                    var _logger2 = _interopRequireDefault(_logger);

                    var _mp4Generator = _dereq_('./mp4-generator.js');

                    var _mp4Generator2 = _interopRequireDefault(_mp4Generator);

                    var _aacSilent = _dereq_('./aac-silent.js');

                    var _aacSilent2 = _interopRequireDefault(_aacSilent);

                    var _browser = _dereq_('../utils/browser.js');

                    var _browser2 = _interopRequireDefault(_browser);

                    var _mediaSegmentInfo = _dereq_('../core/media-segment-info.js');

                    var _exception = _dereq_('../utils/exception.js');

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    // Fragmented mp4 remuxer
                    var MP4Remuxer = (function () {
                        function MP4Remuxer(config) {
                            _classCallCheck(this, MP4Remuxer);

                            this.TAG = 'MP4Remuxer';

                            this._config = config;
                            this._isLive = config.isLive === true ? true : false;

                            this._dtsBase = -1;
                            this._dtsBaseInited = false;
                            this._audioDtsBase = Infinity;
                            this._videoDtsBase = Infinity;
                            this._audioNextDts = undefined;
                            this._videoNextDts = undefined;

                            this._audioMeta = null;
                            this._videoMeta = null;

                            this._audioSegmentInfoList = new _mediaSegmentInfo.MediaSegmentInfoList('audio');
                            this._videoSegmentInfoList = new _mediaSegmentInfo.MediaSegmentInfoList('video');

                            this._onInitSegment = null;
                            this._onMediaSegment = null;

                            // Workaround for chrome < 50: Always force first sample as a Random Access Point in media segment
                            // see https://bugs.chromium.org/p/chromium/issues/detail?id=229412
                            this._forceFirstIDR =
                                _browser2.default.chrome &&
                                (_browser2.default.version.major < 50 ||
                                    (_browser2.default.version.major === 50 && _browser2.default.version.build < 2661))
                                    ? true
                                    : false;

                            // Workaround for IE11/Edge: Fill silent aac frame after keyframe-seeking
                            // Make audio beginDts equals with video beginDts, in order to fix seek freeze
                            this._fillSilentAfterSeek = _browser2.default.msedge || _browser2.default.msie;
                        }

                        _createClass(MP4Remuxer, [
                            {
                                key: 'destroy',
                                value: function destroy() {
                                    this._dtsBase = -1;
                                    this._dtsBaseInited = false;
                                    this._audioMeta = null;
                                    this._videoMeta = null;
                                    this._audioSegmentInfoList.clear();
                                    this._audioSegmentInfoList = null;
                                    this._videoSegmentInfoList.clear();
                                    this._videoSegmentInfoList = null;
                                    this._onInitSegment = null;
                                    this._onMediaSegment = null;
                                }
                            },
                            {
                                key: 'bindDataSource',
                                value: function bindDataSource(producer) {
                                    producer.onDataAvailable = this.remux.bind(this);
                                    producer.onTrackMetadata = this._onTrackMetadataReceived.bind(this);
                                    return this;
                                }

                                /* prototype: function onInitSegment(type: string, initSegment: ArrayBuffer): void
           InitSegment: {
               type: string,
               data: ArrayBuffer,
               codec: string,
               container: string
           }
        */
                            },
                            {
                                key: 'insertDiscontinuity',
                                value: function insertDiscontinuity() {
                                    this._audioNextDts = this._videoNextDts = undefined;
                                }
                            },
                            {
                                key: 'seek',
                                value: function seek(originalDts) {
                                    this._videoSegmentInfoList.clear();
                                    this._audioSegmentInfoList.clear();
                                }
                            },
                            {
                                key: 'remux',
                                value: function remux(audioTrack, videoTrack) {
                                    if (!this._onMediaSegment) {
                                        throw new _exception.IllegalStateException(
                                            'MP4Remuxer: onMediaSegment callback must be specificed!'
                                        );
                                    }
                                    if (!this._dtsBaseInited) {
                                        this._calculateDtsBase(audioTrack, videoTrack);
                                    }
                                    this._remuxVideo(videoTrack);
                                    this._remuxAudio(audioTrack);
                                }
                            },
                            {
                                key: '_onTrackMetadataReceived',
                                value: function _onTrackMetadataReceived(type, metadata) {
                                    var metabox = null;

                                    if (type === 'audio') {
                                        this._audioMeta = metadata;
                                        metabox = _mp4Generator2.default.generateInitSegment(metadata);
                                    } else if (type === 'video') {
                                        this._videoMeta = metadata;
                                        metabox = _mp4Generator2.default.generateInitSegment(metadata);
                                    } else {
                                        return;
                                    }

                                    // dispatch metabox (Initialization Segment)
                                    if (!this._onInitSegment) {
                                        throw new _exception.IllegalStateException(
                                            'MP4Remuxer: onInitSegment callback must be specified!'
                                        );
                                    }
                                    this._onInitSegment(type, {
                                        type: type,
                                        data: metabox.buffer,
                                        codec: metadata.codec,
                                        container: type + '/mp4'
                                    });
                                }
                            },
                            {
                                key: '_calculateDtsBase',
                                value: function _calculateDtsBase(audioTrack, videoTrack) {
                                    if (this._dtsBaseInited) {
                                        return;
                                    }

                                    if (audioTrack.samples && audioTrack.samples.length) {
                                        this._audioDtsBase = audioTrack.samples[0].dts;
                                    }
                                    if (videoTrack.samples && videoTrack.samples.length) {
                                        this._videoDtsBase = videoTrack.samples[0].dts;
                                    }

                                    this._dtsBase = Math.min(this._audioDtsBase, this._videoDtsBase);
                                    this._dtsBaseInited = true;
                                }
                            },
                            {
                                key: '_remuxAudio',
                                value: function _remuxAudio(audioTrack) {
                                    //wytest
                                    //audioTrack.samples = [];
                                    //return;

                                    var track = audioTrack;
                                    var samples = track.samples;
                                    var dtsCorrection = undefined;
                                    var firstDts = -1,
                                        lastDts = -1,
                                        lastPts = -1;

                                    //wy
                                    if (samples.length < 2) return;

                                    var remuxSilentFrame = false;
                                    var silentFrameDuration = -1;

                                    if (!samples || samples.length === 0) {
                                        return;
                                    }

                                    var bytes = 8 + track.length;
                                    var mdatbox = new Uint8Array(bytes);
                                    mdatbox[0] = (bytes >>> 24) & 0xff;
                                    mdatbox[1] = (bytes >>> 16) & 0xff;
                                    mdatbox[2] = (bytes >>> 8) & 0xff;
                                    mdatbox[3] = bytes & 0xff;

                                    mdatbox.set(_mp4Generator2.default.types.mdat, 4);

                                    var offset = 8; // size + type
                                    var mp4Samples = [];

                                    while (samples.length) {
                                        var aacSample = samples.shift();
                                        var unit = aacSample.unit;
                                        var originalDts = aacSample.dts - this._dtsBase;

                                        if (dtsCorrection == undefined) {
                                            if (this._audioNextDts == undefined) {
                                                if (this._audioSegmentInfoList.isEmpty()) {
                                                    dtsCorrection = 0;
                                                    if (
                                                        this._fillSilentAfterSeek &&
                                                        !this._videoSegmentInfoList.isEmpty()
                                                    ) {
                                                        remuxSilentFrame = true;
                                                    }
                                                } else {
                                                    var lastSample = this._audioSegmentInfoList.getLastSampleBefore(
                                                        originalDts
                                                    );
                                                    if (lastSample != null) {
                                                        var distance =
                                                            originalDts -
                                                            (lastSample.originalDts + lastSample.duration);
                                                        if (distance <= 3) {
                                                            distance = 0;
                                                        }
                                                        var expectedDts =
                                                            lastSample.dts + lastSample.duration + distance;
                                                        dtsCorrection = originalDts - expectedDts;
                                                    } else {
                                                        // lastSample == null
                                                        dtsCorrection = 0;
                                                    }
                                                }
                                            } else {
                                                dtsCorrection = originalDts - this._audioNextDts;
                                            }
                                        }

                                        var dts = originalDts - dtsCorrection;
                                        if (remuxSilentFrame) {
                                            // align audio segment beginDts to match with current video segment's beginDts
                                            var videoSegment = this._videoSegmentInfoList.getLastSegmentBefore(
                                                originalDts
                                            );
                                            if (videoSegment != null && videoSegment.beginDts < dts) {
                                                silentFrameDuration = dts - videoSegment.beginDts;
                                                dts = videoSegment.beginDts;
                                            } else {
                                                remuxSilentFrame = false;
                                            }
                                        }
                                        if (firstDts === -1) {
                                            firstDts = dts;
                                        }

                                        if (remuxSilentFrame) {
                                            remuxSilentFrame = false;
                                            samples.unshift(aacSample);

                                            var frame = this._generateSilentAudio(dts, silentFrameDuration);
                                            if (frame == null) {
                                                continue;
                                            }
                                            var _mp4Sample = frame.mp4Sample;
                                            var _unit = frame.unit;

                                            mp4Samples.push(_mp4Sample);

                                            // re-allocate mdatbox buffer with new size, to fit with this silent frame
                                            bytes += _unit.byteLength;
                                            mdatbox = new Uint8Array(bytes);
                                            mdatbox[0] = (bytes >>> 24) & 0xff;
                                            mdatbox[1] = (bytes >>> 16) & 0xff;
                                            mdatbox[2] = (bytes >>> 8) & 0xff;
                                            mdatbox[3] = bytes & 0xff;
                                            mdatbox.set(_mp4Generator2.default.types.mdat, 4);

                                            // fill data now
                                            mdatbox.set(_unit, offset);
                                            offset += _unit.byteLength;
                                            continue;
                                        }

                                        var sampleDuration = 0;

                                        if (samples.length >= 1) {
                                            var nextDts = samples[0].dts - this._dtsBase - dtsCorrection;
                                            sampleDuration = nextDts - dts;
                                        } else {
                                            if (mp4Samples.length >= 1) {
                                                // use second last sample duration
                                                sampleDuration = mp4Samples[mp4Samples.length - 1].duration;
                                            } else {
                                                // the only one sample, use reference sample duration
                                                sampleDuration = this._audioMeta.refSampleDuration;
                                            }
                                        }

                                        var mp4Sample = {
                                            dts: dts,
                                            pts: dts,
                                            cts: 0,
                                            size: unit.byteLength,
                                            duration: sampleDuration,
                                            originalDts: originalDts,
                                            flags: {
                                                isLeading: 0,
                                                dependsOn: 1,
                                                isDependedOn: 0,
                                                hasRedundancy: 0
                                            }
                                        };
                                        mp4Samples.push(mp4Sample);
                                        mdatbox.set(unit, offset);
                                        offset += unit.byteLength;
                                    }
                                    var latest = mp4Samples[mp4Samples.length - 1];
                                    lastDts = latest.dts + latest.duration;
                                    this._audioNextDts = lastDts;

                                    // fill media segment info & add to info list
                                    var info = new _mediaSegmentInfo.MediaSegmentInfo();
                                    info.beginDts = firstDts;
                                    info.endDts = lastDts;
                                    info.beginPts = firstDts;
                                    info.endPts = lastDts;
                                    info.originalBeginDts = mp4Samples[0].originalDts;
                                    info.originalEndDts = latest.originalDts + latest.duration;
                                    info.firstSample = new _mediaSegmentInfo.SampleInfo(
                                        mp4Samples[0].dts,
                                        mp4Samples[0].pts,
                                        mp4Samples[0].duration,
                                        mp4Samples[0].originalDts,
                                        false
                                    );
                                    info.lastSample = new _mediaSegmentInfo.SampleInfo(
                                        latest.dts,
                                        latest.pts,
                                        latest.duration,
                                        latest.originalDts,
                                        false
                                    );
                                    if (!this._isLive) {
                                        this._audioSegmentInfoList.append(info);
                                    }

                                    track.samples = mp4Samples;
                                    track.sequenceNumber++;

                                    var moofbox = _mp4Generator2.default.moof(track, firstDts);
                                    track.samples = [];
                                    track.length = 0;

                                    this._onMediaSegment('audio', {
                                        type: 'audio',
                                        data: this._mergeBoxes(moofbox, mdatbox).buffer,
                                        sampleCount: mp4Samples.length,
                                        info: info
                                    });
                                }
                            },
                            {
                                key: '_generateSilentAudio',
                                value: function _generateSilentAudio(dts, frameDuration) {
                                    _logger2.default.v(
                                        this.TAG,
                                        'GenerateSilentAudio: dts = ' + dts + ', duration = ' + frameDuration
                                    );

                                    var unit = _aacSilent2.default.getSilentFrame(this._audioMeta.channelCount);
                                    if (unit == null) {
                                        _logger2.default.w(
                                            this.TAG,
                                            'Cannot generate silent aac frame for channelCount = ' +
                                                this._audioMeta.channelCount
                                        );
                                        return null;
                                    }

                                    var mp4Sample = {
                                        dts: dts,
                                        pts: dts,
                                        cts: 0,
                                        size: unit.byteLength,
                                        duration: frameDuration,
                                        originalDts: dts,
                                        flags: {
                                            isLeading: 0,
                                            dependsOn: 1,
                                            isDependedOn: 0,
                                            hasRedundancy: 0
                                        }
                                    };

                                    return {
                                        unit: unit,
                                        mp4Sample: mp4Sample
                                    };
                                }
                            },
                            {
                                key: '_remuxVideo',
                                value: function _remuxVideo(videoTrack) {
                                    //wytest
                                    //videoTrack.samples = [];
                                    //return;

                                    var track = videoTrack;
                                    var samples = track.samples;
                                    var dtsCorrection = undefined;
                                    var firstDts = -1,
                                        lastDts = -1;
                                    var firstPts = -1,
                                        lastPts = -1;

                                    if (!samples || samples.length === 0) {
                                        return;
                                    }
                                    //wy
                                    if (samples.length < 2) return;

                                    var bytes = 8 + videoTrack.length;
                                    var mdatbox = new Uint8Array(bytes);
                                    mdatbox[0] = (bytes >>> 24) & 0xff;
                                    mdatbox[1] = (bytes >>> 16) & 0xff;
                                    mdatbox[2] = (bytes >>> 8) & 0xff;
                                    mdatbox[3] = bytes & 0xff;
                                    mdatbox.set(_mp4Generator2.default.types.mdat, 4);

                                    //wytest
                                    /*
            info = null;
            moofbox = null;
            mdatbox = null;
            videoTrack.samples = null;
            videoTrack.samples = [];
            videoTrack.length = 0;
            return;
            */

                                    var offset = 8;
                                    var mp4Samples = [];
                                    var info = new _mediaSegmentInfo.MediaSegmentInfo();

                                    //wy
                                    while (samples.length > 1) {
                                        var avcSample = samples.shift();
                                        var keyframe = avcSample.isKeyframe;
                                        var originalDts = avcSample.dts - this._dtsBase;

                                        if (dtsCorrection == undefined) {
                                            if (this._videoNextDts == undefined) {
                                                if (this._videoSegmentInfoList.isEmpty()) {
                                                    dtsCorrection = 0;
                                                } else {
                                                    var lastSample = this._videoSegmentInfoList.getLastSampleBefore(
                                                        originalDts
                                                    );
                                                    if (lastSample != null) {
                                                        var distance =
                                                            originalDts -
                                                            (lastSample.originalDts + lastSample.duration);
                                                        if (distance <= 3) {
                                                            distance = 0;
                                                        }
                                                        var expectedDts =
                                                            lastSample.dts + lastSample.duration + distance;
                                                        dtsCorrection = originalDts - expectedDts;
                                                    } else {
                                                        // lastSample == null
                                                        dtsCorrection = 0;
                                                    }
                                                }
                                            } else {
                                                dtsCorrection = originalDts - this._videoNextDts;
                                            }
                                        }

                                        var dts = originalDts - dtsCorrection;
                                        var cts = avcSample.cts;
                                        var pts = dts + cts;

                                        if (firstDts === -1) {
                                            firstDts = dts;
                                            firstPts = pts;
                                        }

                                        // fill mdat box
                                        var sampleSize = 0;
                                        while (avcSample.units.length) {
                                            var unit = avcSample.units.shift();
                                            var data = unit.data;
                                            mdatbox.set(data, offset);
                                            offset += data.byteLength;
                                            sampleSize += data.byteLength;
                                        }

                                        var sampleDuration = 0;

                                        if (samples.length >= 1) {
                                            var nextDts = samples[0].dts - this._dtsBase - dtsCorrection;
                                            sampleDuration = nextDts - dts;
                                        } else {
                                            if (mp4Samples.length >= 1) {
                                                // lastest sample, use second last duration
                                                sampleDuration = mp4Samples[mp4Samples.length - 1].duration;
                                            } else {
                                                // the only one sample, use reference duration
                                                sampleDuration = this._videoMeta.refSampleDuration;
                                            }
                                        }

                                        if (keyframe) {
                                            var syncPoint = new _mediaSegmentInfo.SampleInfo(
                                                dts,
                                                pts,
                                                sampleDuration,
                                                avcSample.dts,
                                                true
                                            );
                                            syncPoint.fileposition = avcSample.fileposition;
                                            info.appendSyncPoint(syncPoint);
                                        }

                                        var mp4Sample = {
                                            dts: dts,
                                            pts: pts,
                                            cts: cts,
                                            size: sampleSize,
                                            isKeyframe: keyframe,
                                            duration: sampleDuration,
                                            originalDts: originalDts,
                                            flags: {
                                                isLeading: 0,
                                                dependsOn: keyframe ? 2 : 1,
                                                isDependedOn: keyframe ? 1 : 0,
                                                hasRedundancy: 0,
                                                isNonSync: keyframe ? 0 : 1
                                            }
                                        };

                                        mp4Samples.push(mp4Sample);
                                    }
                                    var latest = mp4Samples[mp4Samples.length - 1];
                                    lastDts = latest.dts + latest.duration;
                                    lastPts = latest.pts + latest.duration;
                                    this._videoNextDts = lastDts;

                                    // fill media segment info & add to info list
                                    info.beginDts = firstDts;
                                    info.endDts = lastDts;
                                    info.beginPts = firstPts;
                                    info.endPts = lastPts;
                                    info.originalBeginDts = mp4Samples[0].originalDts;
                                    info.originalEndDts = latest.originalDts + latest.duration;
                                    info.firstSample = new _mediaSegmentInfo.SampleInfo(
                                        mp4Samples[0].dts,
                                        mp4Samples[0].pts,
                                        mp4Samples[0].duration,
                                        mp4Samples[0].originalDts,
                                        mp4Samples[0].isKeyframe
                                    );
                                    info.lastSample = new _mediaSegmentInfo.SampleInfo(
                                        latest.dts,
                                        latest.pts,
                                        latest.duration,
                                        latest.originalDts,
                                        latest.isKeyframe
                                    );
                                    if (!this._isLive) {
                                        this._videoSegmentInfoList.append(info);
                                    }
                                    //wy
                                    var lastsample = track.samples[0];

                                    track.samples = mp4Samples;
                                    track.sequenceNumber++;

                                    // workaround for chrome < 50: force first sample as a random access point
                                    // see https://bugs.chromium.org/p/chromium/issues/detail?id=229412
                                    if (this._forceFirstIDR) {
                                        var flags = mp4Samples[0].flags;
                                        flags.dependsOn = 2;
                                        flags.isNonSync = 0;
                                    }

                                    var moofbox = _mp4Generator2.default.moof(track, firstDts);
                                    track.samples = [];
                                    track.length = 0;

                                    //wy
                                    track.samples.push(lastsample);
                                    track.length = lastsample.length;

                                    this._onMediaSegment('video', {
                                        type: 'video',
                                        data: this._mergeBoxes(moofbox, mdatbox).buffer,
                                        sampleCount: mp4Samples.length,
                                        info: info
                                    });
                                }
                            },
                            {
                                key: '_mergeBoxes',
                                value: function _mergeBoxes(moof, mdat) {
                                    var result = new Uint8Array(moof.byteLength + mdat.byteLength);
                                    result.set(moof, 0);
                                    result.set(mdat, moof.byteLength);
                                    return result;
                                }
                            },
                            {
                                key: 'onInitSegment',
                                get: function get() {
                                    return this._onInitSegment;
                                },
                                set: function set(callback) {
                                    this._onInitSegment = callback;
                                }

                                /* prototype: function onMediaSegment(type: string, mediaSegment: MediaSegment): void
           MediaSegment: {
               type: string,
               data: ArrayBuffer,
               sampleCount: int32
               info: MediaSegmentInfo
           }
        */
                            },
                            {
                                key: 'onMediaSegment',
                                get: function get() {
                                    return this._onMediaSegment;
                                },
                                set: function set(callback) {
                                    this._onMediaSegment = callback;
                                }
                            }
                        ]);

                        return MP4Remuxer;
                    })();

                    exports.default = MP4Remuxer;
                },
                {
                    '../core/media-segment-info.js': 8,
                    '../utils/browser.js': 39,
                    '../utils/exception.js': 40,
                    '../utils/logger.js': 41,
                    './aac-silent.js': 36,
                    './mp4-generator.js': 37
                }
            ],
            39: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var Browser = {};

                    function detect() {
                        // modified from jquery-browser-plugin

                        var ua = self.navigator.userAgent.toLowerCase();

                        var match =
                            /(edge)\/([\w.]+)/.exec(ua) ||
                            /(opr)[\/]([\w.]+)/.exec(ua) ||
                            /(chrome)[ \/]([\w.]+)/.exec(ua) ||
                            /(iemobile)[\/]([\w.]+)/.exec(ua) ||
                            /(version)(applewebkit)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec(ua) ||
                            /(webkit)[ \/]([\w.]+).*(version)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec(ua) ||
                            /(webkit)[ \/]([\w.]+)/.exec(ua) ||
                            /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
                            /(msie) ([\w.]+)/.exec(ua) ||
                            (ua.indexOf('trident') >= 0 && /(rv)(?::| )([\w.]+)/.exec(ua)) ||
                            (ua.indexOf('compatible') < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua)) ||
                            [];

                        var platform_match =
                            /(ipad)/.exec(ua) ||
                            /(ipod)/.exec(ua) ||
                            /(windows phone)/.exec(ua) ||
                            /(iphone)/.exec(ua) ||
                            /(kindle)/.exec(ua) ||
                            /(android)/.exec(ua) ||
                            /(windows)/.exec(ua) ||
                            /(mac)/.exec(ua) ||
                            /(linux)/.exec(ua) ||
                            /(cros)/.exec(ua) ||
                            [];

                        var matched = {
                            browser: match[5] || match[3] || match[1] || '',
                            version: match[2] || match[4] || '0',
                            majorVersion: match[4] || match[2] || '0',
                            platform: platform_match[0] || ''
                        };

                        var browser = {};
                        if (matched.browser) {
                            browser[matched.browser] = true;

                            var versionArray = matched.majorVersion.split('.');
                            browser.version = {
                                major: parseInt(matched.majorVersion, 10),
                                string: matched.version
                            };
                            if (versionArray.length > 1) {
                                browser.version.minor = parseInt(versionArray[1], 10);
                            }
                            if (versionArray.length > 2) {
                                browser.version.build = parseInt(versionArray[2], 10);
                            }
                        }

                        if (matched.platform) {
                            browser[matched.platform] = true;
                        }

                        if (browser.chrome || browser.opr || browser.safari) {
                            browser.webkit = true;
                        }

                        // MSIE. IE11 has 'rv' identifer
                        if (browser.rv || browser.iemobile) {
                            if (browser.rv) {
                                delete browser.rv;
                            }
                            var msie = 'msie';
                            matched.browser = msie;
                            browser[msie] = true;
                        }

                        // Microsoft Edge
                        if (browser.edge) {
                            delete browser.edge;
                            var msedge = 'msedge';
                            matched.browser = msedge;
                            browser[msedge] = true;
                        }

                        // Opera 15+
                        if (browser.opr) {
                            var opera = 'opera';
                            matched.browser = opera;
                            browser[opera] = true;
                        }

                        // Stock android browsers are marked as Safari
                        if (browser.safari && browser.android) {
                            var android = 'android';
                            matched.browser = android;
                            browser[android] = true;
                        }

                        browser.name = matched.browser;
                        browser.platform = matched.platform;

                        for (var key in Browser) {
                            if (Browser.hasOwnProperty(key)) {
                                delete Browser[key];
                            }
                        }
                        Object.assign(Browser, browser);
                    }

                    detect();

                    exports.default = Browser;
                },
                {}
            ],
            40: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();

                    function _possibleConstructorReturn(self, call) {
                        if (!self) {
                            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                        }
                        return call && (typeof call === 'object' || typeof call === 'function') ? call : self;
                    }

                    function _inherits(subClass, superClass) {
                        if (typeof superClass !== 'function' && superClass !== null) {
                            throw new TypeError(
                                'Super expression must either be null or a function, not ' + typeof superClass
                            );
                        }
                        subClass.prototype = Object.create(superClass && superClass.prototype, {
                            constructor: { value: subClass, enumerable: false, writable: true, configurable: true }
                        });
                        if (superClass)
                            Object.setPrototypeOf
                                ? Object.setPrototypeOf(subClass, superClass)
                                : (subClass.__proto__ = superClass);
                    }

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var RuntimeException = (exports.RuntimeException = (function () {
                        function RuntimeException(message) {
                            _classCallCheck(this, RuntimeException);

                            this._message = message;
                        }

                        _createClass(RuntimeException, [
                            {
                                key: 'toString',
                                value: function toString() {
                                    return this.name + ': ' + this.message;
                                }
                            },
                            {
                                key: 'name',
                                get: function get() {
                                    return 'RuntimeException';
                                }
                            },
                            {
                                key: 'message',
                                get: function get() {
                                    return this._message;
                                }
                            }
                        ]);

                        return RuntimeException;
                    })());

                    var IllegalStateException = (exports.IllegalStateException = (function (_RuntimeException) {
                        _inherits(IllegalStateException, _RuntimeException);

                        function IllegalStateException(message) {
                            _classCallCheck(this, IllegalStateException);

                            return _possibleConstructorReturn(
                                this,
                                (IllegalStateException.__proto__ || Object.getPrototypeOf(IllegalStateException)).call(
                                    this,
                                    message
                                )
                            );
                        }

                        _createClass(IllegalStateException, [
                            {
                                key: 'name',
                                get: function get() {
                                    return 'IllegalStateException';
                                }
                            }
                        ]);

                        return IllegalStateException;
                    })(RuntimeException));

                    var InvalidArgumentException = (exports.InvalidArgumentException = (function (_RuntimeException2) {
                        _inherits(InvalidArgumentException, _RuntimeException2);

                        function InvalidArgumentException(message) {
                            _classCallCheck(this, InvalidArgumentException);

                            return _possibleConstructorReturn(
                                this,
                                (
                                    InvalidArgumentException.__proto__ ||
                                    Object.getPrototypeOf(InvalidArgumentException)
                                ).call(this, message)
                            );
                        }

                        _createClass(InvalidArgumentException, [
                            {
                                key: 'name',
                                get: function get() {
                                    return 'InvalidArgumentException';
                                }
                            }
                        ]);

                        return InvalidArgumentException;
                    })(RuntimeException));

                    var NotImplementedException = (exports.NotImplementedException = (function (_RuntimeException3) {
                        _inherits(NotImplementedException, _RuntimeException3);

                        function NotImplementedException(message) {
                            _classCallCheck(this, NotImplementedException);

                            return _possibleConstructorReturn(
                                this,
                                (
                                    NotImplementedException.__proto__ || Object.getPrototypeOf(NotImplementedException)
                                ).call(this, message)
                            );
                        }

                        _createClass(NotImplementedException, [
                            {
                                key: 'name',
                                get: function get() {
                                    return 'NotImplementedException';
                                }
                            }
                        ]);

                        return NotImplementedException;
                    })(RuntimeException));
                },
                {}
            ],
            41: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var Log = (function () {
                        function Log() {
                            _classCallCheck(this, Log);
                        }

                        _createClass(Log, null, [
                            {
                                key: 'e',
                                value: function e(tag, msg) {
                                    if (!Log.ENABLE_ERROR) {
                                        return;
                                    }

                                    if (!tag || Log.FORCE_GLOBAL_TAG) tag = Log.GLOBAL_TAG;

                                    var str = '[' + tag + '] > ' + msg;

                                    if (console.error) {
                                        console.error(str);
                                    } else if (console.warn) {
                                        console.warn(str);
                                    } else {
                                        console.log(str);
                                    }
                                }
                            },
                            {
                                key: 'i',
                                value: function i(tag, msg) {
                                    if (!Log.ENABLE_INFO) {
                                        return;
                                    }

                                    if (!tag || Log.FORCE_GLOBAL_TAG) tag = Log.GLOBAL_TAG;

                                    var str = '[' + tag + '] > ' + msg;

                                    if (console.info) {
                                        console.info(str);
                                    } else {
                                        console.log(str);
                                    }
                                }
                            },
                            {
                                key: 'w',
                                value: function w(tag, msg) {
                                    if (!Log.ENABLE_WARN) {
                                        return;
                                    }

                                    if (!tag || Log.FORCE_GLOBAL_TAG) tag = Log.GLOBAL_TAG;

                                    var str = '[' + tag + '] > ' + msg;

                                    if (console.warn) {
                                        console.warn(str);
                                    } else {
                                        console.log(str);
                                    }
                                }
                            },
                            {
                                key: 'd',
                                value: function d(tag, msg) {
                                    if (!Log.ENABLE_DEBUG) {
                                        return;
                                    }

                                    if (!tag || Log.FORCE_GLOBAL_TAG) tag = Log.GLOBAL_TAG;

                                    var str = '[' + tag + '] > ' + msg;

                                    if (console.debug) {
                                        console.debug(str);
                                    } else {
                                        console.log(str);
                                    }
                                }
                            },
                            {
                                key: 'v',
                                value: function v(tag, msg) {
                                    if (!Log.ENABLE_VERBOSE) {
                                        return;
                                    }

                                    if (!tag || Log.FORCE_GLOBAL_TAG) tag = Log.GLOBAL_TAG;

                                    console.log('[' + tag + '] > ' + msg);
                                }
                            }
                        ]);

                        return Log;
                    })();

                    Log.GLOBAL_TAG = 'flv.js';
                    Log.FORCE_GLOBAL_TAG = false;
                    Log.ENABLE_ERROR = true;
                    Log.ENABLE_INFO = true;
                    Log.ENABLE_WARN = true;
                    Log.ENABLE_DEBUG = true;
                    Log.ENABLE_VERBOSE = true;

                    exports.default = Log;
                },
                {}
            ],
            42: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var _events = _dereq_('events');

                    var _events2 = _interopRequireDefault(_events);

                    var _logger = _dereq_('./logger.js');

                    var _logger2 = _interopRequireDefault(_logger);

                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    var LoggingControl = (function () {
                        function LoggingControl() {
                            _classCallCheck(this, LoggingControl);
                        }

                        _createClass(LoggingControl, null, [
                            {
                                key: 'getConfig',
                                value: function getConfig() {
                                    return {
                                        globalTag: _logger2.default.GLOBAL_TAG,
                                        forceGlobalTag: _logger2.default.FORCE_GLOBAL_TAG,
                                        enableVerbose: _logger2.default.ENABLE_VERBOSE,
                                        enableDebug: _logger2.default.ENABLE_DEBUG,
                                        enableInfo: _logger2.default.ENABLE_INFO,
                                        enableWarn: _logger2.default.ENABLE_WARN,
                                        enableError: _logger2.default.ENABLE_ERROR
                                    };
                                }
                            },
                            {
                                key: 'applyConfig',
                                value: function applyConfig(config) {
                                    _logger2.default.GLOBAL_TAG = config.globalTag;
                                    _logger2.default.FORCE_GLOBAL_TAG = config.forceGlobalTag;
                                    _logger2.default.ENABLE_VERBOSE = config.enableVerbose;
                                    _logger2.default.ENABLE_DEBUG = config.enableDebug;
                                    _logger2.default.ENABLE_INFO = config.enableInfo;
                                    _logger2.default.ENABLE_WARN = config.enableWarn;
                                    _logger2.default.ENABLE_ERROR = config.enableError;
                                }
                            },
                            {
                                key: '_notifyChange',
                                value: function _notifyChange() {
                                    var emitter = LoggingControl.emitter;

                                    if (emitter.listenerCount('change') > 0) {
                                        var config = LoggingControl.getConfig();
                                        emitter.emit('change', config);
                                    }
                                }
                            },
                            {
                                key: 'registerListener',
                                value: function registerListener(listener) {
                                    LoggingControl.emitter.addListener('change', listener);
                                }
                            },
                            {
                                key: 'removeListener',
                                value: function removeListener(listener) {
                                    LoggingControl.emitter.removeListener('change', listener);
                                }
                            },
                            {
                                key: 'forceGlobalTag',
                                get: function get() {
                                    return _logger2.default.FORCE_GLOBAL_TAG;
                                },
                                set: function set(enable) {
                                    _logger2.default.FORCE_GLOBAL_TAG = enable;
                                    LoggingControl._notifyChange();
                                }
                            },
                            {
                                key: 'globalTag',
                                get: function get() {
                                    return _logger2.default.GLOBAL_TAG;
                                },
                                set: function set(tag) {
                                    _logger2.default.GLOBAL_TAG = tag;
                                    LoggingControl._notifyChange();
                                }
                            },
                            {
                                key: 'enableAll',
                                get: function get() {
                                    return (
                                        _logger2.default.ENABLE_VERBOSE &&
                                        _logger2.default.ENABLE_DEBUG &&
                                        _logger2.default.ENABLE_INFO &&
                                        _logger2.default.ENABLE_WARN &&
                                        _logger2.default.ENABLE_ERROR
                                    );
                                },
                                set: function set(enable) {
                                    _logger2.default.ENABLE_VERBOSE = enable;
                                    _logger2.default.ENABLE_DEBUG = enable;
                                    _logger2.default.ENABLE_INFO = enable;
                                    _logger2.default.ENABLE_WARN = enable;
                                    _logger2.default.ENABLE_ERROR = enable;
                                    LoggingControl._notifyChange();
                                }
                            },
                            {
                                key: 'enableDebug',
                                get: function get() {
                                    return _logger2.default.ENABLE_DEBUG;
                                },
                                set: function set(enable) {
                                    _logger2.default.ENABLE_DEBUG = enable;
                                    LoggingControl._notifyChange();
                                }
                            },
                            {
                                key: 'enableVerbose',
                                get: function get() {
                                    return _logger2.default.ENABLE_VERBOSE;
                                },
                                set: function set(enable) {
                                    _logger2.default.ENABLE_VERBOSE = enable;
                                    LoggingControl._notifyChange();
                                }
                            },
                            {
                                key: 'enableInfo',
                                get: function get() {
                                    return _logger2.default.ENABLE_INFO;
                                },
                                set: function set(enable) {
                                    _logger2.default.ENABLE_INFO = enable;
                                    LoggingControl._notifyChange();
                                }
                            },
                            {
                                key: 'enableWarn',
                                get: function get() {
                                    return _logger2.default.ENABLE_WARN;
                                },
                                set: function set(enable) {
                                    _logger2.default.ENABLE_WARN = enable;
                                    LoggingControl._notifyChange();
                                }
                            },
                            {
                                key: 'enableError',
                                get: function get() {
                                    return _logger2.default.ENABLE_ERROR;
                                },
                                set: function set(enable) {
                                    _logger2.default.ENABLE_ERROR = enable;
                                    LoggingControl._notifyChange();
                                }
                            }
                        ]);

                        return LoggingControl;
                    })();

                    LoggingControl.emitter = new _events2.default();

                    exports.default = LoggingControl;
                },
                { './logger.js': 41, events: 2 }
            ],
            43: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });

                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                descriptor.enumerable = descriptor.enumerable || false;
                                descriptor.configurable = true;
                                if ('value' in descriptor) descriptor.writable = true;
                                Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            if (protoProps) defineProperties(Constructor.prototype, protoProps);
                            if (staticProps) defineProperties(Constructor, staticProps);
                            return Constructor;
                        };
                    })();

                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) {
                            throw new TypeError('Cannot call a class as a function');
                        }
                    }

                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    var Polyfill = (function () {
                        function Polyfill() {
                            _classCallCheck(this, Polyfill);
                        }

                        _createClass(Polyfill, null, [
                            {
                                key: 'install',
                                value: function install() {
                                    // ES6 Object.setPrototypeOf
                                    Object.setPrototypeOf =
                                        Object.setPrototypeOf ||
                                        function (obj, proto) {
                                            obj.__proto__ = proto;
                                            return obj;
                                        };

                                    // ES6 Object.assign
                                    Object.assign =
                                        Object.assign ||
                                        function (target) {
                                            if (target === undefined || target === null) {
                                                throw new TypeError('Cannot convert undefined or null to object');
                                            }

                                            var output = Object(target);
                                            for (var i = 1; i < arguments.length; i++) {
                                                var source = arguments[i];
                                                if (source !== undefined && source !== null) {
                                                    for (var key in source) {
                                                        if (source.hasOwnProperty(key)) {
                                                            output[key] = source[key];
                                                        }
                                                    }
                                                }
                                            }
                                            return output;
                                        };

                                    // ES6 Promise (missing support in IE11)
                                    if (typeof self.Promise !== 'function') {
                                        _dereq_('es6-promise').polyfill();
                                    }
                                }
                            }
                        ]);

                        return Polyfill;
                    })();

                    Polyfill.install();

                    exports.default = Polyfill;
                },
                { 'es6-promise': 1 }
            ],
            44: [
                function (_dereq_, module, exports) {
                    'use strict';

                    Object.defineProperty(exports, '__esModule', {
                        value: true
                    });
                    /*
                     * Copyright (C) 2016 Bilibili. All Rights Reserved.
                     *
                     * This file is derived from C++ project libWinTF8 (https://github.com/m13253/libWinTF8)
                     * @author zheng qian <xqq@xqq.im>
                     *
                     * Licensed under the Apache License, Version 2.0 (the "License");
                     * you may not use this file except in compliance with the License.
                     * You may obtain a copy of the License at
                     *
                     *     http://www.apache.org/licenses/LICENSE-2.0
                     *
                     * Unless required by applicable law or agreed to in writing, software
                     * distributed under the License is distributed on an "AS IS" BASIS,
                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                     * See the License for the specific language governing permissions and
                     * limitations under the License.
                     */

                    function checkContinuation(uint8array, start, checkLength) {
                        var array = uint8array;
                        if (start + checkLength < array.length) {
                            while (checkLength--) {
                                if ((array[++start] & 0xc0) !== 0x80) return false;
                            }
                            return true;
                        } else {
                            return false;
                        }
                    }

                    function decodeUTF8(uint8array) {
                        var out = [];
                        var input = uint8array;
                        var i = 0;
                        var length = uint8array.length;

                        while (i < length) {
                            if (input[i] < 0x80) {
                                out.push(String.fromCharCode(input[i]));
                                ++i;
                                continue;
                            } else if (input[i] < 0xc0) {
                                // fallthrough
                            } else if (input[i] < 0xe0) {
                                if (checkContinuation(input, i, 1)) {
                                    var ucs4 = ((input[i] & 0x1f) << 6) | (input[i + 1] & 0x3f);
                                    if (ucs4 >= 0x80) {
                                        out.push(String.fromCharCode(ucs4 & 0xffff));
                                        i += 2;
                                        continue;
                                    }
                                }
                            } else if (input[i] < 0xf0) {
                                if (checkContinuation(input, i, 2)) {
                                    var _ucs =
                                        ((input[i] & 0xf) << 12) | ((input[i + 1] & 0x3f) << 6) | (input[i + 2] & 0x3f);
                                    if (_ucs >= 0x800 && (_ucs & 0xf800) !== 0xd800) {
                                        out.push(String.fromCharCode(_ucs & 0xffff));
                                        i += 3;
                                        continue;
                                    }
                                }
                            } else if (input[i] < 0xf8) {
                                if (checkContinuation(input, i, 3)) {
                                    var _ucs2 =
                                        ((input[i] & 0x7) << 18) |
                                        ((input[i + 1] & 0x3f) << 12) |
                                        ((input[i + 2] & 0x3f) << 6) |
                                        (input[i + 3] & 0x3f);
                                    if (_ucs2 > 0x10000 && _ucs2 < 0x110000) {
                                        _ucs2 -= 0x10000;
                                        out.push(String.fromCharCode((_ucs2 >>> 10) | 0xd800));
                                        out.push(String.fromCharCode((_ucs2 & 0x3ff) | 0xdc00));
                                        i += 4;
                                        continue;
                                    }
                                }
                            }
                            out.push(String.fromCharCode(0xfffd));
                            ++i;
                        }

                        return out.join('');
                    }

                    exports.default = decodeUTF8;
                },
                {}
            ]
        },
        {},
        [21]
    )(21);
});

//# sourceMappingURL=flv.js.map

function liveplay(video, url, restarttime) {
    if (!flvjs.isSupported()) console.log('flv dont supported');
    var flvPlayer = flvjs.createPlayer(
        {
            type: 'flv',
            isLive: true,
            url: url
        },
        {
            enableStashBuffer: true
            /*
          seekType: "param",
          seekParamStart: "start"*/
        }
    );
    flvPlayer.attachMediaElement(video);
    flvPlayer.load();
    flvPlayer.play();
    video.flvPlayer = flvPlayer;

    if (restarttime) {
        video.fivPlayerTimer = setTimeout(function () {
            liveplaystop(video);
            liveplay(video, url);
        }, restarttime);
    }

    flvPlayer.on(flvjs.Events.ERROR, function (event, data) {
        console.log('type:' + event + ' details:' + data);

        switch (event) {
            case 'NetworkError':
                /*
                flvPlayer.pause();
                flvPlayer.unload();
                setTimeout(function () {
                    liveplaystop(video);
                    liveplay(video, url);
                }, 1000);
                */
                flvPlayer.unload();
                setTimeout(function () {
                    flvPlayer.load();
                    flvPlayer.play();
                }, 1000);
                break;
            case 'MediaError':
                flvPlayer.pause();
                flvPlayer.unload();
                setTimeout(function () {
                    liveplaystop(video);
                    liveplay(video, url);
                }, 1000);
                break;
            default:
        }
    });
    return flvPlayer;
}

function playstart(video, url, dur) {
    if (!flvjs.isSupported()) console.log('flv dont supported');
    var flvPlayer = flvjs.createPlayer(
        {
            type: 'flv',
            isLive: false,
            url: url,
            duration: dur
        },
        {
            enableStashBuffer: false,
            lazyLoad: true,
            lazyLoadMaxDuration: 40,
            lazyLoadRecoverDuration: 5,
            seekType: 'param',
            seekParamStart: 'start'
        }
    );
    flvPlayer.attachMediaElement(video);
    flvPlayer.load();
    flvPlayer.play();
    video.flvPlayer = flvPlayer;

    flvPlayer.on(flvjs.Events.ERROR, function (event, data) {
        console.log('type:' + event + ' details:' + data);
    });
    return flvPlayer;
}
function liveplaystop(video) {
    if (video.flvPlayer) {
        video.flvPlayer.destroy();
        video.flvPlayer = null;
    }
    if (video.fivPlayerTimer) {
        clearTimeout(video.fivPlayerTimer);
    }
}
function captureimage(video, savename) {
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    var url = canvas.toDataURL();
    var saveFile = function (data, filename) {
        var save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
        save_link.href = data;
        save_link.download = filename;

        var event = document.createEvent('MouseEvents');
        event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        save_link.dispatchEvent(event);
    };
    saveFile(url, savename);
}

function showsub(video, subtext) {
    var texttrack = video.textTracks[0];
    if (!texttrack) {
        texttrack = video.addTextTrack('subtitles', 'sample');
        texttrack.mode = 'showing';
        window['VTTCue'] = window['VTTCue'] || window['TextTrackCue'];
    }
    var currentCue = texttrack.cues[0];
    if (currentCue) {
        texttrack.removeCue(currentCue);
    }
    currentCue = new VTTCue(0, 99999, subtext);
    currentCue.line = 0;
    currentCue.align = 'start';
    texttrack.addCue(currentCue);
}
