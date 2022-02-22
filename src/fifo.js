import LocalStorage from './localStorage.js';

/**
 * The Fifo configuration object.
 *
 * @typedef {object} FifoOptions
 * @property {string} [namespace] The name of the key in localStorage.
 * @property {Function} [console] An optional console logging function.
 * @property {object} [shim] A shim class to act as localStorage in case it is missing.
 */

/**
 * A single rule where a subject is compared against a given value on an SDK.
 *
 * @typedef {object} FifoData
 * @property {string[]} keys The collection of keys in the collection.
 * @property {object} items The actual items in the collection.
 */

export default class Fifo {
  /**
   * Contructs a new Fifo object.
   *
   * @param {FifoOptions} options The Fifo configuration.
   */
  constructor(options = {}) {
    this.namespace = options.namespace || 'fifo';
    this.noLS = false;
    this.console = options.console || function console() {};
    /** @type {FifoData} The localStoage data */
    this.data = {
      keys: [],
      items: {},
    };

    this.checkLocalStorage(options.shim);

    const dataFromStorage = JSON.parse(this.LS.getItem(this.namespace));
    if (dataFromStorage && Object.prototype.hasOwnProperty.call(dataFromStorage, 'keys') && Object.prototype.hasOwnProperty.call(dataFromStorage, 'items')) {
      this.data = dataFromStorage;
    } else {
      this.console('error', 'Namespace Collision, or, data is not in the correct format.');
    }
  }

  /**
   * Checks for the existence of localStorage and shims it should it not exist.
   * This check has to be wrapped within a try/catch because of a SecurityError: DOM Exception 18 on iOS.
   *
   * @param {object} shim A shim class to act as localStorage in case it is missing.
   */
  checkLocalStorage(shim) {
    /* c8 ignore start */
    try {
      if (typeof shim !== 'undefined' || (typeof localStorage !== 'undefined' && localStorage !== null)) {
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
    /* c8 ignore stop */
  }

  /**
   * Attempts to save the key/value pair to localStorage.
   * Possible Errors:
   * - 18 for Safari: SecurityError: DOM Exception 18
   * - 21 for some Safari
   * - 22 for Chrome and Safari, 1014 for Firefox: QUOTA_EXCEEDED_ERR
   * - -2147024882 for IE10 Out of Memory
   *
   * @returns {boolean} Whether or not the save was successful.
   */
  trySave() {
    if (this.noLS) {
      return false;
    }

    try {
      this.LS.setItem(this.namespace, JSON.stringify(this.data));
      return true;
      /* c8 ignore next 7 */
    } catch (error) {
      if (error.code === 18 || error.code === 21 || error.code === 22 || error.code === 1014 || error.number === -2147024882) {
        return false;
      }
      this.console('error', 'Error with localStorage:', error);
      return true;
    }
  }

  /**
   * Attempts to remove the first item added to make room for the next.
   *
   * @returns {object} The item being removed.
   */
  removeFirstIn() {
    const firstIn = this.data.keys.pop();
    const removedItem = {
      key: firstIn,
      value: this.data.items[firstIn],
    };
    delete this.data.items[firstIn];
    return removedItem;
  }

  /**
   * Save the key/value pair to localStorage.
   * This is difficult to test without a browser, and difficult in a browser.
   *
   * @returns {object[]} The item being removed.
   */
  save() {
    const removed = [];
    if (this.noLS) {
      return removed;
    }

    /* c8 ignore next 7 */
    while (!this.trySave()) {
      if (this.data.keys.length) {
        removed.push(this.removeFirstIn());
      } else {
        this.console('error', `All items removed from ${this.namespace}, still can't save.`);
      }
    }

    return removed;
  }

  /**
   * Set a key/value pair.
   *
   * @param {string} key The key to use in the key value pair.
   * @param {string|number} value The value to use in the key value pair.
   * @returns {Fifo} The current instance of Fifo.
   */
  set(key, value) {
    this.data.items[key] = value;
    const index = this.data.keys.indexOf(key);
    if (index > -1) {
      this.data.keys.splice(index, 1);
    }
    this.data.keys.unshift(key);
    this.save();
    return this;
  }

  /**
   * Get a value for a given key.
   *
   * @param {string} [key] The key to use in the key value pair.
   * @returns {*|[*]} The item, or, all items when no key is provided.
   */
  get(key) {
    if (key) {
      return this.data.items[key];
    }

    // Return all items.
    return this.data.items;
  }

  /**
   * All the keys currently being used.
   *
   * @returns {Array} The keys.
   */
  keys() {
    return this.data.keys || [];
  }

  /**
   * Checks for the existence of a key.
   *
   * @param {string} key - The key to check for.
   * @returns {boolean} Wheter or not the key exist.
   */
  has(key) {
    return this.data.keys.indexOf(key) !== -1;
  }

  /**
   * Removes a key/value pair from the collection.
   *
   * @param {string} target - The key/value pair to find, can be one of a String, Regular Expression or a Function.
   */
  remove(target) {
    if (target == null || !this.data.keys) {
      return;
    }

    const { keys } = this.data;
    keys.forEach((suspect, i) => {
      if (suspect === target) {
        this.data.keys.splice(i, 1);
        delete this.data.items[suspect];
      }
    }, this);

    this.save();
  }

  /**
   * Resets the local data and saves empting out the localStorage to an empty state.
   */
  empty() {
    this.data = {
      keys: [],
      items: {},
    };
    this.save();
  }
}
