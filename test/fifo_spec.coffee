# Are we in iojs?
if require?
  chai = require('chai')
  global.should = chai.should()
  global.expect = chai.expect

  global.localStorage = require('localStorage')

  chai.should()

  global.Fifo = require('../build/fifo').Fifo

describe 'Fifo', ->
  @timeout(25000)

  # Test Specific
  collection = null
  n10b  = null
  n100b = null
  n1k   = null
  n10k  = null
  n100k = null
  n1m   = null
  limitReached           = null
  removedItem            = null
  removedItemForFixedKey = null
  removedItemForFifo     = null

  beforeEach ->
    # Clear Local Storage
    try
      localStorage.clear()
    catch e

    # helpers to create a bunch of data
    repeat = (value, count) ->
      output = []
      while count -= 1
        output.push value
      output.join ''

    n10b  = '1234567890'
    n100b = repeat n10b, 10
    n1k   = repeat n100b, 10
    n10k  = repeat n1k, 10
    n100k = repeat n10k, 10
    n1m   = repeat n100k, 10

    # create our collection
    collection = new Fifo('fifo:test')

  it "sets the default namespect to 'fifo'", ->
    collection = new Fifo()
    collection.namespace.should.equal 'fifo'

  it 'set and get items in storage', ->
    collection.set 'foo', { foo: 'bar' }
    retrieved = collection.get('foo')
    retrieved.foo.should.equal 'bar'

  it 'will set noLS to true if there is localStorage', ->
    expect(collection.noLS).to.be.false

  it 'remove items from storage', ->
    collection.set 'foo', { foo: 'bar' }
    collection.remove('foo')
    expect(collection.get('foo')).to.be.undefined

  # Too Slow
  unless require?
    it 'ensure it removes old items to add others, sending them to onLimit', ->
      limitReached = false
      removedItem = null
      i = 0

      onLimit = (items) ->
        limitReached = true
        removedItem = items[0]

      until limitReached or i is 10000 # don't wan't to freeze the browser
        i += 1
        key = "test:#{i}"
        collection.set key, n100k, onLimit

      # If we don't have localStorage, nothing will be returned.
      if collection.noLS
        expect(removedItem).to.be.null
      else
        expect(removedItem.key).to.equal "test:1"

  it 'empty the collection', ->
    collection.set 'empty1', true
    collection.set 'empty2', true

    collection.get('empty1').should.be.true
    collection.get('empty2').should.be.true

    collection.empty()

    expect(collection.get('empty1')).to.be.undefined
    expect(collection.get('empty2')).to.be.undefined

  it 'add fixed value', ->
    fixedValue = 'value'
    fixedKey = 'fixed'

    collection.setFixed fixedKey, fixedValue
    fixed = collection.get fixedKey

    # Fixed key added
    expect(fixed).to.equal fixedValue

    collection.remove fixedKey
    fixed = collection.get fixedKey

    # Fixed key has been removed
    expect(fixed).to.be.undefined

  # Too slow
  if not require?
    it 'fixed keys can be added once FIFO queue full then add additional items to FIFO queue and check that we kept the fixed item', ->
      return if collection.noLS

      # IE9 has issues hitting the end of space.
      # return  if navigator.appVersion.indexOf("MSIE 8") is -1
      # return  if navigator.appVersion.indexOf("MSIE 9") is -1
      i                      = 0
      limitReached           = false
      removedItem            = null
      removedItemForFixedKey = null
      removedItemForFifo     = null

      moreFifoOnLimit = (items) ->
        removedItemForFifo = items[0]

      fixedKeyOnLimit = (items) ->
        removedItemForFixedKey = items[0]
        collection.set key, n1m, moreFifoOnLimit

      fifoQueueOnLimit = (items) ->
        limitReached = true
        removedItem = items[0]
        collection.setFixed 'fixed-key', n1m, fixedKeyOnLimit

      until limitReached or i is 100 # don't wan't to freeze the browser
        i += 1
        key = "test:#{i}"
        collection.set key, n100k, fifoQueueOnLimit

      # Fixed value retrieved successfully
      expect(collection.get('fixed-key').length).to.equal n1m.length

      # Expected value removed
      removedItem.key.should.equal 'test:1'

      # Issues with IE10 and memory.
      # https://cowbell-labs.com/2013-10-21-internet-explorer-out-of-memory-error.html
      return if navigator.appVersion.indexOf("MSIE 8") is -1
      return if navigator.appVersion.indexOf("MSIE 9") is -1
      return if navigator.appVersion.indexOf("MSIE 10") is -1

      # Expected value removed to fit fixed key
      removedItemForFixedKey.key.should.equal 'test:2'

      # Expected value removed from FIFO queue, issues with IE10 and memory.
      # https://cowbell-labs.com/2013-10-21-internet-explorer-out-of-memory-error.html
      removedItemForFifo.key.should.equal 'test:12'

  it 'gets all values', ->
    collection.setFixed 'fixed-key', 'fixed-value'
    collection.set 'fifo-key', 'fifo-value'

    # Values fetched successfully
    expect(Object.keys(collection.get()).length).to.equal 2

    # Fetched fifo key correctly
    collection.get()['fifo-key'].should.equal 'fifo-value'

    # Fetched fixed key correctly
    collection.get()['fixed-key'].should.equal 'fixed-value'

  it 'get keys', ->
    collection.setFixed 'fixed-key', 'fixed-value'
    collection.set 'fifo-key', 'fifo-value'

    # Keys fetched successfully
    expect(collection.keys().length).to.equal 2

    # Fetched fifo key correctly
    expect(collection.keys()[0]).to.equal 'fifo-key'

    # Fetched fixed key correctly
    expect(collection.keys()[1]).to.equal 'fixed-key'

  it 'has key', ->
    collection.setFixed 'fixed-key', 'fixed-value'
    collection.set 'fifo-key', 'fifo-value'

    # Has fixed key
    collection.has('fixed-key').should.be.true

    # Has fifo key
    collection.has('fifo-key').should.be.true

    # Hasn't lost key
    collection.has('lose-key').should.be.false

  it "'keys' isn't replicated due to pass by reference", ->
    collection.setFixed 'fixed-key', 'fixed-value'
    collection.set 'fifo-key', 'fifo-value'
    collection.keys()

    # Data has been replicated
    expect(collection.keys().length).to.equal 2

  it 'test old key is cleaned up when saved', ->
    collection.set 'A', '1'
    collection.set 'B', '2'
    collection.set 'C', '3'

    # Correct amount of keys set
    expect(collection.keys().length).to.equal 3

    collection.set 'A', '4'

    # Correct amount of keys set
    expect(collection.keys().length).to.equal 3

  it 'can remove items using a string', ->
    collection.setFixed 'fixed-key', 'fixed-value'
    collection.setFixed 'fixed-regex-key', 'fixed-regex-value'
    collection.set 'fifo-regex-key', 'fifo-value'
    collection.set 'fifo-key', 'fifo-regex-value'
    collection.remove 'fixed-regex-key'
    collection.remove 'fifo-regex-key'

    # Has fixed key
    collection.has('fixed-key').should.be.true

    # Missing fixed-regex key
    collection.has('fixed-regex-key').should.be.false

    # Has fifo key
    collection.has('fifo-key').should.be.true

    # Missing fifo-regex key
    collection.has('fifo-regex-key').should.be.false

  it 'can remove items using a regex', ->
    collection.setFixed 'fixed-key', 'fixed-value'
    collection.setFixed 'fixed-regex-key', 'fixed-regex-value'
    collection.set 'fifo-regex-key', 'fifo-value'
    collection.set 'fifo-key', 'fifo-regex-value'
    collection.remove /regex/ig

    # Has fixed key
    collection.has('fixed-key').should.be.true

    # Missing fixed-regex key
    collection.has('fixed-regex-key').should.be.false

    # Has fifo key
    collection.has('fifo-key').should.be.true

    # Missing fifo-regex key
    collection.has('fifo-regex-key').should.be.false

  it 'can remove items using a function', ->
    collection.setQueueLimit null
    collection.setFixed 'fixed-key', 'fixed-value'
    collection.setFixed 'fixed-regex-key', 'fixed-regex-value'
    collection.set 'fifo-regex-key', 'fifo-value'
    collection.set 'fifo-key', 'fifo-regex-value'

    collection.remove (value) -> value.indexOf('regex') isnt -1

    # Has fixed key
    collection.has('fixed-key').should.be.true

    # Missing fixed-regex key
    collection.has('fixed-regex-key').should.be.false

    # Has fifo key
    collection.has('fifo-key').should.be.true

    # Missing fifo-regex key
    collection.has('fifo-regex-key').should.be.false

  it 'can limit the fifo queue size', ->
    collection.setQueueLimit 3
    collection.set 'key1', 'value1'
    collection.set 'key2', 'value2'
    collection.set 'key3', 'value3'
    collection.set 'key4', 'value4'
    collection.set 'key5', 'value5'
    collection.set 'key6', 'value6'

    # Correct amount of keys set
    expect(collection.keys().length).to.equal 3

    # Expected key6 to be in place
    collection.has('key6').should.be.true

    # Expected key5 to be in place
    collection.has('key5').should.be.true

    # Expected key4 to be in place
    collection.has('key4').should.be.true

    # Expected key3 to *not* be in place
    collection.has('key3').should.be.false

  describe 'No localStorage', ->
    beforeEach ->
      collection.noLS = true

    if require?
      it 'will set noLS to false if there is no localStorage', ->
        cached_local_storage = global.localStorage
        global.localStorage = undefined

        try
          test = new Fifo('fifo:test')
          expect(test.noLS).to.be.true
        finally
          global.localStorage = cached_local_storage

    it 'will return false when trying to invoke trySave with no localStorage', ->
      expect(collection.trySave()).to.be.false

    it 'will return removed items when trying to invoke save with no localStorage', ->
      expect(collection.save()).to.eql []

    it 'set and get items with a key in storage with no localStorage', ->
      collection.set 'foo', { foo: 'bar' }
      retrieved = collection.get('foo')
      retrieved.foo.should.equal 'bar'

    it 'set and get items without a key in storage with no localStorage', ->
      test = { foo: 'bar' }
      collection.set 'foo', test
      retrieved = collection.get()
      retrieved.foo.should.equal test

    it 'add fixed value with no localStorage', ->
      fixedValue = 'value'
      fixedKey = 'fixed'

      collection.setFixed fixedKey, fixedValue
      fixed = collection.get fixedKey

      # Fixed key added
      expect(fixed).to.equal fixedValue

      collection.remove fixedKey
      fixed = collection.get fixedKey

      # Fixed key has been removed
      expect(fixed).to.be.undefined

    it 'get keys with no localStorage', ->
      collection.setFixed 'fixed-key', 'fixed-value'
      collection.set 'fifo-key', 'fifo-value'

      # Keys fetched successfully
      expect(collection.keys().length).to.equal 2

      # Fetched fifo key correctly
      expect(collection.keys()[0]).to.equal 'fifo-key'

      # Fetched fixed key correctly
      expect(collection.keys()[1]).to.equal 'fixed-key'

    it 'get keys with no localStorage and queue limit set', ->
      collection.setQueueLimit(4)
      collection.set 'fifo-key-1', 'fifo-value-1'
      collection.setFixed 'fifo-key-2', 'fifo-value-2'
      collection.set 'fifo-key-3', 'fifo-value-3'
      collection.setFixed 'fifo-key-4', 'fifo-value-4'
      collection.set 'fifo-key-5', 'fifo-value-5'
      collection.setFixed 'fifo-key-6', 'fifo-value-6'
      collection.set 'fifo-key-7', 'fifo-value-7'
      collection.setFixed 'fifo-key-8', 'fifo-value-8'

      # Keys fetched successfully
      expect(collection.keys().length).to.equal 4

      # Fetched fixed key correctly
      expect(collection.keys()[0]).to.equal 'fifo-key-8'

      # Fetched fifo key correctly
      expect(collection.keys()[1]).to.equal 'fifo-key-7'

      # All keys
      expect(collection.keys()[2]).to.equal 'fifo-key-6'
      expect(collection.keys()[3]).to.equal 'fifo-key-5'

    it 'has key with no localStorage', ->
      collection.setFixed 'fixed-key', 'fixed-value'
      collection.set 'fifo-key', 'fifo-value'

      # Has fixed key
      collection.has('fixed-key').should.be.true

      # Has fifo key
      collection.has('fifo-key').should.be.true

      # Does not have lose key
      collection.has('lose-key').should.be.false

    it 'has key with no localStorage and queue limit set', ->
      collection.setQueueLimit(4)
      collection.set 'fifo-key-1', 'fifo-value-1'
      collection.setFixed 'fifo-key-2', 'fifo-value-2'
      collection.set 'fifo-key-3', 'fifo-value-3'
      collection.setFixed 'fifo-key-4', 'fifo-value-4'
      collection.set 'fifo-key-5', 'fifo-value-5'
      collection.setFixed 'fifo-key-6', 'fifo-value-6'
      collection.set 'fifo-key-7', 'fifo-value-7'
      collection.setFixed 'fifo-key-8', 'fifo-value-8'

      # Has fixed key
      collection.has('fifo-key-8').should.be.true

      # Has fifo key
      collection.has('fifo-key-7').should.be.true

      # Does not have lose key
      collection.has('fifo-key-4').should.be.false

    it 'can remove items using a regex with no localStorage', ->
      collection.setFixed 'fixed-key', 'fixed-value'
      collection.setFixed 'fixed-regex-key', 'fixed-regex-value'
      collection.set 'fifo-regex-key', 'fifo-value'
      collection.set 'fifo-key', 'fifo-regex-value'
      collection.remove /regex/ig

      # Has fixed key
      collection.has('fixed-key').should.be.true

      # Missing fixed-regex key
      collection.has('fixed-regex-key').should.be.false

      # Has fifo key
      collection.has('fifo-key').should.be.true

      # Missing fifo-regex key
      collection.has('fifo-regex-key').should.be.false

    it 'can remove items using a function', ->
      collection.setQueueLimit null
      collection.setFixed 'fixed-key', 'fixed-value'
      collection.setFixed 'fixed-regex-key', 'fixed-regex-value'
      collection.set 'fifo-regex-key', 'fifo-value'
      collection.set 'fifo-key', 'fifo-regex-value'

      collection.remove (value) -> value.indexOf('regex') isnt -1

      # Has fixed key
      collection.has('fixed-key').should.be.true

      # Missing fixed-regex key
      collection.has('fixed-regex-key').should.be.false

      # Has fifo key
      collection.has('fifo-key').should.be.true

      # Missing fifo-regex key
      collection.has('fifo-regex-key').should.be.false
