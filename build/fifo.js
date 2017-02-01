(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("fifo", [], factory);
	else if(typeof exports === 'object')
		exports["fifo"] = factory();
	else
		root["fifo"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var Fifo = function () {
	  function Fifo() {
	    var namespace = arguments.length <= 0 || arguments[0] === undefined ? 'fifo' : arguments[0];
	
	    _classCallCheck(this, Fifo);
	
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
	
	  _createClass(Fifo, [{
	    key: 'trySave',
	    value: function trySave(key, value) {
	      var error;
	      if (this.noLS) {
	        return false;
	      }
	      try {
	        if (!key) {
	          if (this.queueLimit && this.data.keys.length > this.queueLimit) {
	            return false;
	          }
	          localStorage.setItem(this.namespace, JSON.stringify(this.data));
	        } else {
	          localStorage.setItem(key, value);
	        }
	        return true;
	      } catch (e) {
	        var _error = e;
	        if (_error.code === 18 || _error.code === 21 || _error.code === 22 || _error.code === 1014 || _error.number === -2147024882) {
	          return false;
	        }
	        throw _error;
	      }
	    }
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
	  }, {
	    key: 'save',
	    value: function save(key, value) {
	      var removed = [];
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
	          throw new Error('All items removed from ' + this.namespace + ', still can\'t save.');
	        }
	      }
	      return removed;
	    }
	  }, {
	    key: 'set',
	    value: function set(key, value, onRemoved) {
	      this.data.items[key] = value;
	      var index = this.data.keys.indexOf(key);
	      if (index > -1) {
	        this.data.keys.splice(index, 1);
	      }
	      this.data.keys.unshift(key);
	
	      var removed = this.save();
	      if (onRemoved && removed.length) {
	        onRemoved.call(this, removed);
	      }
	      return this;
	    }
	  }, {
	    key: 'get',
	    value: function get(key) {
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
	          var items = this.data.items;
	          var keys = Object.keys(localStorage);
	          for (var i = 0, len = keys.length; i < len; i++) {
	            key = keys[i];
	            if (key !== this.namespace) {
	              items[key] = localStorage.getItem(key);
	            }
	          }
	          return items;
	        }
	      }
	    }
	  }, {
	    key: 'setFixed',
	    value: function setFixed(key, value, onRemoved) {
	      if (this.noLS) {
	        this.data.items[key] = value;
	        var index = this.data.keys.indexOf(key);
	        if (index > -1) {
	          this.data.keys.splice(index, 1);
	        }
	        this.data.keys.unshift(key);
	      }
	      var removed = this.save(key, value);
	      if (onRemoved && removed.length) {
	        onRemoved.call(this, removed);
	      }
	      return this;
	    }
	  }, {
	    key: 'keys',
	    value: function keys() {
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
	  }, {
	    key: 'has',
	    value: function has(key) {
	      if (this.noLS) {
	        if (this.queueLimit) {
	          var keys = this.data.keys.slice(0);
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
	  }, {
	    key: 'remove',
	    value: function remove(victim) {
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
	  }, {
	    key: '_removeByString',
	    value: function _removeByString(victim) {
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
	  }, {
	    key: '_removeByRegExp',
	    value: function _removeByRegExp(victim) {
	      var i, index, j, len, len1, ref, ref1, suspect;
	      if (!this.noLS) {
	        Object.keys(localStorage).forEach(function (suspect) {
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
	  }, {
	    key: '_removeByFunction',
	    value: function _removeByFunction(victim) {
	      var i, index, j, len, len1, ref, ref1, suspect;
	      if (!this.noLS) {
	        Object.keys(localStorage).forEach(function (suspect) {
	          if (victim(suspect)) {
	            return localStorage.removeItem(suspect);
	          }
	        });
	      }
	      ref = this.data.keys;
	      for (index = i = 0, len = ref.length; i < len; index = ++i) {
	        suspect = ref[index];
	        if (!(suspect !== null && suspect !== undefined && victim.call(this, suspect))) {
	          continue;
	        }
	        this.data.keys.splice(index, 1);
	        delete this.data.items[suspect];
	      }
	      if (this.noLS) {
	        ref1 = Object.keys(this.data.items);
	        for (index = j = 0, len1 = ref1.length; j < len1; index = ++j) {
	          suspect = ref1[index];
	          if (!(suspect !== null && suspect !== undefined && victim.call(this, suspect))) {
	            continue;
	          }
	          this.data.keys.splice(index, 1);
	          delete this.data.items[suspect];
	        }
	      }
	      this.save();
	      return this;
	    }
	  }, {
	    key: 'setQueueLimit',
	    value: function setQueueLimit(limit) {
	      this.queueLimit = limit;
	    }
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
	
	exports.default = Fifo;
	module.exports = exports['default'];

/***/ }
/******/ ])
});
;
//# sourceMappingURL=fifo.js.map