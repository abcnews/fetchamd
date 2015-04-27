/* global $ */
(function(global) {
	/**
	 * A private var that captures the last values defined.
	 * This allows anonymous defines included accidentally to define without
	 * messing up our own calls.
	 */
	var lastDefine = false;

	/**
	 * Cache for defined objects, so we don't have to reload them again.
	 */
	var defined = {};

	/**
	 * Basic async foreach similar to the `async` library.
	 * @param a [Array] The array of objects to iterate over.
	 * @param iterator [function] Called with each item in `a`. Two params, value & callback.
	 * @param done [function] Callback once array is finished.
	 */
	var eachAsync = function(a, iterator, done) {
		var count = a.length;
		var returns = [];
		var doEach = function() {
			count--;
			iterator(a[count], function(returned) {
				returns.push(returned);
				if (count > 0) {
					doEach(count);
				} else {
					returns.reverse();
					done(returns);
				}
			});
		};
		doEach();
	};

	/**
	 * Poll document state until things are good.
	 */
	var waitUntil = function(condition, cb){
		var checkInterval = 100; // ms
		var interval = function(){
			if(!condition()){
				setTimeout(interval);
			} else {
				cb();
			}
		};
		interval();
	}

	/**
	 * Load a script & call back when it's fired.
	 * @todo Timeout/error detection if this would be valuable.
	 */
	var scriptLoad = function(module, onload){
		// Create a script for feature detection & potentially loading with.
		var s = document.createElement('script');

		if (typeof s.onload !== 'undefined') {
			// Modern Browsers:
			// If we support onload, use that. This benefits from any compiler
			// optimisations & caching.
			s.onload = onload;
			s.src=module;
			s.async = 'async';
			document.head.appendChild(s);
		} else {
			// IE < 11, pretty much:
			// Otherwise use jQuery, because this browser isn't much use.
			// Note: jQuery uses an eval-like technique which doesn't utilise
			// compile caching or optimising: http://bit.ly/1acICkx
			$.ajax({
				url: module,
				dataType: 'script',
				cache: true,
				success: onload
			});
		}
	};

	/**
	 * define
	 * Real basic implementation of define. All the magic happens in requireOne.
	 * @param name [string] Optional name of the module we're defining.
	 * @param deps [array] Optional dependencies
	 * @param factory [function] The factory used to create the module.
	 */
	var define = function(name, deps, factory) {
		//Allow for anonymous modules
		if (typeof name !== 'string') {
			//Adjust args appropriately
			factory = deps;
			deps = name;
			name = null;
		}

		//This module may not have dependencies
		if (deps instanceof Array === false) {
			factory = deps;
			deps = null;
		}

		lastDefine = {
			deps: deps,
			factory: factory
		};
	};

	// Define function complies with a basic subset of the AMD API
	define.amd = {
		fetchamd: 1
	};

	var onReady = function(cb){
		if(!window.define){
			return cb();
		}

		// There's already a `define` in the window, and it's not ours.
		if(!define.amd || !define.amd.fetchamd){
			throw 'Incompatible mix of defines found in page.';
		}

		// There's a define from another version of fetchamd, so wait
		// around until it's finished.
		waitUntil(function(){
			return typeof window.define === 'undefined';
		}, cb)
	}

	/**
	 * Get one module+dependencies
	 * This function gets the specified module, firing off another getMany if
	 * the requested module has dependencies.
	 * @param module [String] String path to the module to load.
	 * @param callback [function] Callback recieves requested module as only argument.
	 */
	var requireOne = function(module, callback) {
		// Module already loaded? Return it straight away.
		if (defined[module]) {
			callback(defined[module]);
			return;
		}

		// When the script loads, do the following:
		var onload = function() {
			// Remove it so it has less chance to interfere with anything.
			delete window.define;

			// Make a copy because we may clobber it fetching extra deps.
			var thisDefine = $.extend({}, lastDefine);

			function done(args) {
				defined[module] = thisDefine.factory.apply(this, args);

				// Reply with the last define we defined.
				callback(defined[module]);
			}

			// Fetch any extra dependencies if required
			if (thisDefine.deps) {
				console.error(
					'fetchamd: don\'t use second level dependencies',
					module
				);
				done();
				// This would work, but we shouldn't rely on it because it will
				// make a migration to RequireJS et al exponentionally difficult
				// getMany(thisDefine.deps, function() {
				// 	done(arguments);
				// });
			} else {
				done();
			}
		};

		// wait unti the page is ready to start loading.
		onReady(function(){
			// Insert a global define method, because that's what AMD scripts look
			// for. This may interfere with other scripts, so we try to keep it
			// global for as short a time as possible.
			global.define = define;
			scriptLoad(module, onload);
		});
	};

	/**
	 * Get many modules + dependencies
	 * @param modules [Array] List of modules to load.
	 * @param callback [function] Callback recieves each requested module as arguments.
	 */
	var getMany = function(modules, callback) {
		// Loop through each module & fetch it.
		eachAsync(modules, function(mod, cb) {
			requireOne(mod, function(requiredMod) {
				cb(requiredMod);
			});
		}, function(requires) {
			// Once we're done, call back with the arguments requested.
			callback.apply(window, requires);
		});
	};

	// Expose some globals yo
	module.exports = getMany;

}(window));
