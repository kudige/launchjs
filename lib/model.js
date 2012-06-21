#!/usr/bin/env node
var Path = require('path'),
Db = require('mongous').Mongous,
Emitter = require('events').EventEmitter,
modelCache = require('./model_cache'),
Wrapper = require('./wrapper'),

// PlaceHolder is the main model class that takes care of 
// Async DB access with chaining
DynObj = new (require('dynobj').DynObj)(),

PlaceHolder = DynObj.create()

var debugLevels = {
//	'debug' : true, 
//	'api': true, 
//	'error' : true
}
function dbg(level, msg) {
	if (debugLevels[level]) {
		process.stderr.write(msg + '\n')
	}
}

// DB Table management
var tableHash = {}
function Table(name) {
	var dbname = 'test'
	if (Config.database && Config.database.name) {
		dbname = Config.database.name
	}

	if (!tableHash[name])
		tableHash[name] = Db(dbname + '.' +name)

	return tableHash[name]
}

function Cleanup() {
	for (var key in tableHash) {
		try {
			tableHash[key].close()
		} catch(e) {
		}
	}
}

PlaceHolder.prototype._wait = function(parent, table_name) {
	this._state = 'waiting'
	this._dbentry = null
	this._dbsave = {}
	this._pending = {}
	this._emitter = new Emitter
	this._submodels = []
	this._parent = parent
	this._pendingSave = false
	this._foreignCache = {}
	this._parentKey = null
	this._saveDependancies = 0
	this._pendingAppends = []
	this._childSlots = []
	if (table_name) {
		this._type = table_name
		this._table = Table(table_name)
	} else {
		this._type = null
		this._table = null
	}
	return this
}

PlaceHolder.prototype._load = function(table_name) {
	this._state = 'loading'
	if (table_name) {
		this._type = table_name
		this._table = Table(table_name)
	}
	return this
}

PlaceHolder.prototype._ready = function() {
	dbg('state', 'Model ready ' + this._type)
	this._state = 'ready'
	var self = this
	for (var i=0; i < this._submodels.length; i++) {
		var key = this._submodels[i].key
		var index = this._submodels[i].index
		var obj = this._submodels[i].object
		this._loadSubmodel(key, obj, index)
	}

	if (this._dbentry) {
/*
		for (var key in this._pending) {
			this._dbentry[key] = this._pending[key]
		}
*/
	}
	if (this._pendingAppends.length > 0) {
		if (this._parentKey) {
			return this._parent._processPendingAppends(this._parentKey, this)
		}
	} else if (this._pendingSave) {
		this.save()
	}
/*
	if (self.__passthrough === undefined) {
		var usemodel = modelCache.get(this._type)
		self = Wrapper(self, usemodel)
	}
*/
	self._emit('ready', self)
	return this
}

PlaceHolder.prototype._error = function(message) {
	this._emit('err', message)
	for (var i=0; i< this._submodels.length; i++) {
		this._submodels[i].object._error('Parent query not found')
	}
}

PlaceHolder.prototype._relation = function(field) {
	for (var key in this._dbentry) {
		if (key.match(/^_id_(.*)/)) {
			var keyspec = RegExp.$1
			var fieldspec = keyspec
			if (keyspec.match(/^([^_]+)_(.+)/)) {
				keyspec = RegExp.$1
				fieldspec = RegExp.$2
			}
			if (fieldspec === field) 
				return {table: keyspec, field: fieldspec, local_id: key, remote_id: '_id'}
		}
	}
}

PlaceHolder.prototype._foreignKey = function(key, obj) {
	return '_id_' + obj._type + '_' + key
}

PlaceHolder.prototype.on = function(arg1, arg2) {
	if (arg1 === 'load')
		arg1 = 'ready'
	else if (arg1 === 'error')
		arg1 = 'err'

	if (arg1 === 'unhandled')
		this._emitter.on(arg1, arg2)
	else
		this._emitter.once(arg1, arg2)
	return this
}

