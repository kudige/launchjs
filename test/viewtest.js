#!/usr/bin/env node

var Jstest = require('./jstest'),
Util = require('util'),
View = require('../view'),
FS = require('fs'),
Transformer = require('transformer')

//View.debug.enable()

var Tests = function() {
	Jstest.call(this)
}
Util.inherits(Tests, Jstest)

Tests.prototype.init = function() {
	Jstest.prototype.init.call(this)
}

Tests.prototype.finish = function() {
	console.log("All finished")
	Jstest.prototype.finish.call(this)
}

/* ----------- Test Stub : Dummy template ------------- */
var DummyTemplate = function() {
}

DummyTemplate.prototype.applyTemplate = function(data, vars, directivs, callback) {
	setTimeout(function() {
		for (var k in vars) {
			data = data.replace(sprintf('{%s}', k), ''+vars[k])
		}
		callback(data)
	}, 100)
}

/* ----------- Test Stub : Dummy PlaceHolder ------------- */
var Emitter = require('events').EventEmitter
var PlaceHolder = function() {
	Emitter.call(this)
}
Util.inherits(PlaceHolder, Emitter)

PlaceHolder.prototype.onReady = function(callback) {
	this.on('ready', callback)
	return this
}

PlaceHolder.prototype.onError = function(callback) {
	this.on('err', callback)
	return this
}

PlaceHolder.prototype.setValue = function(value) {
	this.emit('ready', value)
}

PlaceHolder.prototype.setError = function(message) {
	this.emit('err', message)
}

/* --------------- view var tests --------------- */

// Simple rendering
Tests.prototype.testvar1 = function() {
	var self = this
	var view = new View(new DummyTemplate)
	view.set('a', 'A')
	view.set('b', 'B')
	view.set('a', 'C')
	view.on('render', function(text) {
		self.assertEquals('testvar1', text, 'abcd C B {c}')
		self.next()
	}).render('abcd {a} {b} {c}')
}

// Rendering of a placeholder
Tests.prototype.testvar2 = function() {
	var self = this
	var view = new View()
	var V3 = new PlaceHolder
	view.set('var1', 'V1')
	view.set('var2', 'V2')
	view.set('var3', V3)

	view.on('render', function(text) {
		self.assertEquals('testvar2', text, 'abcd V1 V2 DynamicV3', 'rendered text')
		self.next()
	}).render('abcd {$var1} {$var2} {$var3}')
	
	setTimeout(function() {
		V3.setValue('DynamicV3')
	}, 100)
}

// Rendering of multiple placeholder
Tests.prototype.testvar3 = function() {
	var self = this
	var view = new View()
	var V1 = new PlaceHolder
	var V2 = new PlaceHolder
	var V3 = new PlaceHolder
	view.set('var1', V1)
	view.set('var2', V2)
	view.set('var3', V3)

	view.on('render', function(text) {
		self.assertEquals('testvar2', text, 'abcd DynamicV1 DynamicV2 DynamicV3', 'rendered text')
		self.next()
	}).render('abcd {$var1} {$var2} {$var3}')
	
	setTimeout(function() {
		V1.setValue('DynamicV1')
	}, 100)

	setTimeout(function() {
		V2.setValue('DynamicV2')
	}, 200)

	setTimeout(function() {
		V3.setValue('DynamicV3')
	}, 300)

}

// Rendering multiple iteration placeholder
Tests.prototype.testvar4 = function() {
	var self = this
	var view = new View()
	var V1 = new PlaceHolder
	var V2 = new PlaceHolder
	view.set('var1', V1)
	view.set('var2', 'V2')

	view.on('render', function(text) {
		self.assertEquals('testvar4', text, 'abcd Double Dynamic V1 V2 xyz', 'rendered text')
		self.next()
	}).render('abcd {$var1} {$var2} xyz')
	
	setTimeout(function() {
		V1.setValue(V2)
		setTimeout(function() {
			V2.setValue('Double Dynamic V1')
		}, 100)
	}, 100)
}

// Rendering subfields
Tests.prototype.testvar5 = function() {	
	var self = this
	var view = new View()
	view.set('var1', {field1: 'V1_F1',
					field2: 'V1_F2',
					field3: {subfield1: "V1_F3_S1",
							 subfield2: "V1_F3_S1"}})

	view.set('var2', 'V2')

	var input = "Some data {$var1.field1} and {$var2} with {unchanged} some {$var1.field3.subfield1} with unmatched {$var3} with unmatched {$var3.xyz}"
	var verify = "Some data V1_F1 and V2 with {unchanged} some V1_F3_S1 with unmatched  with unmatched "
	view.on('render', function(output) {
		self.assertEquals('testvar5', output, verify, 'output', 'verify')
		self.next()
	}).render(input)
}

