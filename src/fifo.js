export default class Fifo {
  constructor(namespace = 'fifo') {
    this.namespace = namespace;
    this.noLS = false;
    this.queueLimit = null;
    this.data = {
      keys: [],
      items: {}
    };
    try {
      if (typeof localStorage !== "undefined" && localStorage !== null) {
        this.data = JSON.parse(localStorage.getItem(this.namespace)) || {
          keys: [],
          items: {}
        };
      } else {
        this.noLS = true;
      }
    } catch (e) {
      this.data = {
        keys: [],
        items: {}
      };
      this.noLS = true;
    }
  }

  trySave(key, value) {
    var error, error1;
    if (this.noLS) {
      return false;
    }
    try {
      if (!key) {
        if (this.queueLimit && (this.data.keys.length > this.queueLimit)) {
          return false;
        }
        localStorage.setItem(this.namespace, JSON.stringify(this.data));
      } else {
        localStorage.setItem(key, value);
      }
      return true;
    } catch (e) {
      let error = e;
      if (error.code === 18 || error.code === 21 || error.code === 22 || error.code === 1014 || error.number === -2147024882) {
        return false;
      }
      throw error;
    }
  }

  removeFirstIn() {
    let firstIn = this.data.keys.pop();
    let removedItem = {
      key: firstIn,
      value: this.data.items[firstIn]
    };
    delete this.data.items[firstIn];
    return removedItem;
  }

  save(key, value) {
    let removed = [];
    if (this.noLS) {
      return removed;
    }
    while (!this.trySave(key, value)) {
      if (this.data.keys.length) {
        removed.push(this.removeFirstIn());
        if (!this.noLS) {
          if (key) {
            localStorage.setItem(this.namespace, JSON.stringify(this.data));
          }
        }
      } else {
        throw new Error(`All items removed from ${this.namespace}, still can't save.`);
      }
    }
    return removed;
  }

  set(key, value, onRemoved) {
    this.data.items[key] = value;
    let index = this.data.keys.indexOf(key);
    if (index > -1) {
      this.data.keys.splice(index, 1);
    }
    this.data.keys.unshift(key);

    let removed = this.save();
    if (onRemoved && removed.length) {
      onRemoved.call(this, removed);
    }
    return this;
  }

  get(key) {
    if (key) {
      if (this.noLS) {
        return this.data.items[key];
      } else {
        return localStorage.getItem(key) || this.data.items[key];
      }
    } else {
      if (this.noLS) {
        return this.data.items;
      } else {
        let items = this.data.items;
        let keys = Object.keys(localStorage);
        for (let i = 0, len = keys.length; i < len; i++) {
          key = keys[i];
          if (key !== this.namespace) {
            items[key] = localStorage.getItem(key);
          }
        }
        return items;
      }
    }
  }

  setFixed(key, value, onRemoved) {
    if (this.noLS) {
      this.data.items[key] = value;
      let index = this.data.keys.indexOf(key);
      if (index > -1) {
        this.data.keys.splice(index, 1);
      }
      this.data.keys.unshift(key);
    }
    let removed = this.save(key, value);
    if (onRemoved && removed.length) {
      onRemoved.call(this, removed);
    }
    return this;
  }

  keys() {
    var i, j, key, keys, len, len1, ref, ref1;
    keys = [];
    ref = this.data.keys;
    for (i = 0, len = ref.length; i < len; i++) {
      key = ref[i];
      keys.push(key);
    }
    if (this.noLS) {
      if (this.queueLimit) {
        keys.splice(-1 * this.queueLimit);
      }
      return keys;
    }
    ref1 = Object.keys(localStorage);
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      key = ref1[j];
      if (key !== this.namespace) {
        keys.push(key);
      }
    }
    return keys;
  }

  has(key) {
    if (this.noLS) {
      if (this.queueLimit) {
        let keys = this.data.keys.slice(0);
        keys.splice(-1 * this.queueLimit);
        if (-1 !== keys.indexOf(key)) {
          return true;
        } else {
          return false;
        }
      }
      if (-1 !== this.data.keys.indexOf(key)) {
        return true;
      } else {
        return false;
      }
    }
    if (-1 !== this.data.keys.indexOf(key)) {
      return true;
    }
    if (localStorage.getItem(key) !== null) {
      return true;
    }
    return false;
  }

  remove(victim) {
    if (typeof victim === 'string') {
      return this._removeByString(victim);
    }
    if (victim instanceof RegExp) {
      return this._removeByRegExp(victim);
    }
    if (typeof victim === 'function') {
      return this._removeByFunction(victim);
    }
  }

  _removeByString(victim) {
    var i, index, len, ref, suspect;
    if (!this.noLS) {
      if (localStorage.getItem(victim)) {
        localStorage.removeItem(victim);
        return this;
      }
    }
    ref = this.data.keys;
    for (index = i = 0, len = ref.length; i < len; index = ++i) {
      suspect = ref[index];
      if (!(suspect === victim)) {
        continue;
      }
      this.data.keys.splice(index, 1);
      break;
    }
    delete this.data.items[victim];
    this.save();
    return this;
  }

  _removeByRegExp(victim) {
    var i, index, j, len, len1, ref, ref1, suspect;
    if (!this.noLS) {
      Object.keys(localStorage).forEach(function(suspect) {
        if (suspect.match(victim)) {
          return localStorage.removeItem(suspect);
        }
      });
    }
    ref = this.data.keys;
    for (index = i = 0, len = ref.length; i < len; index = ++i) {
      suspect = ref[index];
      if (!(suspect !== null && suspect !== undefined ? suspect.match(victim) : undefined)) {
        continue;
      }
      this.data.keys.splice(index, 1);
      delete this.data.items[suspect];
    }
    if (this.noLS) {
      ref1 = Object.keys(this.data.items);
      for (index = j = 0, len1 = ref1.length; j < len1; index = ++j) {
        suspect = ref1[index];
        if (!(suspect !== null && suspect !== undefined ? suspect.match(victim) : undefined)) {
          continue;
        }
        this.data.keys.splice(index, 1);
        delete this.data.items[suspect];
      }
    }
    this.save();
    return this;
  }

  _removeByFunction(victim) {
    var i, index, j, len, len1, ref, ref1, suspect;
    if (!this.noLS) {
      Object.keys(localStorage).forEach(function(suspect) {
        if (victim(suspect)) {
          return localStorage.removeItem(suspect);
        }
      });
    }
    ref = this.data.keys;
    for (index = i = 0, len = ref.length; i < len; index = ++i) {
      suspect = ref[index];
      if (!((suspect !== null) && (suspect !== undefined) && victim.call(this, suspect))) {
        continue;
      }
      this.data.keys.splice(index, 1);
      delete this.data.items[suspect];
    }
    if (this.noLS) {
      ref1 = Object.keys(this.data.items);
      for (index = j = 0, len1 = ref1.length; j < len1; index = ++j) {
        suspect = ref1[index];
        if (!((suspect !== null) && (suspect !== undefined) && victim.call(this, suspect))) {
          continue;
        }
        this.data.keys.splice(index, 1);
        delete this.data.items[suspect];
      }
    }
    this.save();
    return this;
  }

  setQueueLimit(limit) {
    this.queueLimit = limit;
  }

  empty() {
    this.data = {
      keys: [],
      items: {}
    };
    this.save();
    return this;
  }
}