PlaceHolder.prototype._emit = function() {
	var event = arguments[0]
	var emitter= this._emitter
	dbg('debug', "Model type %s state %s emitting event %s".format(this._type, this._state, event)) 
	if (emitter.listeners(event).length)
		return emitter.emit.apply(emitter, arguments)

	var args = []
	for (var i=1; i<arguments.length; i++)
		args.push(arguments[i])
//	console.log('unhandled %s'.format(event))
	return emitter.emit('unhandled', event, args)
}

PlaceHolder.prototype.__get__ = function(key) {
	dbg('debug', 'Model get ' + key + ' (state ' + this._state + ', table ' + this._type + ')')
	// Normal attributes, passthrough
	if (key.match(/^_/) && !key.match(/^_id/)) {
		return
	}

	if (key.match(/^[0-9]+$/)) {
		return this.get(key)
	}

	var special = this._specialField(key)
	if (special !== undefined)
		return special

	if (this._foreignCache[key])
		return this._foreignCache[key]

	if (this._state === 'waiting' ||
		this._state === 'loading') {
		// Waiting & Loading
		dbg('api', "Model placeholder for %s from parent (table %s)".format(key, this._type))
		var submodel = new PlaceHolder()
		submodel._wait(this)
		submodel._parentKey = key
		this._submodels.push({key: key, object: submodel})
		return submodel
	} else if (this._state === 'ready') {
		// Ready
		var relation = this._relation(key)
		if (relation) {
			if (!this._foreignCache[key]) {
				/*
				var usemodel = modelCache.get(relation.table)
				this._foreignCache[key] = Wrapper(DbModel(relation.table, this).find({_id: this._dbentry[relation.local_id]}), usemodel)
*/
				this._foreignCache[key] = DbModel(relation.table, this).find({_id: this._dbentry[relation.local_id]})
			}
			return this._foreignCache[key]
		} else if (this._dbentry) {
			return this._dbentry[key]
		} else
			return
	} else {
		dbg('error', "Model get " + key + " (state " + this._state + ", table " + this.table+") NOT IMPLEMENTED")
	}
}

PlaceHolder.prototype._specialField = function(k) {
	var self = this
	if (k.match(/^on(.+)/i)) {
		var event = RegExp.$1.toLowerCase()
		dbg('debug', "Model specialField ON " + k + ' event ' + event)
		return function(callback) {
			return self.on(event,callback)
		}
	}

	if (k.match(/^is(.+)/i)) {
		var state = RegExp.$1.toLowerCase()
		dbg('debug', "Model specialField IS " + k + ' state ' + state)
		return function() {
			return (self._state === state)
		}
	}

	if (k.match(/^by(.+)/i)) {
		var field = RegExp.$1.toLowerCase()
		dbg('debug', "Model specialField BY " + k + ' field ' + field)
		return function(value) {
			var query = {}
			query[field] = value
			return self.find(query)
		}
	}

	if (k === 'length') {
		dbg('debug', 'Model length in state %s dbentries length %s'.format(this._state, this._dbentries.length))
		if (this.isReady())
			return this._dbentries.length
		else
			return this._pendingAppends.length
	}
	return
}

