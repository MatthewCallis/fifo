'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  clear() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  removeItem(key) {
    delete this.store[key];
  }
  setItem(key, value) {
    if (value) {
      this.store[key] = value.toString();
    }
  }
  key(index) {
    return Object.keys(this.store)[index];
  }
  get length() {
    return Object.keys(this.store).length;
  }
}

class Fifo {
  constructor(options = {}) {
    this.namespace = options.namespace || 'fifo';
    this.noLS = false;
    this.console = options.console || function console() {};
    this.data = {
      keys: [],
      items: {}
    };
    this.checkLocalStorage(options.shim);
    const dataFromStorage = JSON.parse(this.LS.getItem(this.namespace));
    if (dataFromStorage && Object.prototype.hasOwnProperty.call(dataFromStorage, 'keys') && Object.prototype.hasOwnProperty.call(dataFromStorage, 'items')) {
      this.data = dataFromStorage;
    } else {
      this.console('error', 'Namespace Collision, or, data is not in the correct format.');
    }
  }
  checkLocalStorage(shim) {
    try {
      if (typeof shim !== 'undefined' || typeof localStorage !== 'undefined' && localStorage !== null) {
        this.LS = shim || localStorage;
        this.noLS = false;
      } else {
        this.LS = new LocalStorageMock();
        this.noLS = true;
        this.console('warn', 'No localStorage, shimming.');
      }
    } catch (error) {
      this.LS = new LocalStorageMock();
      this.noLS = true;
      this.console('warn', 'No localStorage, shimming.');
    }
  }
  trySave() {
    if (this.noLS) {
      return false;
    }
    try {
      this.LS.setItem(this.namespace, JSON.stringify(this.data));
      return true;
    } catch (error) {
      if (error.code === 18 || error.code === 21 || error.code === 22 || error.code === 1014 || error.number === -2147024882) {
        return false;
      }
      this.console('error', 'Error with localStorage:', error);
      return true;
    }
  }
  removeFirstIn() {
    const firstIn = this.data.keys.pop();
    const removedItem = {
      key: firstIn,
      value: this.data.items[firstIn]
    };
    delete this.data.items[firstIn];
    return removedItem;
  }
  save() {
    const removed = [];
    if (this.noLS) {
      return removed;
    }
    while (!this.trySave()) {
      if (this.data.keys.length) {
        removed.push(this.removeFirstIn());
      } else {
        this.console('error', `All items removed from ${this.namespace}, still can't save.`);
      }
    }
    return removed;
  }
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
  get(key) {
    if (key) {
      return this.data.items[key];
    }
    return this.data.items;
  }
  keys() {
    return this.data.keys || [];
  }
  has(key) {
    return this.data.keys.indexOf(key) !== -1;
  }
  remove(target) {
    if (target == null || !this.data.keys) {
      return;
    }
    const {
      keys
    } = this.data;
    keys.forEach((suspect, i) => {
      if (suspect === target) {
        this.data.keys.splice(i, 1);
        delete this.data.items[suspect];
      }
    }, this);
    this.save();
  }
  empty() {
    this.data = {
      keys: [],
      items: {}
    };
    this.save();
  }
}

exports["default"] = Fifo;
//# sourceMappingURL=fifo.js.map
