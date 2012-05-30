node-synchronized
=================

Ensure that some code always executes exclusively, in the order it is called

Usage
-----

### synchronized(scopeObj, fn, done) ###

- scopeObj - An object or string as scope
- fn(cb) - The function to call one at a time per scope, first argument is the 
callback to call on completion, e.g. `function(done) { process.nextTick(done) }`
- done - (Optional) Called when execution of the provided function has 
completed, called with same arguments as provided callback

### synchronized.fn(scopeObj, fn) ###

- scopeObj - (Optional) An object or string as scope, default: `null` (global)
- fn(..., cb) - cb as above.  Other arguments passed from newFn.

Returns:
- newFn(..., cb) - First arguments passed to fn, last argument 
callback

Examples
--------

This is particularly useful if you have some asynchronous code that should not
be executing concurrently, such as a cached database call, where calling it 
multiple times would result in the caching functionality not having an effect.

```
  var synchronized = require('synchronized');
  
  MyObject.prototype.fetchedDocument = function(id, cb) {
    var self = this;
    
    synchronized(self._documentCache, function(done){
      // Return cached response if available
      if (self._documentCache[id]) { 
        return done(null, self._documentCache[id]);
      }

      // Otherwise fetch
      Model.findById(id, function(err, document){
        if (err) {
          return done(err);
        }
        
        self._documentCache[id] = document;
        done(null, document);
      });
    }, cb);
  }

```

If you are using passing multiple asynchronous functions to a flow-control 
library method, such as [async](https://github.com/caolan/async).parallel(), 
and you have a dependency or other reason for wanting a subset of the executed
functions not be called concurrently.

```

  async.parallel({
    company: synchronized.fn(this.companyId, function(done){
      person.fetchedCompany(done);
    }),
    
    // ... Other functions
    
    companyManager: synchronized.fn(this.companyId, function(done){
      person.fetchedCompany(function(err, company){
        if (err) etc.
        
        done(null, company.manager);
      });
    })
  }, function(err, results){
    if (err) etc.
    
    // ...
  });
  
```

Installation
------------


Inspiration
-----------

License
-------