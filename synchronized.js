var queues = {};

var scopeObjects = [];

var freedKeys = [];

function scopeKeyForObject(obj){
  if (!scopeObjects.length) {
    scopeObjects.push(obj);
    return 0;
  }
  
  var key = scopeObjects.indexOf(obj);  
  if (key > -1) return key;
  
  var newKey = freedKeys.pop();
  if (newKey !== undefined) {
    scopeObjects[newKey] = obj;
    return newKey;
  }
  
  scopeObjects.push(obj);
  return scopeObjects.length - 1;
}

function freeScope(scopeKey) {
  delete(queues[scopeKey]);
  delete(scopeObjects[scopeKey]);
  freedKeys.push(scopeKey);
}

function callNext(scopeKey) {
  var queue = queues[scopeKey];    
  
  if (queue.length > 1) {
    queue.pop();
    queue[queue.length - 1]();  
  } else {
    freeScope(scopeKey);
  }
}

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
  var scopeKey = scopeKeyForObject(scopeObj)
  
  var queue = queues[scopeKey];  
  
  var newFn = function(){
    fn(function(){
      if (done) { done.apply(null, arguments); }
      callNext(scopeKey)
    });      
  }
  
  if (queue) {
    queue.unshift(newFn);
  } else {
    queues[scopeKey] = [newFn];
    newFn();
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
module.exports.fn = function(scopeObj, fn) {
  if (!fn) {
    fn = scopeObj;
    scopeObj = null;
  }
  return function(){
    var done = arguments[arguments.length - 1];
    
    if (arguments.length > 1) {
      // Bind arguments to called fn
      var newFn = fn,
          newArguments = Array.prototype.slice.call(arguments, 0, arguments.length - 2);
      
      fn = function(done){
        newArguments.push(done);
        
        newFn.call(null, newArguments);
      };
    }
    
    synchd(scopeObj, fn, done);
  };
}

module.exports.freed = function(){
  return freedKeys.length;
}

module.exports.inScope = function(){
  return Object.keys(scopeObjects).length;
}