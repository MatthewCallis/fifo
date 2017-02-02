/** @test {Fifo} */
import test from 'ava';
import Fifo from '../src/fifo';

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
  const newFunction = data => data;
  const collection = new Fifo({ console: newFunction });
  t.is(collection.console, newFunction);
});

test('#constructor: inits the data object', (t) => {
  const collection = new Fifo();
  t.is(typeof collection.data, 'object');
  t.true(Array.isArray(collection.data.keys));
  t.is(typeof collection.data.items, 'object');
});
