var callbackScopes = {};

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
  delete(callbackScopes[scopeKey]);
  delete(scopeObjects[scopeKey]);
  freedKeys.push(scopeKey);
}

function callNext(scopeKey) {
  var callbacks = callbackScopes[scopeKey];    
  
  if (callbacks.length > 1) {
    callbacks.pop();
    callbacks[callbacks.length - 1]();  
  } else {
    freeScope(scopeKey);
  }
}

/**
 * Ensure that some code (fn) always executes exclusively (by scope), 
 * in the order it is called (call done, then next)
 *
 * @param {Object} scope Object to use as scope, using strict equals '==='
 * @param {Function} fn(cb) Code to call in synchronized fashion
 * @param {Function} done() Called with arguments passed to cb
 * @api public
 */
module.exports = function synchd(scopeObj, fn, done){
  var scopeKey = scopeKeyForObject(scopeObj)
  
  var callbacks = callbackScopes[scopeKey];  
  
  var newFn = function(){
    fn(function(){
      if (done) { done.apply(null, arguments); }
      callNext(scopeKey)
    });      
  }
  
  if (callbacks) {
    callbacks.unshift(newFn);
  } else {
    callbackScopes[scopeKey] = [newFn];
    newFn();
  }
}

module.exports.freed = function(){
  return freedKeys.length;
}

module.exports.inScope = function(){
  return Object.keys(scopeObjects).length;
}