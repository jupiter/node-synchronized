var synchd = require('./synchronized');

exports['functions executed in sequence and arguments passed to done'] = {
  'multiple calls with objects as scope': function(test){
    var self = this;

    var scopes = {
      scopeA: {},
      scopeB: {}
    };

    var completedOrder = [];

    test.expect(9);

    synchd(scopes.scopeA, function(cb){
      setTimeout(function(){
        cb('firstArg', 'secondArg');
      }, 500);
    }, function(firstArg, secondArg){

      test.same(firstArg, 'firstArg');
      test.same(secondArg, 'secondArg'); 

      completedOrder.push('scopeA-block1');
      done();
    });          

    synchd(scopes.scopeB, function(cb){
      setTimeout(function(){
        cb('thirdArg', 'fourthArg');
      }, 20);
    }, function(firstArg, secondArg){

      test.same(firstArg, 'thirdArg');
      test.same(secondArg, 'fourthArg'); 

      completedOrder.push('scopeB-block1');
      done();
    });          

    synchd(scopes.scopeA, function(cb){
      setTimeout(function(){
        cb('fifthArg', 'sixthArg');
      }, 50);
    }, function(firstArg, secondArg){

      test.same(firstArg, 'fifthArg');
      test.same(secondArg, 'sixthArg'); 

      completedOrder.push('scopeA-block2');
      done();
    });          

    synchd(scopes.scopeB, function(cb){
      setTimeout(function(){
        cb('seventhArg', 'eighthArg');
      }, 200);
    }, function(firstArg, secondArg){

      test.same(firstArg, 'seventhArg');
      test.same(secondArg, 'eighthArg'); 

      completedOrder.push('scopeB-block2');
      done();
    });          

    var expectedCompletedOrder = [
      'scopeB-block1',
      'scopeB-block2',
      'scopeA-block1',
      'scopeA-block2'
    ];

    var expected = 4;

    function done(){
      expected--;

      if (expected) return;

      test.same(expectedCompletedOrder, completedOrder);

      test.done();
    }
  },
  
  'multiple calls with equal strings as scope': function(test){
    var self = this;

    var scopes = {
      scopeA: 'scope',
      scopeB: 'scope'
    };

    var completedOrder = [];

    test.expect(9);

    synchd(scopes.scopeA, function(cb){
      setTimeout(function(){
        cb('firstArg', 'secondArg');
      }, 500);
    }, function(firstArg, secondArg){

      test.same(firstArg, 'firstArg');
      test.same(secondArg, 'secondArg'); 

      completedOrder.push('scopeA-block1');
      done();
    });          

    synchd(scopes.scopeB, function(cb){
      setTimeout(function(){
        cb('thirdArg', 'fourthArg');
      }, 20);
    }, function(firstArg, secondArg){

      test.same(firstArg, 'thirdArg');
      test.same(secondArg, 'fourthArg'); 

      completedOrder.push('scopeB-block1');
      done();
    });          

    synchd(scopes.scopeA, function(cb){
      setTimeout(function(){
        cb('fifthArg', 'sixthArg');
      }, 50);
    }, function(firstArg, secondArg){

      test.same(firstArg, 'fifthArg');
      test.same(secondArg, 'sixthArg'); 

      completedOrder.push('scopeA-block2');
      done();
    });          

    synchd(scopes.scopeB, function(cb){
      setTimeout(function(){
        cb('seventhArg', 'eighthArg');
      }, 200);
    }, function(firstArg, secondArg){

      test.same(firstArg, 'seventhArg');
      test.same(secondArg, 'eighthArg'); 

      completedOrder.push('scopeB-block2');
      done();
    });          

    var expectedCompletedOrder = [
      'scopeA-block1',
      'scopeB-block1',
      'scopeA-block2',
      'scopeB-block2'
    ];

    var expected = 4;

    function done(){
      expected--;

      if (expected) return;
      
      test.same(expectedCompletedOrder, completedOrder);

      test.done();
    }
  },
  
  'single call': function(test) {
    test.expect(2);
    
    synchd('scope', function(cb){
      test.ok('main function called');
      cb();
    }, function(){

      test.same(1, synchd.inScope());

      test.done();      
    });        
  },
  
  'with no `done` callback passed': function(test) {
    test.expect(2);
    
    synchd('scope', function(cb){
      test.ok('main function called');
      cb();
    });    
    
    test.same(0, synchd.inScope());
    
    test.done();
  }
}