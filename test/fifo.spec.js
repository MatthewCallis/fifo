/* eslint no-unused-expressions: 0 */
import chai from 'chai';
import Fifo from '../build/fifo.js';
import localStorage from 'localStorage'

chai.expect();
chai.should();

const expect = chai.expect;

var collection, n100b, n100k, n10b, n10k, n1k, n1m;

describe('Fifo', function () {
  this.timeout(25000);

  beforeEach(() => {
    var e, error;
    try {
      localStorage.clear();
    } catch (error) {
      e = error;
    }

    const repeat = (value, count) => {
      var output;
      output = [];
      while (count) {
        output.push(value);
        count -= 1;
      }
      return output.join('');
    };
    n10b = '1234567890';
    n100b = repeat(n10b, 10);
    n1k = repeat(n100b, 10);
    n10k = repeat(n1k, 10);
    n100k = repeat(n10k, 10);
    n1m = repeat(n100k, 10);

    collection = new Fifo('fifo:test');
  });

  it("sets the default namespect to 'fifo'", () => {
    collection = new Fifo();
    collection.namespace.should.equal('fifo');
  });

  it('can set and get items in storage', () => {
    var retrieved;
    collection.set('foo', {
      foo: 'bar'
    });
    retrieved = collection.get('foo');
    retrieved.foo.should.equal('bar');
  });

  xit('will set noLS to false if there is localStorage', () => {
    expect(collection.noLS).to.be["false"];
  });

  it('remove items from storage', () => {
    collection.set('foo', {
      foo: 'bar'
    });
    collection.remove('foo');
    expect(collection.get('foo')).to.be.undefined;
  });

  it('ensure it removes old items to add others, sending them to onLimit', () => {
    var i, key, onLimit;
    let limitReached = false;
    let removedItem = null;
    i = 0;
    onLimit = (items) => {
      limitReached = true;
      removedItem = items[0];
      return removedItem;
    };
    while (!(limitReached || i === 10000)) {
      i += 1;
      key = "test:" + i;
      collection.set(key, n100k, onLimit);
    }
    if (collection.noLS) {
      expect(removedItem).to.be["null"];
    } else {
      expect(removedItem.key).to.equal("test:1");
    }
  });

  it('empty the collection', () => {
    collection.set('empty1', true);
    collection.set('empty2', true);
    collection.get('empty1').should.be["true"];
    collection.get('empty2').should.be["true"];
    collection.empty();
    expect(collection.get('empty1')).to.be.undefined;
    expect(collection.get('empty2')).to.be.undefined;
  });

  it('add fixed value', () => {
    var fixed, fixedKey, fixedValue;
    fixedValue = 'value';
    fixedKey = 'fixed';
    collection.setFixed(fixedKey, fixedValue);
    fixed = collection.get(fixedKey);
    expect(fixed).to.equal(fixedValue);
    collection.remove(fixedKey);
    fixed = collection.get(fixedKey);
    expect(fixed).to.be.undefined;
  });

  it('fixed keys can be added once FIFO queue full then add additional items to FIFO queue and check that we kept the fixed item', () => {
    if (collection.noLS) {
      return;
    }
    let i = 0;
    let limitReached = false;
    let removedItem = null;
    let removedItemForFixedKey = null;
    let removedItemForFifo = null;
    let moreFifoOnLimit = function(items) {
      removedItemForFifo = items[0];
    };
    let fixedKeyOnLimit = function(items) {
      removedItemForFixedKey = items[0];
      collection.set(key, n1m, moreFifoOnLimit);
    };
    let fifoQueueOnLimit = function(items) {
      limitReached = true;
      removedItem = items[0];
      collection.setFixed('fixed-key', n1m, fixedKeyOnLimit);
    };
    while (!(limitReached || i === 100)) {
      i += 1;
      let key = "test:" + i;
      collection.set(key, n100k, fifoQueueOnLimit);
    }
    expect(collection.get('fixed-key').length).to.equal(n1m.length);
    removedItem.key.should.equal('test:1');
    if (navigator.appVersion.indexOf("MSIE 8") === -1) {
      return;
    }
    if (navigator.appVersion.indexOf("MSIE 9") === -1) {
      return;
    }
    if (navigator.appVersion.indexOf("MSIE 10") === -1) {
      return;
    }
    removedItemForFixedKey.key.should.equal('test:2');
    removedItemForFifo.key.should.equal('test:12');
  });

  it('gets all values', () => {
    collection.setFixed('fixed-key', 'fixed-value');
    collection.set('fifo-key', 'fifo-value');
    expect(Object.keys(collection.get()).length).to.equal(2);
    collection.get()['fifo-key'].should.equal('fifo-value');
    collection.get()['fixed-key'].should.equal('fixed-value');
  });

  it('get keys', () => {
    collection.setFixed('fixed-key', 'fixed-value');
    collection.set('fifo-key', 'fifo-value');
    expect(collection.keys().length).to.equal(2);
    expect(collection.keys()[0]).to.equal('fifo-key');
    expect(collection.keys()[1]).to.equal('fixed-key');
  });

  it('has key', () => {
    collection.setFixed('fixed-key', 'fixed-value');
    collection.set('fifo-key', 'fifo-value');
    collection.has('fixed-key').should.be["true"];
    collection.has('fifo-key').should.be["true"];
    collection.has('lose-key').should.be["false"];
  });

  it("'keys' isn't replicated due to pass by reference", () => {
    collection.setFixed('fixed-key', 'fixed-value');
    collection.set('fifo-key', 'fifo-value');
    collection.keys();
    expect(collection.keys().length).to.equal(2);
  });

  it('test old key is cleaned up when saved', () => {
    collection.set('A', '1');
    collection.set('B', '2');
    collection.set('C', '3');
    expect(collection.keys().length).to.equal(3);
    collection.set('A', '4');
    expect(collection.keys().length).to.equal(3);
  });

  it('can remove items using a string', () => {
    collection.setFixed('fixed-key', 'fixed-value');
    collection.setFixed('fixed-regex-key', 'fixed-regex-value');
    collection.set('fifo-regex-key', 'fifo-value');
    collection.set('fifo-key', 'fifo-regex-value');
    collection.remove('fixed-regex-key');
    collection.remove('fifo-regex-key');
    collection.has('fixed-key').should.be["true"];
    collection.has('fixed-regex-key').should.be["false"];
    collection.has('fifo-key').should.be["true"];
    collection.has('fifo-regex-key').should.be["false"];
  });

  it('can remove items using a regex', () => {
    collection.setFixed('fixed-key', 'fixed-value');
    collection.setFixed('fixed-regex-key', 'fixed-regex-value');
    collection.set('fifo-regex-key', 'fifo-value');
    collection.set('fifo-key', 'fifo-regex-value');
    collection.remove(/regex/ig);
    collection.has('fixed-key').should.be["true"];
    collection.has('fixed-regex-key').should.be["false"];
    collection.has('fifo-key').should.be["true"];
    collection.has('fifo-regex-key').should.be["false"];
  });

  it('can remove items using a function', () => {
    collection.setQueueLimit(null);
    collection.setFixed('fixed-key', 'fixed-value');
    collection.setFixed('fixed-regex-key', 'fixed-regex-value');
    collection.set('fifo-regex-key', 'fifo-value');
    collection.set('fifo-key', 'fifo-regex-value');
    collection.remove(function(value) {
      return value.indexOf('regex') !== -1;
    });
    collection.has('fixed-key').should.be["true"];
    collection.has('fixed-regex-key').should.be["false"];
    collection.has('fifo-key').should.be["true"];
    collection.has('fifo-regex-key').should.be["false"];
  });

  it('can limit the fifo queue size', () => {
    collection.setQueueLimit(3);
    collection.set('key1', 'value1');
    collection.set('key2', 'value2');
    collection.set('key3', 'value3');
    collection.set('key4', 'value4');
    collection.set('key5', 'value5');
    collection.set('key6', 'value6');
    expect(collection.keys().length).to.equal(3);
    collection.has('key6').should.be["true"];
    collection.has('key5').should.be["true"];
    collection.has('key4').should.be["true"];
    collection.has('key3').should.be["false"];
  });

  describe('No localStorage', function() {
    beforeEach(() => {
      collection.noLS = true;
    });
    if (typeof require !== "undefined" && require !== null) {
      it('will set noLS to false if there is no localStorage', () => {
        var cached_local_storage, test;
        cached_local_storage = global.localStorage;
        global.localStorage = undefined;
        try {
          test = new Fifo('fifo:test');
          expect(test.noLS).to.be["true"];
        } finally {
          global.localStorage = cached_local_storage;
        }
      });
    }

    it('will return false when trying to invoke trySave with no localStorage', () => {
      expect(collection.trySave()).to.be["false"];
    });

    it('will return removed items when trying to invoke save with no localStorage', () => {
      expect(collection.save()).to.eql([]);
    });

    it('set and get items with a key in storage with no localStorage', () => {
      var retrieved;
      collection.set('foo', { foo: 'bar' });
      retrieved = collection.get('foo');
      retrieved.foo.should.equal('bar');
    });

    it('set and get items without a key in storage with no localStorage', () => {
      var retrieved, test;
      test = {
        foo: 'bar'
      };
      collection.set('foo', test);
      retrieved = collection.get();
      retrieved.foo.should.equal(test);
    });

    it('add fixed value with no localStorage', () => {
      var fixed, fixedKey, fixedValue;
      fixedValue = 'value';
      fixedKey = 'fixed';
      collection.setFixed(fixedKey, fixedValue);
      fixed = collection.get(fixedKey);
      expect(fixed).to.equal(fixedValue);
      collection.remove(fixedKey);
      fixed = collection.get(fixedKey);
      expect(fixed).to.be.undefined;
    });

    it('get keys with no localStorage', () => {
      collection.setFixed('fixed-key', 'fixed-value');
      collection.set('fifo-key', 'fifo-value');
      expect(collection.keys().length).to.equal(2);
      expect(collection.keys()[0]).to.equal('fifo-key');
      expect(collection.keys()[1]).to.equal('fixed-key');
    });

    it('get keys with no localStorage and queue limit set', () => {
      collection.setQueueLimit(4);
      collection.set('fifo-key-1', 'fifo-value-1');
      collection.setFixed('fifo-key-2', 'fifo-value-2');
      collection.set('fifo-key-3', 'fifo-value-3');
      collection.setFixed('fifo-key-4', 'fifo-value-4');
      collection.set('fifo-key-5', 'fifo-value-5');
      collection.setFixed('fifo-key-6', 'fifo-value-6');
      collection.set('fifo-key-7', 'fifo-value-7');
      collection.setFixed('fifo-key-8', 'fifo-value-8');
      expect(collection.keys().length).to.equal(4);
      expect(collection.keys()[0]).to.equal('fifo-key-8');
      expect(collection.keys()[1]).to.equal('fifo-key-7');
      expect(collection.keys()[2]).to.equal('fifo-key-6');
      expect(collection.keys()[3]).to.equal('fifo-key-5');
    });

    it('has key with no localStorage', () => {
      collection.setFixed('fixed-key', 'fixed-value');
      collection.set('fifo-key', 'fifo-value');
      collection.has('fixed-key').should.be["true"];
      collection.has('fifo-key').should.be["true"];
      collection.has('lose-key').should.be["false"];
    });

    it('has key with no localStorage and queue limit set', () => {
      collection.setQueueLimit(4);
      collection.set('fifo-key-1', 'fifo-value-1');
      collection.setFixed('fifo-key-2', 'fifo-value-2');
      collection.set('fifo-key-3', 'fifo-value-3');
      collection.setFixed('fifo-key-4', 'fifo-value-4');
      collection.set('fifo-key-5', 'fifo-value-5');
      collection.setFixed('fifo-key-6', 'fifo-value-6');
      collection.set('fifo-key-7', 'fifo-value-7');
      collection.setFixed('fifo-key-8', 'fifo-value-8');
      collection.has('fifo-key-8').should.be["true"];
      collection.has('fifo-key-7').should.be["true"];
      collection.has('fifo-key-4').should.be["false"];
    });

    it('can remove items using a regex with no localStorage', () => {
      collection.setFixed('fixed-key', 'fixed-value');
      collection.setFixed('fixed-regex-key', 'fixed-regex-value');
      collection.set('fifo-regex-key', 'fifo-value');
      collection.set('fifo-key', 'fifo-regex-value');
      collection.remove(/regex/ig);
      collection.has('fixed-key').should.be["true"];
      collection.has('fixed-regex-key').should.be["false"];
      collection.has('fifo-key').should.be["true"];
      collection.has('fifo-regex-key').should.be["false"];
    });

    it('can remove items using a function', () => {
      collection.setQueueLimit(null);
      collection.setFixed('fixed-key', 'fixed-value');
      collection.setFixed('fixed-regex-key', 'fixed-regex-value');
      collection.set('fifo-regex-key', 'fifo-value');
      collection.set('fifo-key', 'fifo-regex-value');
      collection.remove(function(value) {
        return value.indexOf('regex') !== -1;
      });
      collection.has('fixed-key').should.be["true"];
      collection.has('fixed-regex-key').should.be["false"];
      collection.has('fifo-key').should.be["true"];
      collection.has('fifo-regex-key').should.be["false"];
    });
  });
});
