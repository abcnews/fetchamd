fetchamd
============

A lightweight AMD module loader for the client-side.

Have you ever wanted to load up a library programmatically, like Underscore, D3, or something you've written yourself and felt it's just out of your grasp? Enter
fetchamd, your dead simple AMD loader.

````
var load = require('fetchamd');

load([
    'http://example.org/module1.js',
    '/res/modules/module2.js'
], function(module1, module2){
    // module1 and module2 are ready to use.
});
````

Features/support
----------------

This library is not intended as a replacement for RequireJS or other fully
featured module loaders. This library doesn't implement the full AMD spec for
recursive module loading or relative name resolution. Thus, it is intended as
a loader for discrete pre-compiled modules (such as those compiled with
Browserify) rather than full trees of AMD dependencies.

Supports:

* Require single or multiple modules.
* Async loading & optimal script insertion (utilises browser compile/caching
  optimisations)
* Basic implementation for older IEs using jQuery's preexisting implementation.
  This reduces the size and complexity of this library.

Differences from AMD spec:

* Relative module loading is not implemented (if module "a/b/c" asks for "../d", AMD resolves to "a/d"). For this reason:
* Dependencies are not supported. Use Browserify to bundle up your dependencies prior to loading, or load them yourself.

Development
-----------

Tests for this module are written in Mocha + Chai & require a web server (such
as Python's SimpleHTTPServer). To test this module:

1. `npm install` to make sure you have all the dependencies.
2. `npm run server` to start a web server (this step requires Python, but you
    can run this from your own web server if you'd prefer).
3. Open `http://0.0.0.0:8000/test/` in your browser to run the tests.
