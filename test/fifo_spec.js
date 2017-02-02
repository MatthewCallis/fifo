/** @test {Fifo} */
import test from 'ava';
import Fifo from '../src/fifo';

let collection = null;
let n10b = null;
let n100b = null;
let n1k = null;
let n10k = null;
let n100k = null;
let n1m = null;

test.beforeEach(() => {
  // NOTE: Used in the brwoser only.
  // try {
  //   localStorage.clear();
  // } catch (error) {
  //   // eslint-disable-next-line no-console
  //   console.error(error);
  // }

  const repeat = (value, count) => {
    const output = [];
    while (count--) {
      output.push(value);
    }
    return output.join('');
  };

  n10b = '1234567890';
  n100b = repeat(n10b, 10);
  n1k = repeat(n100b, 10);
  n10k = repeat(n1k, 10);
  n100k = repeat(n10k, 10);
  n1m = repeat(n100k, 10);

  collection = new Fifo({ namespace: 'fifo:test' });
});

test('gets all values', (t) => {
  collection.set('fixed-key', 'fixed-value');
  collection.set('fifo-key', 'fifo-value');
  t.is(Object.keys(collection.get()).length, 2);
  t.is(collection.get()['fifo-key'], 'fifo-value');
  t.is(collection.get()['fixed-key'], 'fixed-value');
});

test('ensure it removes old items to add others, sending them to onLimit', (t) => {
  let limitReached = false;
  let removedItem = null;
  let i = 0;

  const onLimit = (items) => {
    limitReached = true;
    removedItem = items[0];
  };

  while (!(limitReached || i === 10000)) {
    i += 1;
    collection.set(`test:${i}`, n100k, onLimit);
  }

  if (collection.noLS) {
    t.is(removedItem, null);
  } else {
    t.is(removedItem.key, 'test:1');
  }
});

test('fixed keys can be added once FIFO queue full then add additional items to FIFO queue and check that we kept the fixed item', (t) => {
  if (collection.noLS) {
    return;
  }

  let i = 0;
  let limitReached = false;
  let removedItem = null;
  let removedItemForFixedKey = null;
  let removedItemForFifo = null;
  let key = null;

  const moreFifoOnLimit = (items) => {
    removedItemForFifo = items[0];
  };

  const fixedKeyOnLimit = (items) => {
    removedItemForFixedKey = items[0];
    collection.set(key, n1m, moreFifoOnLimit);
  };

  const fifoQueueOnLimit = (items) => {
    limitReached = true;
    removedItem = items[0];
    collection.set('fixed-key', n1m, fixedKeyOnLimit);
  };

  while (!(limitReached || i === 100)) {
    i += 1;
    key = `test:${i}`;
    collection.set(key, n100k, fifoQueueOnLimit);
  }

  t.is(collection.get('fixed-key').length, n1m.length);
  removedItem.key.should.equal('test:1');

  // These tests crash IE8, IE9, IE10
  if (navigator.appVersion.indexOf('MSIE 8') === -1 || navigator.appVersion.indexOf('MSIE 9') === -1 || navigator.appVersion.indexOf('MSIE 10') === -1) {
    return;
  }

  removedItemForFixedKey.key.should.equal('test:2');
  removedItemForFifo.key.should.equal('test:12');
});
