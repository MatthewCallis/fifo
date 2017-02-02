export default class LocalStorage {
  getItem(key) {
    if (Object.prototype.hasOwnProperty.call(this, key)) {
      return String(this[key]);
    }
    return null;
  }

  setItem(key, val) {
    this[key] = String(val);
  }

  removeItem(key) {
    delete this[key];
  }

  clear() {
    const self = this;
    Object.keys(this).forEach((key) => {
      self[key] = undefined;
      delete self[key];
    });
  }

  key(i = 0) {
    return Object.keys(this)[i];
  }

  get length() {
    return Object.keys(this).length;
  }
}
