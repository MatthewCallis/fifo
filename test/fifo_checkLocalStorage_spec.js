import test from 'ava';
import Fifo from '../src/fifo.js';
import LocalStorage from '../src/localStorage.js';

test('#checkLocalStorage: accepts a shim for localStorage', (t) => {
  const LS = new LocalStorage();
  const collection = new Fifo({ shim: LS });
  t.false(collection.noLS);
  t.is(collection.LS, LS);
});

test('#checkLocalStorage: falls back to a shim when there is no localStorage', (t) => {
  const collection = new Fifo();
  t.true(collection.noLS);
  t.not(collection.LS, undefined);
});
