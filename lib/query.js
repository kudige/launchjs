#!/usr/bin/env node
var launch = require('launch')
var vm = require('vm')

var qs = require('querystring')
var input = 'var1.field1=1&var1.field2=2&var1.field3.sub1=11&var2[2]=123&var3[0].obj1.address[2].name=Hello'

function nextcomponent(sofar, comp) {
	if (comp.match(/^[0-9]+$/)) {
		comp = '[' + comp + ']'
	} else if (sofar)
		sofar = sofar + '.'
	return sofar+ comp
}

function joincomponents(comps) {
	var sofar = ''
	Launch.each(comps, function(i, comp){
		sofar = nextcomponent(sofar, comp)
	})
	return sofar
}

function prepvar(key, context) {
	var key1 = key.replace(/\[([0-9]+)\]/g, function(current, p1) {
		return '.' + p1
	})
	var sofar = ''
	Launch.each(key1.split('.'), function(i, component) {
		sofar = nextcomponent(sofar, component)
		var currentval = undefined
		try {
			currentval = vm.runInNewContext(sofar, context)
		} catch(e) {
		}

		if ( currentval === undefined) {
			vm.runInNewContext('%s = {}'.format(sofar), context)
		}
	})
	return key1
}

function assignvar(key, value, context) {
	var components = key.split('.')
	var last = components.pop()
	var keytolast = joincomponents(components)
	var lastobj = keytolast?vm.runInNewContext(keytolast, context):context
	lastobj[last] = value
}

function myeach(obj, callback, context) {
	for (var i in obj) {
		if (typeof(obj.constructor.prototype[i]) === 'undefined')
			context = callback(i, obj[i], context)
	}	
	return context
}

function normalize(result) {
	var isArray = true
	var arrayResult = []
	myeach(result, function(k, v) {
		if (typeof(v) === 'object') {
			result[k] = normalize(v)
		}
		if (!k.match(/^[0-9]+$/))
			isArray = false
		else
			arrayResult[k] = v
	})
	if (isArray) {
		result = arrayResult
	}

	return JSON.parse(JSON.stringify(result))
}

function parsequery(input) {
	if (!input)
		return null
	var obj = qs.parse(input)
	var result = {}
	Launch.each(obj, function(key, value) {
		try {
			var key1 = prepvar(key, result)
			assignvar(key1, value, result)
		} catch(e) {
			//console.log("Error with key %s: %s".format(key, e.message))
		}
	})

	return normalize(result)
}

exports.parse = parsequery

