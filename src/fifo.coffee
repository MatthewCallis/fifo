class Fifo
  queueLimit: null

  constructor: (namespace = 'fifo') ->
    @namespace = namespace
    @noLS = false

    # This check have to be wrapped within a try/catch because on a SecurityError: Dom Exception 18 on iOS.
    try
      if localStorage?
        @data = JSON.parse(localStorage.getItem(@namespace)) or { keys: [], items: {} }
      else
        @data = { keys: [], items: {} }
        @noLS = true
    catch
      @data = { keys: [], items: {} }
      @noLS = true

  trySave: (key, value) =>
    return false if @noLS
    try
      if not key
        return false if @queueLimit and (@data.keys.length > @queueLimit)
        localStorage.setItem(@namespace, JSON.stringify(@data))
      else
        localStorage.setItem(key, value)
      return true
    catch error
      # 18 for Safari: SecurityError: DOM Exception 18
      # 21 for some Safari
      # 22 for Chrome and Safari, 1014 for Firefox: QUOTA_EXCEEDED_ERR
      # -2147024882 for IE10 Out of Memory
      if error.code is 18 or error.code is 21 or error.code is 22 or error.code is 1014 or error.number is -2147024882
        return false
      throw error

  removeFirstIn: =>
    firstIn = @data.keys.pop()
    removedItem = { key: firstIn, value: @data.items[firstIn] }
    delete @data.items[firstIn]
    removedItem

  save: (key, value) =>
    removed = []
    return removed if @noLS
    until @trySave(key, value)
      if @data.keys.length
        removed.push @removeFirstIn()
        unless @noLS
          localStorage.setItem(@namespace, JSON.stringify(@data)) if key
      else
        throw new Error("All items removed from #{@namespace}, still can't save.")
    removed

  set: (key, value, onRemoved) =>
    @data.items[key] = value

    index = @data.keys.indexOf(key)
    @data.keys.splice(index, 1) if index > -1

    @data.keys.unshift(key)

    removed = @save()
    onRemoved.call this, removed if onRemoved and removed.length
    this

  # no args returns all items
  get: (key) =>
    if key
      if @noLS
        @data.items[key]
      else
        localStorage.getItem(key) or @data.items[key]
    else
      if @noLS
        @data.items
      else
        items = @data.items
        for key in Object.keys(localStorage)
          items[key] = localStorage.getItem(key) if key isnt @namespace
        items

  setFixed: (key, value, onRemoved) =>
    # No localStorage, store it.
    if @noLS
      @data.items[key] = value

      index = @data.keys.indexOf(key)
      @data.keys.splice(index, 1) if index > -1

      @data.keys.unshift(key)

    removed = @save(key, value)
    onRemoved.call this, removed if onRemoved and removed.length
    this

  keys: =>
    keys = []

    for key in @data.keys
      keys.push(key)

    if @noLS
      if @queueLimit
        keys.splice(-1 * @queueLimit)
      return keys

    for key in Object.keys(localStorage)
      keys.push(key) if key isnt @namespace

    keys

  has: (key) =>
    if @noLS
      if @queueLimit
        keys = @data.keys.slice(0)
        keys.splice(-1 * @queueLimit)
        if -1 isnt keys.indexOf(key)
          return true
        else
          return false
      if -1 isnt @data.keys.indexOf(key)
        return true
      else
        return false

    return true  if -1 isnt @data.keys.indexOf(key)
    return true  if localStorage.getItem(key) isnt null
    false

  remove: (victim) =>
    return @_removeByString(victim)  if typeof victim is 'string'
    return @_removeByRegExp(victim)  if (victim instanceof RegExp)
    return @_removeByFunction(victim)

  _removeByString: (victim) =>
    unless @noLS
      if localStorage.getItem(victim)
        localStorage.removeItem(victim)
        return this
    for suspect, index in @data.keys when suspect is victim
      @data.keys.splice(index, 1)
      break
    delete @data.items[victim]
    @save()
    this

  _removeByRegExp: (victim) =>
    unless @noLS
      Object.keys(localStorage).forEach (suspect) ->
        localStorage.removeItem(suspect) if suspect.match victim
    for suspect, index in @data.keys when suspect?.match victim
      @data.keys.splice(index, 1)
      delete @data.items[suspect]
    if @noLS
      for suspect, index in Object.keys(@data.items) when suspect?.match victim
        @data.keys.splice(index, 1)
        delete @data.items[suspect]
    @save()
    this

  _removeByFunction: (victim) =>
    unless @noLS
      Object.keys(localStorage).forEach (suspect) ->
        localStorage.removeItem(suspect) if victim(suspect)
    for suspect, index in @data.keys when suspect? and victim.call(this, suspect)
      @data.keys.splice(index, 1)
      delete @data.items[suspect]
    if @noLS
      for suspect, index in Object.keys(@data.items) when suspect? and victim.call(this, suspect)
        @data.keys.splice(index, 1)
        delete @data.items[suspect]
    @save()
    this

  setQueueLimit: (limit) =>
    @queueLimit = limit

  empty: =>
    @data = keys: [], items: {}
    @save()
    this

(exports ? this).Fifo = Fifo
