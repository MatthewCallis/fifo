import test from 'ava';
import LocalStorage from '../src/localStorage';

test('LocalStorage', (t) => {
  const localStorage = new LocalStorage();

  // Do not return prototypical keys.
  t.is(localStorage.getItem('key'), null);

  // Everything is stored in an object, wa cannot make assuptions about key positioning.
  localStorage.setItem('a', 1);
  t.is(localStorage.key(), 'a');
  t.is(localStorage.key(0), 'a');

  localStorage.setItem('b', '2');
  t.is(localStorage.getItem('a'), '1');
  t.is(localStorage.getItem('b'), '2');
  t.is(localStorage.length, 2);

  t.is(localStorage.c, undefined);
  t.is(localStorage.getItem('c'), null);

  localStorage.setItem('c');
  t.is(localStorage.getItem('c'), 'undefined');
  t.is(localStorage.length, 3);

  localStorage.removeItem('c');
  t.is(localStorage.getItem('c'), null);
  t.is(localStorage.length, 2);

  localStorage.clear();
  t.is(localStorage.getItem('a'), null);
  t.is(localStorage.getItem('b'), null);
  t.is(localStorage.length, 0);
});
