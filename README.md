node-synchronized
=================

Ensure that some code always executes exclusively, in the order it is called

Examples
--------

This is particularly useful if you have some asynchronous code that should not
be executing concurrently, e.g. where the next call relies on the result of the
previous call. (Also see last example below.)

```
  var synchd = require('synchronized');

  MyObject.prototype.fetchedDocument = function(id, cb) {
    var self = this;

    synchd(self._documentCache, function(done){
      // Return cached response if available
      if (self._documentCache[id]) {
        return done(null, self._documentCache[id]);
      }

      // Otherwise fetch
      Model.findById(id, function(err, document){
        // ...

        self._documentCache[id] = document;
        done(null, document);
      });
    }, cb);
  }

```

A factory for when you're passing multiple asynchronous functions to a flow-control
library method, such as [async](https://github.com/caolan/async).parallel(),
and you have a dependency or other reason for wanting a subset of the executed
functions not be called concurrently.

```

  async.parallel({
    company: synchd.fn(this.companyId, function(done){
      person.fetchedCompany(done);
    }),

    // ... Other functions

    companyManager: synchd.fn(this.companyId, function(done){
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

For the case of having a local cache to some expensive asynchronous call.

```
  var myObj = { id: 'abc', localCache: null, localCachedAt: null };

  myObj.lookup = synchd.cachedFn(function scopeLookup() {
    return this;
  }, function cacheLookup(cb, cont) {
    // Return cached response if available
    if (this.localCachedAt) return cb(null, this.localCache);

    cont();
  }, function remoteLookup(cb) {
    var self = this;

    // Otherwise fetch
    Model.findById(self.id, function(err, document){
      // ....

      self.localCachedAt = new Date();
      self.localCache = document;
      done(null, document);
    });
  })

  myObj.lookup(function(err, document){ console.log(myObj.localCachedAt) });
  myObj.lookup(function(err, document){ console.log(myObj.localCachedAt) });
```

Prints:

```
  Tue Sep 16 2014 15:17:35 GMT+0100 (BST)
  Tue Sep 16 2014 15:17:35 GMT+0100 (BST)
```

Usage
-----

### synchd(scopeObj, fn, done) ###

- scopeObj - An object or string as scope, or function returning either of these
- fn(cb) - The function to call one at a time per scope, first argument is the
callback to call on completion, e.g. `function(done) { process.nextTick(done) }`
- done - (Optional) Called when execution of the provided function has
completed, called with same arguments as provided callback

### synchd.fn(scopeObj, fn) ###

- scopeObj - (Optional) As above, default: `null` (global)
- fn(..., cb) - cb as above. Other arguments passed from newFn.

Returns:

- newFn(..., cb) - First arguments passed to fn, last argument
callback

### synchd.cachedFn(scopeObj, cacheLookupFn, fn) ###

- scopeObj - (Optional) As above, default: `null` (global)
- cacheLookupFn(..., cb, cont) Must call *either* cb or cont, where cb is
completion callback (as above) and call fn. Other arguments passed from newFn.
- fn(..., cb) - cb as above.  Other arguments passed from newFn.

Returns:

- newFn(..., cb) - First arguments passed to fn, last argument
callback

Note: if newFn is called in context of an object, this will be the context
fn and cacheLookupFn.


Installation
------------


Inspiration
-----------

License
-------
