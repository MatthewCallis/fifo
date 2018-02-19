# [Fifo](https://github.com/MatthewCallis/fifo)

[![Build Status](https://travis-ci.org/MatthewCallis/fifo.svg)](https://travis-ci.org/MatthewCallis/fifo)
[![Test Coverage](https://codeclimate.com/github/MatthewCallis/fifo/badges/coverage.svg)](https://codeclimate.com/github/MatthewCallis/fifo/coverage)
[![Coverage Status](https://coveralls.io/repos/github/MatthewCallis/fifo/badge.svg?branch=master)](https://coveralls.io/github/MatthewCallis/fifo?branch=master)
[![devDependency Status](https://david-dm.org/MatthewCallis/fifo/dev-status.svg?style=flat)](https://david-dm.org/MatthewCallis/fifo#info=devDependencies)
[![npm version](https://img.shields.io/npm/v/localstorage-fifo.svg?style=flat-square)](https://www.npmjs.com/package/localstorage-fifo)
[![npm downloads](https://img.shields.io/npm/dm/localstorage-fifo.svg?style=flat-square)](https://www.npmjs.com/package/localstorage-fifo)

**First In First Out accounting for JavaScript `localStorage`.**

`npm install --save localstorage-fifo`

## About

`localStorage` doesn't have an unlimited amount of space, and just throws an error when you try to save to it when its full. `fifo` gracefully handles saving data to localStorage: when you run out of room it simply removes the earliest item(s) saved.

Additionally, `fifo` also stores all of your `key:value` pairs on one key in `localStorage` for [better performance](http://jsperf.com/localstorage-string-size-retrieval).

## API

```javascript
// create a collection stored on `tasks` key in localStorage
const collection = new Fifo({ namespace: 'tasks' });

// set an item
collection.set('task-1', 'close two tickets');

// retrieve an item - preference for fixed items, then FIFO queue
var storedTask = collection.get('task-1'); //> 'close two tickets'

// retrieve all items by sending no arguments to get
var tasks = collection.get();

// remove an item - preference for fixed items, then FIFO queue
collection.remove('task-1');
```

```javascript
// empty an entire FIFO queue
collection.empty();

// set any JavaScript object, don't have to JSON.parse or JSON.stringify() yourself when setting and getting.
collection.set('task:2', { due: 'sunday', task: 'go to church' });
collection.set('whatevz', [1,2,3]);

// get a list of all keys, both those in fifo and fixed localStorage
collection.keys(); /* Returns an array of key names */

// Check to see if a key exists in the FIFO queue or fixed localStorage
collection.has('key'); /* true or false */
```

Please see the source for more details.

## Browser Support

`fifo` assumes the browser has `localStorage` and `JSON`. _There is a `localStorage` shim but it will not persist_.

### Testing

```shell
npm run lint
npm run make
npm run test
npm run report
```

## License

MIT-Style license

Originally forked from [rpflorence](https://github.com/rpflorence/fifo) to fix some issues.
