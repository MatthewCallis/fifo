import test from 'ava';
import Fifo from '../src/fifo.js';
import LocalStorage from '../src/localStorage.js';

// With localStorage
test('#remove: just returns itself on an empty remove', (t) => {
  const LS = new LocalStorage();
  const collection = new Fifo({ namespace: 'fifo:test', shim: LS });
  collection.noLS = false;

  t.notThrows(collection.remove);
});

test('#remove: remove items from storage', (t) => {
  const LS = new LocalStorage();
  const collection = new Fifo({ namespace: 'fifo:test', shim: LS });
  collection.noLS = false;

  collection.remove('foo');
  t.is(collection.get('foo'), undefined);
});

test('#remove: remove items from storage (No localStorage)', (t) => {
  const collection = new Fifo({ namespace: 'fifo:test' });
  collection.noLS = true;

  collection.remove('foo');
  t.is(collection.get('foo'), undefined);
});

test('#remove: can remove items using a string', (t) => {
  const LS = new LocalStorage();
  const collection = new Fifo({ namespace: 'fifo:test', shim: LS });
  collection.noLS = false;

  collection.set('fifo-key', 'fifo-regex-value');
  collection.set('fifo-regex-key', 'fifo-value');
  collection.set('fixed-key', 'fixed-value');
  collection.set('fixed-regex-key', 'fixed-regex-value');

  collection.remove('fixed-regex-key');
  collection.remove('fifo-regex-key');

  t.true(collection.has('fixed-key'));
  t.false(collection.has('fixed-regex-key'));
  t.true(collection.has('fifo-key'));
  t.false(collection.has('fifo-regex-key'));
});

test('#remove: just returns itself on an empty remove (No localStorage)', (t) => {
  const collection = new Fifo({ namespace: 'fifo:test' });
  collection.noLS = true;

  t.notThrows(collection.remove);
});

test('#remove: can remove items', (t) => {
  const collection = new Fifo({ namespace: 'fifo:test' });
  collection.noLS = true;

  collection.set('fifo-key', 'fifo-regex-value');
  collection.set('fifo-regex-key', 'fifo-value');
  collection.set('fixed-key', 'fixed-value');
  collection.set('fixed-regex-key', 'fixed-regex-value');

  collection.remove('fixed-regex-key');
  collection.remove('fifo-regex-key');

  t.true(collection.has('fixed-key'));
  t.false(collection.has('fixed-regex-key'));
  t.true(collection.has('fifo-key'));
  t.false(collection.has('fifo-regex-key'));
});
