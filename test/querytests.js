#!/usr/bin/env node
var Jstest = require('./jstest'),
    querystring = require('querystring'),
    queryobject = require('../query')

var Tests = function() {
	Jstest.call(this)
}
Util.inherits(Tests, Jstest)

Tests.prototype.init = function() {
	Jstest.prototype.init.call(this)
}

Tests.prototype.finish = function() {
	console.log("Object query tests finished")
	Jstest.prototype.finish.call(this)
}

/* --------------- start test cases --------------- */

Tests.prototype.test1 = function() {
	var input = {'var1' : "VALUE1"}
	var result = queryobject.parse(querystring.stringify(input))
	this.assertEquals('test1', result.ownkeys().length, 1, 'result.length')
	this.assertEquals('test1', result.var1, "VALUE1", 'result.var1')

	input['var2'] = "VALUE, HELLO! &^%$"
	result = queryobject.parse(querystring.stringify(input))
	this.assertEquals('test1.static', result.ownkeys().length, 2, 'result.length')
	this.assertEquals('test1.static', result.var1, input.var1, 'result.var1')
	this.assertEquals('test1.static', result.var2, input.var2, 'result.var2')

	input['var3.field1'] = 'FIELD1'
	input['var3.field2[0]'] = '120'
	input['var3.field2[4]'] = '240'

	result = queryobject.parse(querystring.stringify(input))
	this.assertEquals('test1.subfields', result.var3.field1, input['var3.field1'], "result.var3.field1")
	this.assertEquals('test1.array', result.var3.field2[0], input['var3.field2[0]'], "result.var3.field2[0]")
	this.assertEquals('test1.array', result.var3.field2[1], input['var3.field2[1]'], "result.var3.field2[1]")
	this.assertEquals('test1.array', result.var3.field2.length, 5, "result.var3.field2.length")

	this.next()
}

/* -----------bootstrapping the testcases --------*/
process.argv.shift()
process.argv.shift()
//Transformer.debug.enable('info')
var tests = new Tests()
//tests.showPass = true
tests.start(process.argv)

if (!tests.finished)
	sleepUntil(tests, 'finish')
