/** @test {Fifo} */
import test from 'ava';
import Fifo from '../src/fifo';
import LocalStorage from '../src/localStorage';

let collection = null;

test.beforeEach(() => {
  // NOTE: Used in the brwoser only.
  // try {
  //   localStorage.clear();
  // } catch (error) {
  //   // eslint-disable-next-line no-console
  //   console.error(error);
  // }

  const LS = new LocalStorage();
  collection = new Fifo({ namespace: 'fifo:test', shim: LS });
  collection.noLS = false;
});

test('#get: with no key returns everything', (t) => {
  collection.set('fixed-key', 'fixed-value');
  collection.set('fifo-key', 'fifo-value');

  t.deepEqual(collection.get(), { 'fixed-key': 'fixed-value', 'fifo-key': 'fifo-value' });
});

test('#get: with a key returns a specific entry', (t) => {
  collection.set('fixed-key', 'fixed-value');
  collection.set('fifo-key', 'fifo-value');

  t.is(collection.get('fixed-key'), 'fixed-value');
  t.is(collection.get('fifo-key'), 'fifo-value');
});

test('#set: add and remove values', (t) => {
  const value = 'value';
  const key = 'fixed';

  collection.set(key, value);
  t.is(collection.get(key), value);

  collection.remove(key);
  t.is(collection.get(key), undefined);
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

test('#keys: gets keys', (t) => {
  collection.set('fixed-key', 'fixed-value');
  collection.set('fifo-key', 'fifo-value');
  t.is(collection.keys().length, 2);
  t.is(collection.keys()[0], 'fifo-key');
  t.is(collection.keys()[1], 'fixed-key');
});

test('#keys: test old key is cleaned up when saved', (t) => {
  collection.set('A', '1');
  collection.set('B', '2');
  collection.set('C', '3');
  t.is(collection.keys().length, 3);
  collection.set('A', '4');
  t.is(collection.keys().length, 3);
});

test('#keys: should always return an array, even in an error state', (t) => {
  collection.set('A', '1');
  collection.set('B', '2');
  collection.set('C', '3');
  t.is(collection.keys().length, 3);

  delete collection.data.keys;
  t.deepEqual(collection.keys(), []);
});

test('#has: has key', (t) => {
  collection.set('fixed-key', 'fixed-value');
  collection.set('fifo-key', 'fifo-value');
  t.true(collection.has('fixed-key'));
  t.true(collection.has('fifo-key'));
  t.false(collection.has('lose-key'));
});

test('#empty: empty the collection', (t) => {
  collection.set('empty1', true);
  collection.set('empty2', true);

  t.true(collection.get('empty1'));
  t.true(collection.get('empty2'));

  collection.empty();
  t.is(collection.get('empty1'), undefined);
  t.is(collection.get('empty2'), undefined);
});
