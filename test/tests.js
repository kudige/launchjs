#!/usr/bin/env node

var Jstest = require('./jstest'),
Util = require('../lib/utils'),
Inflector = require('../lib/inflector')


var Tests = function() {
	Jstest.call(this)
}
Util.inherits(Tests, Jstest)

Tests.prototype.init = function() {
	Jstest.prototype.init.call(this)
}

/* Inflector */
Tests.prototype.test_inflector1 = function() {
	this.assertEquals('inflector1.1', typeof(''.pluralize), 'function', 'String.pluralize')
	this.assertEquals('inflector1.2', typeof(''.singularize), 'function', 'String.singularize')
	this.assertEquals('inflector1.3', typeof(Inflector.ordinalize), 'function', 'Inflector.ordinalize')
	this.next()
}

Tests.prototype.test_inflector2 = function() {
	this.assertEquals('pluralize1.1', 'user'.pluralize(),'users')
	this.assertEquals('pluralize1.2', 'User'.pluralize(),'Users')
	this.assertEquals('pluralize1.3', 'quiz'.pluralize(1021),'1021 quizzes')
	this.assertEquals('pluralize1.4', 'shoe'.pluralize(),'shoes')
	this.assertEquals('pluralize1.5', 'match'.pluralize(4),'4 matches')
	this.assertEquals('pluralize1.6', 'order'.pluralize(),'orders')
	this.assertEquals('pluralize1.7', 'sheep'.pluralize(),'sheep')

	this.assertEquals('singularize1.1', 'users'.singularize(),'user')
	this.assertEquals('singularize1.2', 'Users'.singularize(),'User')
	this.assertEquals('singularize1.3', 'quizzes'.singularize(),'quiz')
	this.assertEquals('singularize1.4', 'shoes'.singularize(),'shoe')
	this.assertEquals('singularize1.5', 'matches'.singularize(),'match')
	this.assertEquals('singularize1.6', 'orders'.singularize(),'order')
	this.assertEquals('singularize1.7', 'sheep'.singularize(),'sheep')

	this.assertEquals('ordinal1.1', (new Number(9)).ordinalize(),'9th')
	this.assertEquals('ordinal1.1', (new Number(103)).ordinalize(),'103rd')
	this.assertEquals('ordinal1.1', (new Number(42)).ordinalize(),'42nd')
	this.assertEquals('ordinal1.1', (new Number(1001)).ordinalize(),'1001st')
	
	this.next()
}


Tests.prototype.finish =  function() {
	Jstest.prototype.finish.call(this)
	console.log('All finished')
	process.exit(0)
}

process.argv.shift()
process.argv.shift()
var tests = new Tests()
//tests.showPass = true
tests.start(process.argv)
