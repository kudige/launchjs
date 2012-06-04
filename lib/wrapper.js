var DynObj = new (require('dynobj').DynObj)

var Wrapper = DynObj.create()
Wrapper.prototype.__get__ = function(key) {
	if (this.__passthrough[key] || key.match(/__chain_(.*)/)) {
		// Used to chain the request to the heigher object
		key = RegExp.$1
		for (i=0; i<this.__objs.length; i++ ) {
			if (this.__objs[i][key] !== undefined) {
				return this.__objs[i][key]
			}
		}
		return
	}

	for (i=this.__objs.length; i-->0; ) {
		if (this.__objs[i][key] !== undefined) {
			return this.__objs[i][key]
		}
	}
}

Wrapper.prototype.__set__ = function(key, value) {
	if (key === '__objs' || key === '__passthrough')
		return true

	if (this.__objs.length > 0)
		this.__objs[0][key] = value
	return this
}

Wrapper.prototype.__enum__ = function() {
	return Object.keys(this.__objs[0])
}

/* Special cases for Model */
Wrapper.prototype.each = function(fn) {
	return this.__objs[0].each.call(this,fn)
}

Wrapper.prototype.toString = function() {
	return this.__objs[this.__objs.length-1].toString.call(this)
}

Wrapper.prototype.wrap = function(newobj) {
	if (this.__objs.length > 1)
		return Wrap(newobj, this.__objs[1])
	throw 'wrap() called on an object without proxy'
}

var Wrap = function(passthrough) {
	var wrapper = new Wrapper
	wrapper.__passthrough = {}
	Launch.each(passthrough,function(i, pass) {
		wrapper.__passthrough[pass] = true
	})
	wrapper.__objs = []
	Launch.each(arguments,function(i, obj) {
		wrapper.__objs.push(obj)
	})
	return wrapper
}

module.exports = Wrap
