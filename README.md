node-synchronized
=================

Ensure that some code always executes exclusively, in the order it is called

Examples
--------

Where you have some asynchronous code that should not be executing concurrently,
e.g. where the next call relies on the result of the previous call. Some string
or object identifies the scope of mutual-exclusion.

```js
var synchd = require('synchronized');

synchd(cachedDocs, function(done){
  // Return cached response if available
  if (cachedDocs[id]) {
    return done(null, cachedDocs[id]);
  }

  // Otherwise fetch
  Model.findById(id, function(err, document){
    // ...

    cachedDocs[id] = document;
    done(null, document);
  });
}, cb);
```

You can also conveniently create a last-argument error-first callback function
to pass to a flow-control library structure, such as the ones available in
[async](https://github.com/caolan/async).


```js
async.parallel({
  company: synchd.fn(companyId, function(done){
    fetchedCompany(companyId, done);
  }),

  companyManager: synchd.fn(companyId, function(done){
    fetchedCompany(companyId, function(err, company){
      if (err) // ...

      done(null, company.manager);
    });
  })
}, function(err, results){
  if (err) // ...
});
```

As an optimization, you may want to create reusable function that will first
try to perform a cheap, non-mutually-exclusive operation, such as an in-memory
cache lookup, before performing the expensive, mutually-exclusive operation.

Such a cache lookup function would again be performed before executing queued
calls to the expensive operation so as to avoid it when possible.

Note that the context (`this`) can be used where the reusable function is stored
on an object.

```js
var myObj = { id: 'abc', localCache: null, localCachedAt: null };

myObj.lookup = synchd.cachedFn(function scopeLookup() {
  return this;
}, function cacheLookup(cb, cont) {
  // Return cached response if available
  if (this.localCachedAt) return cb(null, this.localCache);

  cont();
}, function expensiveLookup(cb) {
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

License
-------
MIT
