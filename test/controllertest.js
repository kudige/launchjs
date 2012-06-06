#!/usr/bin/env node

var Jstest = require('./jstest'),
Util = require('../lib/utils')

/* --------------- TEST ROUTINES ------------------- */

var Tests = function() {
	Jstest.call(this)
}
Util.inherits(Tests, Jstest)

Tests.prototype.init = function() {
	Jstest.prototype.init.call(this)
	var self = this
	self.assertEquals('init', 2+2, 4)
}

Tests.prototype.test1 = function() {
	var self = this
	var controller = new Controller;
	
	self.next()
}

Tests.prototype.test2 = function() {
	var self = this
	self.assertEquals('test2', 4+4, 8)
	self.next()
}


// Add pending objects to one-to-many relation of a waiting object

Tests.prototype.finish =  function() {
	Jstest.prototype.finish.call(this)
	console.log('All finished')
	process.exit(0)
}

var set = undefined
if (process.argv[2] == '-i') {
	set = 'testinit'
}

process.argv.shift()
process.argv.shift()

var tests = new Tests()
tests.showPass = true
tests.start(process.argv)
