/* eslint-disable no-param-reassign */
(() => {
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
   * Number of modules yet to call back
   */
  let modulesCount = 0;

  /**
   * Load a script & call back when it's fired.
   */
  function scriptLoad(moduleSrc) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.onload = resolve;
      s.onerror = reject;
      s.src = moduleSrc;
      s.async = 'async';
      document.head.appendChild(s);
    });
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

  /**
   * Get one module+dependencies
   * This function gets the specified module, firing off another getMany if
   * the requested module has dependencies.
   * @param module [String] String path to the module to load.
   * @param callback [function] Callback recieves requested module as only argument.
   */
  function requireOne(modulePath) {
    // Module already loaded? Return it straight away.
    if (defined[modulePath]) {
      return Promise.resolve(defined[modulePath]);
    }

    // There's already a `define` in the window, and it's not ours.
    if (!define.amd || !define.amd.fetchamd) {
      throw new Error('Incompatible mix of defines found in page.');
    }

    // Insert a global define method, because that's what AMD scripts look
    // for. This may interfere with other scripts, so we try to keep it
    // global for as short a time as possible.
    window.define = define;
    modulesCount += 1;

    return scriptLoad(modulePath)
      .then(() => {
        modulesCount -= 1;

        if (modulesCount === 0) {
          // Remove it so it has less chance to interfere with anything.
          window.define = undefined;
        }

        // Make a copy because we may clobber it fetching extra deps.
        const thisDefine = { ...lastDefine };

        // Fetch any extra dependencies if required
        if (thisDefine.deps && thisDefine.deps.length) {
          throw new Error(
            `fetchamd: don't use second level dependencies: ${modulePath}`,
          );
        }

        if (thisDefine) {
          // Apply the factory.
          // https://github.com/amdjs/amdjs-api/wiki/AMD#factory-
          if (typeof thisDefine.factory === 'function') {
            // factory, is a fn that should be executed to
            // instantiate the module. Tt should only be
            // executed once.
            defined[modulePath] = thisDefine.factory.apply(this, []);
          } else if (typeof thisDefine.factory === 'object') {
            // If the factory argument is an object, that object
            // should be assigned as the exported value.
            defined[modulePath] = thisDefine.factory;
          }
        }

        // Reply with the last define we defined.
        return defined[modulePath];
      });
  }

  // Expose some globals
  if (typeof module === 'object') {
    module.exports = requireOne;
  } else {
    window.fetchAmd = requireOne;
  }
})();
