/** @test {Fifo} */
import test from 'ava';
import { iterate } from 'leakage';
import Fifo from '../src/fifo';
import LocalStorage from '../src/localStorage';

test('#trySave: will return false when trying to invoke trySave with no localStorage', (t) => {
  const collection = new Fifo({ namespace: 'fifo:test' });
  t.false(collection.trySave());
});

test('#save: will return an empty array when trying to invoke save with no localStorage', (t) => {
  const collection = new Fifo({ namespace: 'fifo:test' });
  t.deepEqual(collection.save(), []);
});

test('#save: saves the key/value pairs to localStorage', (t) => {
  const LS = new LocalStorage();
  const collection = new Fifo({ shim: LS });
  collection.noLS = false;

  collection.set('1', 'A');
  collection.set('2', 'B');
  collection.set('3', 'C');
  collection.set('4', 'D');
  collection.save();

  t.false(collection.noLS);
  t.deepEqual(collection.LS.getItem('fifo'), '{"keys":["4","3","2","1"],"items":{"1":"A","2":"B","3":"C","4":"D"}}');
});

test.skip('#save does not leak', (t) => {
  t.notThrows(() => {
    iterate(() => {
      const LS = new LocalStorage();
      const collection = new Fifo({ shim: LS });
      collection.noLS = false;

      collection.set('1', 'A');
      collection.set('2', 'B');
      collection.set('3', 'C');
      collection.set('4', 'D');
      collection.save();
    });
  });
});
