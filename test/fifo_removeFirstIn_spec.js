/** @test {Fifo} */
import test from 'ava';
import { iterate } from 'leakage';
import Fifo from '../src/fifo';

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

test.skip('#removeFirstIn: does not leak', (t) => {
  t.notThrows(() => {
    iterate(() => {
      const collection = new Fifo();
      collection.set('1', 'A');
      collection.set('2', 'B');
      collection.set('3', 'C');
      collection.set('4', 'D');

      t.is(collection.keys().length, 4);

      collection.removeFirstIn();
    });
  });
});
