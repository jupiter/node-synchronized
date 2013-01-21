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

    var lastProps = queue[queue.length - 1];
    
    process.nextTick(function(){
      callWithProps(lastProps);      
    });
  } else {
    freeScope(scopeKey);
  }
}

function callWithProps(props) {
  props.fn.call(props.context || null, function(){
    if (props.done) { props.done.apply(null, arguments); }
    callNext(props.scopeKey)
  });  
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

  var props = {
    context: self,
    scopeKey: scopeKey,
    fn: fn,
    done: done
  };
  
  if (queue) {
    queue.unshift(props);
  } else {
    queues[scopeKey] = [props];
    callWithProps(props);
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
    var self = this;
    
    var done = arguments[arguments.length - 1];
    
    if (arguments.length > 1) {
      // Bind arguments to called fn
      var newFn = fn,
          newArguments = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
      
      fn = function(done){
        newArguments.push(done);
        
        newFn.apply(self, newArguments);
      };
    }
    
    synchd.call(self, scopeObj, fn, done);
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