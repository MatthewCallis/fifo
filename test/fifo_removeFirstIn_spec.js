import test from 'ava';
import Fifo from '../src/fifo.js';

test('#removeFirstIn: remove the first item and return it', (t) => {
  const collection = new Fifo();
  collection.set('1', 'A');
  collection.set('2', 'B');
  collection.set('3', 'C');
  collection.set('4', 'D');

  t.is(collection.keys().length, 4);

  const removed = collection.removeFirstIn();
  t.is(collection.keys().length, 3);
  t.deepEqual(removed, { key: '1', value: 'A' });
});
