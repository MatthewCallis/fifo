import test from 'ava';
import Fifo from '../src/fifo.js';
import LocalStorage from '../src/localStorage.js';

// NOTE: Browser test only.
test.skip('#constructor: will set noLS to true if there is localStorage', (t) => {
  const collection = new Fifo({ namespace: 'fifo:test' });
  t.false(collection.noLS);
});

test("#constructor: sets the default namespect to 'fifo'", (t) => {
  const collection = new Fifo();
  t.is(collection.namespace, 'fifo');
});

test('#constructor: accepts an option to set the namespace', (t) => {
  const collection = new Fifo({ namespace: 'pizza' });
  t.is(collection.namespace, 'pizza');
});

test('#constructor: sets the default console function to be NOOP', (t) => {
  const collection = new Fifo();
  t.is(typeof collection.console, 'function');
});

test('#constructor: accepts an option to set the console function', (t) => {
  const newFunction = (data) => data;
  const collection = new Fifo({ console: newFunction });
  t.is(collection.console, newFunction);
});

test('#constructor: inits the data object', (t) => {
  const collection = new Fifo();
  t.is(typeof collection.data, 'object');
  t.true(Array.isArray(collection.data.keys));
  t.is(typeof collection.data.items, 'object');
});

test('#constructor: can load data from locaStorage values', (t) => {
  const LS = new LocalStorage();
  LS.setItem('fifo:test', JSON.stringify({ keys: ['test'], items: { test: 'VALID' } }));
  const collection = new Fifo({ namespace: 'fifo:test', shim: LS });
  t.is(typeof collection.data, 'object');
  t.deepEqual(collection.data.keys, ['test']);
  t.deepEqual(collection.data.items, { test: 'VALID' });
});