// Rendering array subscripts & function calls
Tests.prototype.testvar6 = function() {
	var self = this
	var self = this
	var view = new View()
	view.set('var1', {field1: ['V1_F1_1', {name: 'V1_F1_name'}, 'V1_F1_3'],
					field2: 'V1_F2',
					field3: {subfield1: "V1_F3_S1",
							 subfield2: "V1_F3_S1"}})
	view.set('var2', function(){return "Hurray"})

	var input = "Some data {$var1.field1[2]} and {$var2()} with  some {$var1.field1[1].name} with unmatched {$var3} with unmatched {$var3.xyz}"
	var verify = "Some data V1_F1_3 and Hurray with  some V1_F1_name with unmatched  with unmatched "
	view.on('render', function(output) {
		self.assertEquals('testvar5', output, verify, 'output', 'verify')
		self.next()
	}).render(input)
}

// Render simple macro
Tests.prototype.testvar7 = function() {
	var self = this
	var transformer = new Transformer
	transformer.addMacro('simple_macro0', function() {
		return 'SIMPLE'
	})
	var view = new View(transformer)
	view.set('var1', 'VAR1')
	view.set('var2', {field1: 'VAR2_F1'})
	var input  = "This substitutes macro {simple_macro0} along with variable {$var1} and {$var2.field1}"
	var verify = "This substitutes macro SIMPLE along with variable VAR1 and VAR2_F1"
	view.on('render', function(output) {
		self.assertEquals('testvar7', output, verify, 'output', 'verify')
		self.next()
	}).render(input)
}

// Render simple macro with params
Tests.prototype.testvar8 = function() {
	var self = this
	var transformer = new Transformer
	transformer.addMacro('simple_macro0', function(contex) {
		return contex.params.a + "::" + contex.params.b
	})
	var view = new View(transformer)
	view.set('var1', 'VAR1')
	view.set('var2', {field1: 'VAR2_F1'})
	var input  = "This substitutes macro {simple_macro0 a=123 b='Hello there'} along with variable {$var1} and {$var2.field1}"
	var verify = "This substitutes macro 123::Hello there along with variable VAR1 and VAR2_F1"
	view.on('render', function(output) {
		self.assertEquals('testvar8', output, verify, 'output', 'verify')
		self.next()
	}).render(input)
}

// Render simple macro with params using viewvars
Tests.prototype.testvar9 = function() {
	var self = this
	var transformer = new Transformer
	transformer.addMacro('simple_macro0', function(context) {
		return context.params.a + "::" + context.params.b + '::' + context.params.c
	})
	var view = new View(transformer)
	view.set('var1', 'VAR1')
	view.set('var2', {field1: 'VAR2_F1'})
	var input  = "This substitutes macro {simple_macro0 a=`var1` b=`var2.field1` c=`var3.field3.xyz`} along with variable {$var1} and {=var2.field1}"
	var verify = "This substitutes macro VAR1::VAR2_F1:: along with variable VAR1 and VAR2_F1"
	view.on('render', function(output) {
		self.assertEquals('testvar9', output, verify, 'output', 'verify')
		self.next()
	}).render(input)
}

// Rendering templated content
Tests.prototype.test_template = function() {
	var self = this
	var transformer = new Transformer
	transformer.addMacro('simple_macro0', function(context) {
		return context.params.a + "::" + context.params.b + '::' + context.params.c
	})
	var view = new View(transformer)
	
	view.set('var1', 'VAR1')
	view.set('var2', {field1: 'VAR2_F1'})
	var template = "template content is: {=template_content}"
	var input  = "This substitutes macro {simple_macro0 a=`var1` b=`var2.field1` c=`var3.field3.xyz`} along with variable {$var1} and {=var2.field1}"
	var verify = "template content is: This substitutes macro VAR1::VAR2_F1:: along with variable VAR1 and VAR2_F1"
	view.on('render', function(output) {
		self.assertEquals('testvar9', output, verify, 'output', 'verify')
		self.next()
	}).render(input, template)
}

/* -----------bootstrapping the testcases --------*/
process.argv.shift()
process.argv.shift()
var tests = new Tests()
tests.showPass = true
tests.start(process.argv)

if (!tests.finished)
	sleepUntil(tests, 'finish')