PlaceHolder.prototype.__set__ = function(k,v) {
	// Properties starting wih underscore are regular proeprtie
	if (k.match(/^_/))
		return true

	dbg('api', "Model set - key " + k)

	// Handle setting a property
	var self = this
	var propbag = this._dbsave //this._dbentry || this._pending
	if (v instanceof PlaceHolder) {
		if (v._state === 'ready') {
			var propbag = self._dbsave
			if (!propbag['$set'])
				propbag['$set'] = {}
			propbag['$set'][this._foreignKey(k,v)] = v._id
			this._foreignCache[k] = v
		} else {
			dbg('state', "Model set - Unready objects on RHS, table " + v._type)
			self._saveDependancies++
			v.on('ready', function(obj2) {
				dbg('state', "Model set - Unready object is now ready, (table " + obj2._type 
					+ ', id ' + JSON.stringify(obj2._id) + ') self state ' + self._state)
				var propbag = self._dbsave
				if (!propbag['$set'])
					propbag['$set'] = {}
				propbag['$set'][self._foreignKey(k, obj2)] = obj2._id
				self._foreignCache[k] = obj2
				self._saveDependancies--
				self.save()
			}).on('error', function() {
				self._saveDependancies--
				self.save()
			})
		}
	} else {
		var op = '$set'
		var setkey = k
		var setvalue = v
		if (typeof(v) === typeof('') && v.match(/^\$/)) {
			op = v
			setvalue = 1
		}
		if (!propbag[op])
			propbag[op] = {}
		propbag[op][setkey] = setvalue
	}
	return this
}

PlaceHolder.prototype.set = function(v) {
	if (this._parent && this._parentKey) {
		this._parent[this._parentKey] = v
	}
	return this._parent
}

PlaceHolder.prototype.save = function() {
	dbg('api', "Model save (state %s, table %s) dbentry %s dbsave %s"
		.format(this._state, this._type, JSON.stringify(this._dbentry),
				JSON.stringify(this._dbsave)))
	if (this._saveDependancies > 0) {
		dbg('state', "Model save deferred. Dependencies " + this._saveDependancies)
		return this
	}

	if (this._state === 'ready') {
		if (this._dbsave && this._dbentry && this._dbentry._id) {
			this._table.update({_id: this._dbentry._id}, this._dbsave, 1)
			this._emit('update', this)
			this._emit('save', this)
		}
		if (this._dbentries) {
			this._parent.save()
			this._emit('save', this)
		}
	} else if (this._state === 'waiting') {
		if (this._pendingAppends.length > 0) {
			this._pendingSave = true
		} else {
			this._table.save(this._pending)
			this._emit('add', this)
			this._emit('save', this)
		}
	} else if (this._state === 'loading') {
		this._pendingSave = true
	} else {
		dbg('error', "Model save (state " + this._state + ") NOT IMPLEMENTED")
	}
	return this
}

PlaceHolder.prototype._processPendingAppends = function(key, obj) {
	var self = this
	
	dbg('api', "processPendingAppends key %s table %s typeof dbentries %s".format(key, obj._type, typeof(obj._dbentries)))
	if (obj._dbentries === undefined)
		obj._dbentries = []
	var fkey = null
	var table_name = null
	var stillPending = 0
	if (self._dbsave['$set'] === undefined)
		self._dbsave['$set'] = {}
	var dbsave = self._dbsave['$set']
	Launch.each(obj._pendingAppends,function(i, subobj) {
		if (!subobj.isReady()) {
			var index = i
			stillPending++
			subobj.onReady(function() {
				if (!fkey) {
					fkey = self._foreignKey(key, subobj)
					if (dbsave[fkey] === undefined)
						if (Array.isArray(self._dbentry[fkey]))
							dbsave[fkey] = self._dbentry[fkey]
						else
 							dbsave[fkey] = []

					table_name = subobj._type
				}
				if (subobj._type !== table_name) {
					throw "all objects in one-to-many should be of same table. %s != %s".format(subobj._type, table_name)
				}
				obj._dbentries.push(subobj._dbentry)
				dbsave[fkey].push(subobj._dbentry._id)
				stillPending--
				if (stillPending <= 0)
					obj._ready()
			})
			return
		}

		if (!fkey) {
			fkey = self._foreignKey(key, subobj)
			if (dbsave[fkey] === undefined)
				if (Array.isArray(self._dbentry[fkey]))
					dbsave[fkey] = self._dbentry[fkey]
			else
 				dbsave[fkey] = []
			table_name = subobj._type
		} else {
			if (subobj._type !== table_name) {
				throw "all objects in one-to-many should be of same table. %s != %s".format(subobj._type, table_name)
			}
		}
		obj._dbentries.push(subobj._dbentry)
		dbsave[fkey].push(subobj._dbentry._id)
	})
	obj._pendingAppends = stillPending
	obj._load(table_name)
	if (stillPending === 0) {
		obj._pendingAppends = []
		obj._ready()
	}
}

