var synchd = require('synchronized');

/**
 * 
 * The first argument is the queue that will be used (scopeObj in the documentation)
 * All functions belonging to the same queue will be executed the "First In, First Out" way
 * 
 * The second argument is the function to be executed synchronisly
 *      Last argument to that function is a callback you'll need to call to tell synchronized this function is done executing, it can go to the next one
 */
var test = synchd.fn('test', function(nb, cbSync) {
    console.log('nb ' + nb + ' running !');
    setTimeout(function() {
        console.log('nb ' + nb + ' done !');
        // we're done : tell synchronized it can execute the following function(s) in the queue
        cbSync();
    }, 2000);
});

for(var i = 0; i < 10; i++) {
    // the second argument is a callback function - called by synchronized when the 'test' function has run
    // it has nothing to do with cbSync - see "done" in the documentation
    test(i, null);
}