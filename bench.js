var synchd = require('./synchronized-static'),
    synchdAlt = require('./synchronized-bind');

var _ = require('underscore');
var async = require('async');

var BenchMark = require('benchmark');
var suite = new BenchMark.Suite();

var delayedValue = function(done) {
  setTimeout(function(){
    done(null, new Date());
  }, 10);
}

var stackSize = 5000;

suite.add('Series w/o synchd', function(deferred) {
  var calls = _.range(stackSize),
      cache = null,
      dvCalled = 0,
      eaCalled = 0;

  async.forEachSeries(calls, function(i, next){   
    eaCalled += 1;
    
    if (cache) return process.nextTick(next);
    
    delayedValue(function(err, val){    
      dvCalled += 1;
      cache = val;
      process.nextTick(next);
    });    
  }, function(){
    // console.log(cache, dvCalled, eaCalled);
    deferred.resolve();
  });
}, { defer: true })

.add('Parallel w/ synchd', function(deferred) {
  var calls = _.range(stackSize),
      cache = null,
      dvCalled = 0,
      eaCalled = 0;
      
  async.forEach(calls, function(i, next){
    eaCalled += 1;
        
    if (cache) return next();//process.nextTick(next);
    
    synchd(suite, function(next){
      if (cache) return next();//process.nextTick(next);

      delayedValue(function(err, val){
        dvCalled += 1;
        cache = val;
        next();
        // process.nextTick(next);
      });      
    }, next);
  }, function(){
    // console.log(cache, dvCalled, eaCalled);
    deferred.resolve();
  });
}, { defer: true })

.add('Parallel w/ synchd Alt', function(deferred) {
  var calls = _.range(stackSize),
      cache = null,
      dvCalled = 0,
      eaCalled = 0;
      
  async.forEach(calls, function(i, next){
    eaCalled += 1;
        
    if (cache) return next();//process.nextTick(next);
    
    synchdAlt(suite, function(next){
      if (cache) return next();//process.nextTick(next);

      delayedValue(function(err, val){
        dvCalled += 1;
        cache = val;
        next();
        // process.nextTick(next);
      });      
    }, next);
  }, function(){
    // console.log(cache, dvCalled, eaCalled);
    deferred.resolve();
  });
}, { defer: true })


// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));  
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})
// run async
.run();
