var queues = [];
var scopeKeys = [];
var freedKeys = [];

function scopeKeyForObject(obj){
  if (!scopeKeys.length) {
    scopeKeys.push(obj);
    return 0;
  }

  var key = scopeKeys.indexOf(obj);
  if (key > -1) return key;

  var newKey = freedKeys.pop();
  if (newKey !== undefined) {
    scopeKeys[newKey] = obj;
    return newKey;
  }

  scopeKeys.push(obj);
  return scopeKeys.length - 1;
}

function freeScope(scopeKey) {
  delete(queues[scopeKey]);
  delete(scopeKeys[scopeKey]);
  freedKeys.push(scopeKey);
}

function callNext(scopeKey) {
  var queue = queues[scopeKey];

  if (queue.length > 1) {
    queue.pop();

    var lastFn = queue[queue.length - 1];

    process.nextTick(lastFn);
  } else {
    freeScope(scopeKey);
  }
}

/**
 * Return whether the passed variable is a function
 *
 * @param {Mixed} value
 * @return {Boolean}
 * @api private
 */
function isFunction(value) {
  return toString.call(value) == funcClass;
}
var funcClass = '[object Function]';

/**
 * Ensure that some code (fn) always executes exclusively (by scope),
 * in the order it is called (call done, then next)
 *
 * @param {Object} scopeObj Object to use as scope, using strict equals '==='
 * @param {Function} fn(cb) Code to call in synchronized fashion
 * @param {Function} done() Called with arguments passed to cb
 * @api public
 */
var synchd = module.exports = function synchd(scopeObj, fn, done){
  var self = this;

  var scopeKey = scopeKeyForObject(isFunction(scopeObj) ? scopeObj.call(self) : scopeObj);

  var queue = queues[scopeKey];

  var queuedFn = function() {
    fn.call(self, function(){
      if (done) { done.apply(null, arguments); }
      callNext(scopeKey)
    });
  }

  if (queue) {
    queue.unshift(queuedFn);
  } else {
    queues[scopeKey] = [queuedFn];
    queuedFn();
  }
}

/**
 * Return a function that can be called with a callback
 *
 * @param {Object} [scopeObj]   Optional scope
 * @param {Function} fn(cb)
 * @return {Function} fn(*, done) Last ar
 * @api public
 */
module.exports.fn = function(scopeObj, synchdFn) {
  if (!synchdFn) {
    synchdFn = scopeObj;
    scopeObj = null;
  }
  return function(){
    var self = this;
    var done = arguments[arguments.length - 1];
    var fnPassed = synchdFn;

    if (arguments.length > 1) {
      // Bind arguments to called fn
      var newArguments = Array.prototype.slice.call(arguments, 0, arguments.length - 1);

      fnPassed = function(callback){
        newArguments.push(callback);

        synchdFn.apply(self, newArguments);
      };
    }

    synchd.call(self, scopeObj, fnPassed, done);
  };
}

/**
 * Return a function that can be used as a cache lookup
 *
 * @param {Object|Function} [scopeObj]   Optional scope, can be a function returning a scope object
 * @param {Function} fn(cb)
 * @return {Function} fn(*, done) Last ar
 * @api public
 */
module.exports.cachedFn = function(scopeObj, cacheLookupFn, synchdFn) {
  if (!synchdFn) {
    synchdFn = cacheLookupFn;
    cacheLookupFn = scopeObj;
    scopeObj = null;
  }
  return function(){
    var self = this;
    var done = arguments[arguments.length - 1];

    if (arguments.length > 1) {
      // Bind arguments to called fn
      var cacheLookupArguments = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
      cacheLookupArguments.push(done, function afterFirstNotFound(){
        cacheLookupArguments.length -= 2; // Prepare to re-use array

        synchd.call(self, scopeObj, function(callback){
          cacheLookupArguments.push(callback, function afterSecondNotFound(){
            cacheLookupArguments.length -= 2; // Prepare to re-use array

            var synchdFnArguments = cacheLookupArguments;
            synchdFnArguments.push(callback);
            synchdFn.apply(self, synchdFnArguments);
          });
          cacheLookupFn.apply(self, cacheLookupArguments);
        }, done);
      });
      cacheLookupFn.apply(self, cacheLookupArguments);
    } else {
      cacheLookupFn.call(self, done, function afterNotFound(){
        synchd.call(self, scopeObj, function(callback){
          cacheLookupFn.call(self, callback, synchdFn.bind(self, callback));
        }, done);
      }, done);
    }
  };
}

module.exports.freed = function(){
  return freedKeys.length;
}

module.exports.inScope = function(){
  return Object.keys(scopeKeys).length;
}

module.exports.scopeKeys = function(){
  return scopeKeys;
}
