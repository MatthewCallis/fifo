var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var LocalStorage = function () {
  function LocalStorage() {
    classCallCheck(this, LocalStorage);
  }

  createClass(LocalStorage, [{
    key: "getItem",
    value: function getItem(key) {
      if (Object.prototype.hasOwnProperty.call(this, key)) {
        return String(this[key]);
      }
      return null;
    }
  }, {
    key: "setItem",
    value: function setItem(key, val) {
      this[key] = String(val);
    }
  }, {
    key: "removeItem",
    value: function removeItem(key) {
      delete this[key];
    }
  }, {
    key: "clear",
    value: function clear() {
      var self = this;
      Object.keys(this).forEach(function (key) {
        self[key] = undefined;
        delete self[key];
      });
    }
  }, {
    key: "key",
    value: function key() {
      var i = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

      return Object.keys(this)[i];
    }
  }, {
    key: "length",
    get: function get$$1() {
      return Object.keys(this).length;
    }
  }]);
  return LocalStorage;
}();

var Fifo = function () {
  /**
   * Contructs a new Fifo object.
   * @param {object} options - The Fifo configuration.
   */
  function Fifo() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    classCallCheck(this, Fifo);

    this.namespace = options.namespace || 'fifo';
    this.noLS = false;

    if (options.console) {
      this.console = options.console;
    } else {
      this.console = function () {};
    }

    this.checkLocalStorage(options.shim);
    this.data = {
      keys: [],
      items: {}
    };

    var dataFromStorage = JSON.parse(this.LS.getItem(this.namespace));
    if (dataFromStorage && Object.prototype.hasOwnProperty.call(dataFromStorage, 'keys') && Object.prototype.hasOwnProperty.call(dataFromStorage, 'items')) {
      this.data = dataFromStorage;
    } else {
      this.console('error', 'Namespace Collision, or, data is not in the correct format.');
    }
  }

  createClass(Fifo, [{
    key: 'checkLocalStorage',
    value: function checkLocalStorage(shim) {
      // NOTE: This check has to be wrapped within a try/catch because of a SecurityError: DOM Exception 18 on iOS.
      /* istanbul ignore next */
      try {
        if (typeof shim !== 'undefined' || typeof localStorage !== 'undefined' && localStorage !== null) {
          this.LS = shim || localStorage;
          this.noLS = false;
        } else {
          this.LS = new LocalStorage();
          this.noLS = true;
          this.console('warn', 'No localStorage, shimming.');
        }
      } catch (error) {
        this.LS = new LocalStorage();
        this.noLS = true;
        this.console('warn', 'No localStorage, shimming.');
      }
    }

    /**
     * Attempts to save the key/value pair to localStorage.
     * @return {boolean} - Whether or not the save was successful.
     */

  }, {
    key: 'trySave',
    value: function trySave() {
      if (this.noLS) {
        return false;
      }

      try {
        this.LS.setItem(this.namespace, JSON.stringify(this.data));
        return true;
      } catch (error) {
        // 18 for Safari: SecurityError: DOM Exception 18
        // 21 for some Safari
        // 22 for Chrome and Safari, 1014 for Firefox: QUOTA_EXCEEDED_ERR
        // -2147024882 for IE10 Out of Memory
        /* istanbul ignore next */
        if (error.code === 18 || error.code === 21 || error.code === 22 || error.code === 1014 || error.number === -2147024882) {
          return false;
        }
        /* istanbul ignore next */
        this.console('error', 'Error with localStorage:', error);
        /* istanbul ignore next */
        return true;
      }
    }

    /**
     * Attempts to remove the first item added to make room for the next.
     * @return The item being removed.
     */

  }, {
    key: 'removeFirstIn',
    value: function removeFirstIn() {
      var firstIn = this.data.keys.pop();
      var removedItem = {
        key: firstIn,
        value: this.data.items[firstIn]
      };
      delete this.data.items[firstIn];
      return removedItem;
    }

    /**
     * Save the key/value pair to localStorage.
     * @return The item being removed.
     */

  }, {
    key: 'save',
    value: function save() {
      var removed = [];
      if (this.noLS) {
        return removed;
      }

      while (!this.trySave()) {
        // NOTE: Difficult to test without a browser, and difficult in a browser.
        /* istanbul ignore next */
        if (this.data.keys.length) {
          removed.push(this.removeFirstIn());
        } else {
          this.console('error', 'All items removed from ' + this.namespace + ', still can\'t save.');
        }
      }

      return removed;
    }

    /**
     * Set a key/value pair.
     * @param {string} key - The key to use in the key value pair.
     * @param value - The value to use in the key value pair.
     * @return The current instance of Fifo.
     */

  }, {
    key: 'set',
    value: function set$$1(key, value) {
      this.data.items[key] = value;
      var index = this.data.keys.indexOf(key);
      if (index > -1) {
        this.data.keys.splice(index, 1);
      }
      this.data.keys.unshift(key);
      this.save();
      return this;
    }

    /**
     * Get a value for a given key.
     * @param {string} [key] - The key to use in the key value pair.
     * @return The item, or, all items when no key is provided.
     */

  }, {
    key: 'get',
    value: function get$$1(key) {
      if (key) {
        return this.data.items[key];
      }

      // Return all items.
      return this.data.items;
    }

    /**
     * All the keys currently being used.
     * @return {array} The keys.
     */

  }, {
    key: 'keys',
    value: function keys() {
      return this.data.keys || [];
    }

    /**
     * Checks for the existence of a key.
     * @param {string} key - The key to check for.
     * @return {boolean} Wheter or not the key exist.
     */

  }, {
    key: 'has',
    value: function has(key) {
      return this.data.keys.indexOf(key) !== -1;
    }

    /**
     * Removes a key/value pair from the collection.
     * @param victim - The key/value pair to find, can be one of a String, Regular Expression or a Function.
     * @return The current instance of Fifo.
     */

  }, {
    key: 'remove',
    value: function remove(victim) {
      var _this = this;

      if (victim == null || !this.data.keys) {
        return this;
      }

      var keys = this.data.keys;

      keys.forEach(function (suspect, i) {
        if (suspect === victim) {
          _this.data.keys.splice(i, 1);
          delete _this.data.items[suspect];
        }
      }, this);

      this.save();
      return this;
    }

    /**
     * Resets the local data and saves empting out the localStorage to an empty state.
     * @return The current instance of Fifo.
     */

  }, {
    key: 'empty',
    value: function empty() {
      this.data = {
        keys: [],
        items: {}
      };
      this.save();
      return this;
    }
  }]);
  return Fifo;
}();

export default Fifo;