PlaceHolder.prototype._loadSubmodel = function(key, obj, index) {
	var self = this
	if (this._dbentry && this._dbentry[key]) {
		obj._emit('ready', this._dbentry[key])
		return
	}

	if (key !== undefined) {
		var relation = this._relation(key)
		if (relation) {
			dbg('state', 'Model submodel loaded key [' + key + '] table [' + relation.table + '] local_id [' + relation.local_id + ']')
			if (Array.isArray(this._dbentry[relation.local_id])) {
				return obj._load(relation.table).list({_id: {$in: this._dbentry[relation.local_id]}})
			} else {
				return obj._load(relation.table).find({_id: this._dbentry[relation.local_id]})
			}
		}
	}

	if (index !== undefined) {
		if (this._dbentries && this._dbentries.length >index) {
			obj._dbentry = this._dbentries[index]
			return obj._load(this._type)._ready()
		}
	}

	if (obj._pendingAppends.length > 0) {
 		return this._processPendingAppends(key, obj)
	}

	dbg('error', 'Model submodel load (state ' + this._state + ', table ' + this._type + ') ' + 
		'obj.table ' + obj._type +  
		' Foreign key [' + key + '] not found')
	if (!this._pendingSave) {
		obj._error('Foreign key [' + key + '] not found', obj)
	}
}

PlaceHolder.prototype._notfound = function(query) {
	if (this._notfound_handler) {
		dbg('state', "Model  notfound_handler called for query " + JSON.stringify(query) + " in table " + this._type)
		this._notfound_handler()
	} else {
		dbg('error', "Model query NOT found " + JSON.stringify(query) + " in table " + this._type)
		this._emit('notfound', this)
		//this._error('Query not found in table ' + this._type, this)
	}
}

PlaceHolder.prototype.find = function(query) {
	if (typeof(query) != typeof({})) 
		query = {_id : query}

	dbg('api', "Model find (type " + this._type + ") query " + JSON.stringify(query))
	if (this._state == 'waiting' && this._table) {
		this._load()
	} else if (this._state !== 'loading') {
//		throw 'Model: invalid find() call. Current state ' + this._state
	}

	var self = this
	this._table.find(query, function(reply) {
		if (reply.numberReturned > 0) {
			self._dbentry = reply.documents[0]
			self._ready()
		} else {
			self._notfound(query)
		}
	})
	return this
}

PlaceHolder.prototype.list = function(query) {
	dbg('api', "Model list for table %s query %s".format(this._type, ''+JSON.stringify(query)))
	if (this._state == 'waiting' && this._table) {
		this._load()
	} else if (this._state !== 'loading') {
		throw 'Model: invalid list() call. Current state ' + this._state
	}
	
	var self = this
	this._table.find(query, function(reply) {
		dbg('api', "Model list returned for table %s count %s".format(self._type, reply.numberReturned))
		if (reply.numberReturned > 0) {
			self._dbentries = reply.documents
		} else {
			self._dbentries = []
		}
		self._ready()
	})
	return this
}

PlaceHolder.prototype.each = function(callback_fn, callback_context) {
	if (this.isReady() && this._dbentries !== undefined) {
		for (var i=0; i<this.length; i++) {
			var obj = this.get(i)
			callback_fn(i, obj, callback_context)
		}
	}
}

PlaceHolder.prototype.append = function(obj) {
	if (!this.isWaiting()) {
		throw "append not implemented in state " + this._state
	}
	var index = this._pendingAppends.length
	this._pendingAppends.push(obj)
	this._childSlots[index] = obj
	return this
}

