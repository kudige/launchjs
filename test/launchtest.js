#!/usr/bin/env node

var Jstest = require('./jstest'),
Util = require('../lib/utils'),
Wrapper = require('../lib/wrapper'),
Model = require('../lib/model')

require('../lib/launch')
var Router = require('../lib/router')

var Config1 = {
	appname: 'Test',
	module: {
		path: './data/modules',
	},
	view: {
	},
	server: {
	},
	model: {
		path: './data/models',
	},
	database: {
	}
}

var Tests = function() {
	Jstest.call(this)
}
Util.inherits(Tests, Jstest)

Tests.prototype.init = function() {
}

/* --------------- BEGIN TEST ROUTINES ------------------- */

Tests.prototype.test1_1 = function() {
	// Loading a vanilla module with no frills
	var self = this
	var router = new Router(Config1)
	var modulePath = __dirname+'/data/modules/test1_1'
	var modulePathVerify = __dirname+'/data/modules/test1_1.js'
	var moduleDir = __dirname+'/data/modules'
	var moduleConfigPath = __dirname+'/data/modules/config'

	console.log(modulePath)
	router.addModule('test1_1', modulePath)
	var route = router.routes['test1_1']

	self.assertEquals('test1_1.route', route !== undefined, true, 'route != undefined') 
	self.assertEquals('test1_1.id', route.id, 'test1_1', 'route.id')
	self.assertEquals('test1_1.modulePath', route.modulePath, modulePathVerify, 'route.modulePath')
	self.assertEquals('test1_1.moduleDir', route.moduleDir, moduleDir, 'route.moduleDir')
	self.assertEquals('test1_1.moduleConfigPath', route.configPath, moduleConfigPath, 'route.configPath')
	self.next()
}

Tests.prototype.test1_2 = function() {
	// Load module as a package with its own config file and model usage
	var self = this
	var router = new Router(Config1)
	var modulePath = __dirname+'/data/modules/test1_2'
	var moduleDir = __dirname+'/data/modules/test1_2'
	var moduleConfigPath = __dirname+'/data/modules/test1_2/config'
	var modulePathVerify = __dirname+'/data/modules/test1_2/index.js'

	console.log(modulePath)
	router.addModule('test1_2', modulePath)
	var route = router.routes['test1_2']

	// Verify basic fields
	self.assertEquals('test1_2.route', route !== undefined, true, 'route != undefined') 
	self.assertEquals('test1_2.id', route.id, 'test1_2', 'route.id')
	self.assertEquals('test1_2.modulePath', route.modulePath, modulePathVerify, 'route.modulePath')
	self.assertEquals('test1_2.moduleDir', route.moduleDir, moduleDir, 'route.moduleDir')
	self.assertEquals('test1_2.moduleConfigPath', route.configPath, moduleConfigPath, 'route.configPath')

	// Verify config fields
	self.assertEquals('test1_2.moduleConfig.1', route.config.var1, 'value1', 'route.config.var1')
	self.assertEquals('test1_2.moduleConfig.2', route.config.var2.field1, 'number1', 'route.config.var2.field1')
	self.assertEquals('test1_2.moduleConfig.3', route.config.var2.field2, 'number2', 'route.config.var2.field2')

	// Verify models
	self.assertEquals('test1_2.model.1', route.Model1._isModel(), true, 'route.Model1._isModel()')
	// NOTE: Ignore runtime error loading model file
	self.assertEquals('test1_2.model.2', route.Model2._isModel(), true, 'route.Model2._isModel()')
	self.assertEquals('test1_2.model.3', route.CamelCase1._isModel(), true, 'route.CamelCase._isModel()')

	// Verify template extension works for this module
	var input = "Simple macro {test1_2:thing2}{test1_2:thing1} filter {=var1|test1_2:pad}{/test1_2:thing2} {include name=test1_2:minime}"
	var verify = "Simple macro <<Thing1 filter XXXpadmeXXX>> MINIME\n"
	router.template.applyTemplate(input, {var1: 'padme'}).on('ready', function(output) {
		self.assertEquals('test1_2.template.1', output, verify)
		self.next()
	})
}


/* --------------- END TEST ROUTINES ------------------- */

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
Model.enableDebug('api')
Model.disableDebug()

var tests = new Tests()
//tests.showPass = true
tests.start(process.argv)
