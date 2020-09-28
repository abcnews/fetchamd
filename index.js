/* eslint-disable no-param-reassign */
/**
 * A private var that captures the last values defined.
 * This allows anonymous defines included accidentally to define without
 * messing up our own calls.
 */
let lastDefine = false;

/**
 * Cache for defined objects, so we don't have to reload them again.
 */
const defined = {};

/**
 * Basic async foreach similar to the `async` library.
 * @param a [Array] The array of objects to iterate over.
 * @param iterator [function] Called with each item in `a`. Two params, value & callback.
 * @param done [function] Callback once array is finished.
 */
function eachAsync(a, iterator, done) {
  let count = a.length;
  const returns = [];
  function doEach() {
    count -= 1;
    iterator(a[count], (returned) => {
      returns.push(returned);
      if (count > 0) {
        doEach(count);
      } else {
        returns.reverse();
        done(returns);
      }
    });
  }
  doEach();
}

/**
 * Poll document state until things are good.
 */
function waitUntil(condition, cb) {
  const checkInterval = 50; // ms
  function interval() {
    if (!condition()) {
      setTimeout(interval, checkInterval);
    } else {
      cb();
    }
  }
  interval();
}

/**
 * Load a script & call back when it's fired.
 */
function scriptLoad(module, onload) {
  const s = document.createElement('script');
  s.onload = onload;
  s.src = module;
  s.async = 'async';
  document.head.appendChild(s);
}

/**
 * define
 * Real basic implementation of define. All the magic happens in requireOne.
 * @param name [string] Optional name of the module we're defining.
 * @param deps [array] Optional dependencies
 * @param factory [function] The factory used to create the module.
 */
function define(name, deps, factory) {
  // Allow for anonymous modules
  if (typeof name !== 'string') {
    // Adjust args appropriately
    factory = deps;
    deps = name;
    name = null;
  }

  // This module may not have dependencies
  if (deps instanceof Array === false) {
    factory = deps;
    deps = null;
  }

  lastDefine = {
    deps,
    factory,
  };
}

// Define function complies with a basic subset of the AMD API
define.amd = {
  fetchamd: 1,
};

function onReady(cb) {
  if (!window.define) {
    return cb();
  }

  // There's already a `define` in the window, and it's not ours.
  if (!define.amd || !define.amd.fetchamd) {
    throw new Error('Incompatible mix of defines found in page.');
  }

  // There's a define from another version of fetchamd, so wait
  // around until it's finished.
  return waitUntil(() => typeof window.define === 'undefined', cb);
}

/**
 * Get one module+dependencies
 * This function gets the specified module, firing off another getMany if
 * the requested module has dependencies.
 * @param module [String] String path to the module to load.
 * @param callback [function] Callback recieves requested module as only argument.
 */
function requireOne(modulePath, callback) {
  // Module already loaded? Return it straight away.
  if (defined[modulePath]) {
    callback(defined[modulePath]);
    return;
  }

  // When the script loads, do the following:
  function onload() {
    // Remove it so it has less chance to interfere with anything.
    window.define = undefined;

    // Make a copy because we may clobber it fetching extra deps.
    const thisDefine = { ...lastDefine };

    function done(args) {
      if (thisDefine) {
        // Apply the factory.
        // https://github.com/amdjs/amdjs-api/wiki/AMD#factory-
        if (typeof thisDefine.factory === 'function') {
          // factory, is a fn that should be executed to
          // instantiate the module. Tt should only be
          // executed once.
          defined[modulePath] = thisDefine.factory.apply(this, (args || []));
        } else if (typeof thisDefine.factory === 'object') {
          // If the factory argument is an object, that object
          // should be assigned as the exported value.
          defined[modulePath] = thisDefine.factory;
        }
      }

      // Reply with the last define we defined.
      callback(defined[modulePath]);
    }

    // Fetch any extra dependencies if required
    if (thisDefine.deps && thisDefine.deps.length) {
      throw new Error(
        `fetchamd: don't use second level dependencies: ${modulePath}`,
      );
    }
    done();
  }

  // wait unti the page is ready to start loading.
  onReady(() => {
    // Insert a global define method, because that's what AMD scripts look
    // for. This may interfere with other scripts, so we try to keep it
    // global for as short a time as possible.
    window.define = define;
    scriptLoad(modulePath, onload);
  });
}

/**
 * Get many modules + dependencies
 * @param modules [Array] List of modules to load.
 * @param callback [function] Callback recieves each requested module as arguments.
 */
function getMany(modules, callback) {
  // Loop through each module & fetch it.
  eachAsync(modules, (mod, cb) => {
    requireOne(mod, (requiredMod) => {
      cb(requiredMod);
    });
  }, (requires) => {
    // Once we're done, call back with the arguments requested.
    callback.apply(window, requires);
  });
}

// Expose some globals
module.exports = getMany;