PlaceHolder.prototype._childInSlot = function(index, obj) {
	if (this._childSlots[index] === undefined) {
		this._childSlots[index] = obj?obj:DbModel(this._type, this, this._dbentries[index])
	}
	else if (!this._childSlots[index].isReady()) {
		this._childSlots[index]._dbentry = this._dbentries[index]
		this._childSlots[index]._ready()
	}
	return this._childSlots[index]
}

PlaceHolder.prototype.get = function(index) {
	if (this.isReady()) {
		if (this._dbentries) {
			if (index === undefined) {
				return this._dbentries
			}
			if (index>=0 && index < this._dbentries.length) {
				return this._childInSlot(index)
			}
			throw("Index %s out of bound (length %s)".format(index, this._dbentries.length))
		}
	} else if (this.isLoading() || this.isWaiting()) {
		// Waiting & Loading
		if (this._childSlots[index] !== undefined) {
			return this._childSlots[index]
		}
		var submodel = new PlaceHolder()
		submodel._wait(this)
		submodel._parentIndex = index
		this._submodels.push({index: index, object: submodel})
		if (this.wrap && typeof(this.wrap) === 'function')
			submodel = this.wrap(submodel)
		this._childSlots[index] = submodel
		return submodel
	}
//	throw("Object not a collection")
}

PlaceHolder.prototype.add = function(query, key) {
	dbg('api', 'Model add type %s key %s query %s'.format(this._type, key, JSON.stringify(query)))
	var self = this
	function doAdd() {
		self._table.save(query)
		self._dbentry = query
		self._state = 'ready'
		self._emit('add', self)
		self.find()
	}
	if (key) {
		var index = {}
		index[key] = query[key]
		this._table.find(index, function(reply) {
			if (reply.numberReturned > 0) {
				self._emit('exists', self)
			} else {
				doAdd()
			}
		})
	}  else {
		doAdd()
	}
	
	return this
}

PlaceHolder.prototype.findadd = function(query, key) {
	dbg('api', "Model findadd (type " + this._type + ") query " + JSON.stringify(query))
	var self = this
	this._notfound_handler = function() {
		for (var k in query) {
			self._foreignCache[k] = query[k]
		}
		self.add(query)
		self.find(query)
		self._notfound_handler = null
	}
	var index = query
	if (key && query[key]) {
		index = {}
		index[key] = query[key]
	}
	this.find(index).onReady(function(found) {
		var nfound=0
		Launch.each(query,function(k, v) {
			if (k !== key) {
				nfound++
				found[k] = v
			}
		})
		if (nfound > 0)
			found.save()
		else
			found._emit('save', found)
	})
	return this
}

PlaceHolder.prototype.watch = function(obj) {
	this.on('unhandled', function(event, args) {
//		console.log('unhandled rcvd %s'.format(event))
		if (event === 'err' || args.length == 0) {
			if (typeof(obj._onError) === 'function')
				obj._onError.apply(obj, args)
		} else {
			var model = args[0]
			var generic = '_on%s'.format(event.toCapCase())
			var type = model._model || model._type
			if (type) {
				var specific = '_on%s%s'.format(type.toCapCase(), event.toCapCase())
				callback = obj[specific]
			}
			if (!callback)
				callback = obj[generic]
			if (callback && typeof(callback) === 'function') {
				//console.log(''+callback)
				callback.apply(obj, args)
			}
		}
	})
	return this
}

// Main entry point for the model system
function DbModel(table_name, parent, dbentry) {
	var placeholder = new PlaceHolder()
	placeholder._wait(parent, table_name)
	if (dbentry) {
		placeholder._load()
		placeholder._dbentry = dbentry
		placeholder._ready()
	}
	if (parent && typeof(parent.wrap) === 'function') {
		placeholder = parent.wrap(placeholder)
	}
	return placeholder
}

function Model(modulePath, nodeModule) {
	this.modulePath = modulePath
	this.moduleDir = Path.dirname(modulePath)
	this._model = this.constructor._model || Path.basename(modulePath, '.js')
	//this._table = this.constructor._table || this._model 
}

