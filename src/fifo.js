import LocalStorage from './localStorage';

export default class Fifo {
  /**
   * Contructs a new Fifo object.
   * @param {object} options - The Fifo configuration.
   */
  constructor(options = {}) {
    this.namespace = options.namespace || 'fifo';
    this.noLS = false;

    if (options.console) {
      this.console = options.console;
    } else {
      this.console = () => {};
    }

    this.checkLocalStorage(options.shim);
    this.data = {
      keys: [],
      items: {},
    };

    const dataFromStorage = JSON.parse(this.LS.getItem(this.namespace));
    if (dataFromStorage && Object.prototype.hasOwnProperty.call(dataFromStorage, 'keys') && Object.prototype.hasOwnProperty.call(dataFromStorage, 'items')) {
      this.data = dataFromStorage;
    } else {
      this.console('error', 'Namespace Collision, or, data is not in the correct format.');
    }
  }

  checkLocalStorage(shim) {
    // NOTE: This check has to be wrapped within a try/catch because of a SecurityError: DOM Exception 18 on iOS.
    /* istanbul ignore next */
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
  }

  /**
   * Attempts to save the key/value pair to localStorage.
   * @return {boolean} - Whether or not the save was successful.
   */
  trySave() {
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
   * @return The item being removed.
   */
  save() {
    const removed = [];
    if (this.noLS) {
      return removed;
    }

    while (!this.trySave()) {
      // NOTE: Difficult to test without a browser, and difficult in a browser.
      /* istanbul ignore next */
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
   * @param {string} key - The key to use in the key value pair.
   * @param value - The value to use in the key value pair.
   * @return The current instance of Fifo.
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
   * @param {string} [key] - The key to use in the key value pair.
   * @return The item, or, all items when no key is provided.
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
   * @return {array} The keys.
   */
  keys() {
    return this.data.keys || [];
  }

  /**
   * Checks for the existence of a key.
   * @param {string} key - The key to check for.
   * @return {boolean} Wheter or not the key exist.
   */
  has(key) {
    return this.data.keys.indexOf(key) !== -1;
  }

  /**
   * Removes a key/value pair from the collection.
   * @param victim - The key/value pair to find, can be one of a String, Regular Expression or a Function.
   * @return The current instance of Fifo.
   */
  remove(victim) {
    if (victim == null || !this.data.keys) {
      return this;
    }

    const keys = this.data.keys;
    keys.forEach((suspect, i) => {
      if (suspect === victim) {
        this.data.keys.splice(i, 1);
        delete this.data.items[suspect];
      }
    }, this);

    this.save();
    return this;
  }

  /**
   * Resets the local data and saves empting out the localStorage to an empty state.
   * @return The current instance of Fifo.
   */
  empty() {
    this.data = {
      keys: [],
      items: {},
    };
    this.save();
    return this;
  }
}
