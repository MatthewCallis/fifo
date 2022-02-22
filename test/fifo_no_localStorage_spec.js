import test from 'ava';
import Fifo from '../src/fifo.js';

let collection = null;

test.beforeEach(() => {
  // NOTE: Used in the brwoser only.
  // try {
  //   localStorage.clear();
  // } catch (error) {
  //   // eslint-disable-next-line no-console
  //   console.error(error);
  // }

  collection = new Fifo({ namespace: 'fifo:test' });
  collection.noLS = true;
});

// NOTE: This is incredibly difficult to test in a real browser.
test.skip('will set noLS to true if there is no localStorage', (t) => {
  const cached_local_storage = window.localStorage;
  window.localStorage = undefined;
  try {
    const fifo_test = new Fifo('fifo:test');
    t.true(fifo_test.noLS);
  } finally {
    window.localStorage = cached_local_storage;
  }
});

test('set and get items with a key in storage with no localStorage', (t) => {
  collection.set('foo', { foo: 'bar' });
  const retrieved = collection.get('foo');
  t.is(retrieved.foo, 'bar');
});

test('set and get items without a key in storage with no localStorage', (t) => {
  const dummy = { foo: 'bar' };
  collection.set('foo', dummy);
  const retrieved = collection.get();
  t.is(retrieved.foo, dummy);
});

// #set
test('add and remove fixed value', (t) => {
  const value = 'value';
  const key = 'fixed';
  collection.set(key, value);
  let fixed = collection.get(key);
  t.is(fixed, value);

  collection.remove(key);
  fixed = collection.get(key);
  t.is(fixed, undefined);
});

test('will overwrite a key with a new value', (t) => {
  let value = 'value';
  const key = 'fixed';
  collection.set(key, value);
  let fixed = collection.get(key);
  t.is(fixed, value);

  value = 'no_small_talk';
  collection.set(key, value);
  fixed = collection.get(key);
  t.is(fixed, value);
});

// #keys
test('get keys with no localStorage', (t) => {
  collection.set('fixed-key', 'fixed-value');
  collection.set('fifo-key', 'fifo-value');
  t.is(collection.keys().length, 2);
  t.is(collection.keys()[0], 'fifo-key');
  t.is(collection.keys()[1], 'fixed-key');
});

// #has
test('has key with no localStorage', (t) => {
  collection.set('fixed-key', 'fixed-value');
  collection.set('fifo-key', 'fifo-value');

  t.true(collection.has('fixed-key'));
  t.true(collection.has('fifo-key'));
  t.false(collection.has('lose-key'));
});