Launch.extend(Model.prototype, {
	schema: function() {
		// No schema defined
	},
	key: function() {
		return this[this.schema().primary]
	},
	display: function() {
		return this.description || this.name || this.title
	},
	find: function() {
		// Allow single argument using schema primary key
		if (arguments.length == 0)
			return this.__chain_find()
		if (arguments.length > 1 || typeof(arguments[0]) !== typeof('')) {
			return this.__chain_find.apply(this, arguments)
		}
		var query = {}
		query[this.schema().primary] = arguments[0]
		return this.__chain_find.call(this, query)
	},

	add: function(object, key) {
		var schema = this.schema()
		if (key === undefined)
			key = schema.primary
		var newobj = object
/*
		object.each(function(field, value) {
			if (schema.relations[field]) {
				newobj[field] = DbModel(schema.relations[field]).find(value)
			} else {
				newobj[field] = value
			}
		})
		console.log(newobj)
*/
		return this.__chain_add(newobj, key)
	},
	save: function() {
/*
		var schema = this.schema()
		var self = this
		if (this._dbsave && this._dbsave.$set) {
			var $set = this._dbsave.$set
			var fixes = {}
			$set.each(function(field, value) {
				if (schema.relations[field]) {
					console.log('converting %s table %s (%s)'.format(field, schema.relations[field], value))
					fixes[field] = DbModel(schema.relations[field]).find({name:value})
				}
			})
			fixes.each(function(field, target) {
				self[field] = target
			})
		}
*/
		return this.__chain_save()
	}
})

Model.prototype.toString = function() {
	if (this && this.isReady && typeof(this.isReady) === 'function' && this.isReady())
		return this.display()
	return "Model object %s".format(this._state)
}

var Schema = function(model) {
	var self = this
	this.model = model
	this.fields = []
	this.primary = 'name'
	this.relations = {} 
}

Launch.extend(Schema.prototype, {
	formfields: function(objname, action) {
		var formfields = []
		var self = this
		Launch.each(this.fields,function(i, name) {
			var fieldinfo = {name: objname + '.' + name}
			if (action === 'edit' && name === self.primary)
				fieldinfo.type = 'hidden'
			
			formfields.push(fieldinfo)
		})
		return formfields
	},
	relatedModels: function() {
		var result = []
		Launch.each(this.relations,function(i, relation) {
			result.push(relation.toCapCase())
		})
		return result
	},
	relation: function(field, target, type) {
		this.relations[field] = target // Very simplistic
		for (var i=0; i<this.fields.length; i++) 
			if (this.fields[i] === field)
				return
		this.fields.push(field)
	}
})

function GetModel(model_name, table_name) {
	table_name = table_name || model_name
	var usemodel = modelCache.get(table_name)
	var model = DbModel(table_name)
	model._model = model_name
	if (usemodel) {
		model = Wrapper(model, usemodel)
	}
	return model
	
}

exports.enableDebug = function() {
	if (!arguments.length) 
		debugLevels = {api:true, state:true, raw:true, error:true}
	else {
		for (var a in arguments) {
			debugLevels[arguments[a]] = true
		}
		debugLevels.error = true
	}
}

exports.disableDebug = function() {
	if (!arguments.length) 
		debugLevels = {}
	else {
		for (var a in arguments) {
			debugLevels[a] = false
		}
	}
}

exports.helper = function(table, key) {
	if (key) {
		return function(value) {
			var m = DbModel(table)
			if (value) {
				var query = {}
				query[key] = value
				m.find(query)
			}
			return m
		}
	} else {
		return function(value) {
			return DbModel(table)
		}
	}
}

root.DbModel = DbModel
root.GetModel = GetModel
root.Model = Model
root.Schema = Schema

exports.dbmodel = DbModel
exports.model = GetModel
exports.Table = Table
exports.Cleanup = Cleanup
exports.PlaceHolder = PlaceHolder