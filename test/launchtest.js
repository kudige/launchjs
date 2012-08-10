#!/usr/bin/env node

var Jstest = require('./jstest'),
URL = require('url'),
Util = require('../lib/utils'),
Wrapper = require('../lib/wrapper'),
Emitter = require('events').EventEmitter,
Model = require('../lib/model')

require('../lib/launch')
var Router = require('../lib/router')

var Config1 = {
	appname: 'Test',
	module: {
		path: './data/modules',
		serverScripts: false,
	},
	view: {
	},
	server: {
	},
	model: {
		path: './data/models',
	},
	database: {
		name: '__launchtest__'
	}
}

var Tests = function() {
	Jstest.call(this)
}
Util.inherits(Tests, Jstest)

Tests.prototype.init = function() {
}

// Dummy HTTP request/response module for testing 
function DummyRequest(url) {
	this.url = url
	this.session = {data: 'DUMMY_SESSION_DATA'}
}

function DummyResponse() {
	Emitter.call(this)
}
Util.inherits(DummyResponse, Emitter)

DummyResponse.prototype.writeHead = function(http_code, hdrs) {
	this.http_code = http_code
	this.http_headers = hdrs
	this.emit('headers')
}

DummyResponse.prototype.end = function(text) {
	if (this.text === undefined) {
		this.text = text
		this.emit('end')
	}
}

Tests.prototype.invokeRequest = function(url, postdata, cb) {
	var req = new DummyRequest(url)
	var res = new DummyResponse
	res.on('end', function() {
		cb(res)
	})
	this.router.handleRequest(req, res, postdata)
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

Tests.prototype.initModules = function() {
	var router = this.router = new Router(Config1)
	var modulePath = __dirname+'/data/modules/test1_2'
	router.addModule('test1_2', modulePath)
	router.setDefaultModule('test1_2')
}

// Load module as a package with its own config file and model usage
Tests.prototype.test1_2 = function() {
	var self = this
	if (!this.router)
		this.initModules()
	var router = this.router
	var modulePath = __dirname+'/data/modules/test1_2'
	var moduleDir = __dirname+'/data/modules/test1_2'
	var moduleConfigPath = __dirname+'/data/modules/test1_2/config'
	var modulePathVerify = __dirname+'/data/modules/test1_2/index.js'

	var route = router.routes['test1_2']

	// Verify basic fields
	self.assertEquals('test1_2.route', route !== undefined, true, 'route != undefined') 
	self.assertEquals('test1_2.id', route.id, 'test1_2', 'route.id')
	self.assertEquals('test1_2.modulePath', route.modulePath, modulePathVerify, 'route.modulePath')
	self.assertEquals('test1_2.moduleDir', route.moduleDir, moduleDir, 'route.moduleDir')
	self.assertEquals('test1_2.moduleConfigPath', route.configPath, moduleConfigPath, 'route.configPath')

	// Verify defaultRoute
	self.assertEquals('test1_2.defaultRoute', router.routes.defaultRoute, router.routes.test1_2, 'route.defaultRoute')

	// Verify config fields
	self.assertEquals('test1_2.moduleConfig[1]', route.config.var1, 'value1', 'route.config.var1')
	self.assertEquals('test1_2.moduleConfig[2]', route.config.var2.field1, 'number1', 'route.config.var2.field1')
	self.assertEquals('test1_2.moduleConfig[3]', route.config.var2.field2, 'number2', 'route.config.var2.field2')

	// Verify models
	self.assertEquals('test1_2.model[1]', route.Model1._isModel(), true, 'route.Model1._isModel()')
	// NOTE: Ignore runtime error loading model file
	self.assertEquals('test1_2.model[2]', route.Model2._isModel(), true, 'route.Model2._isModel()')
	self.assertEquals('test1_2.model[3]', route.CamelCase1._isModel(), true, 'route.CamelCase._isModel()')

	// Verify invocation of the module
	var url = new URL.parse('http://localhost/test1_2/func1/param1/param2')
	var route = router.resolve(url)
	self.assertEquals('test1_2.resolve[1]', route.moduleName, 'test1_2')
	self.assertEquals('test1_2.resolve[2]', route.action,     'func1')
	self.assertEquals('test1_2.resolve[3]', route.module.modulePath, modulePathVerify)
	self.assertEquals('test1_2.resolve[4]', route.moduleName, 'test1_2')
	self.assertEquals('test1_2.resolve[5]', route.urlComponents.length, 2)
	self.assertEquals('test1_2.resolve[6]', route.urlComponents[0], 'param1')
	self.assertEquals('test1_2.resolve[7]', route.urlComponents[1], 'param2')

	// Verify invocation via default route
	var url = new URL.parse('http://localhost/')
	var route = router.resolve(url)
	self.assertEquals('test1_2.defaultRoute1[1]', route.moduleName, 'test1_2')
	self.assertEquals('test1_2.defaultRoute1[2]', route.action,     'index')
	self.assertEquals('test1_2.defaultRoute1[3]', route.module.modulePath, modulePathVerify)
	self.assertEquals('test1_2.defaultRoute1[4]', route.moduleName, 'test1_2')
	self.assertEquals('test1_2.defaultRoute1[5]', route.urlComponents.length, 0)

	// Verify invocation via default route with action and params
	var url = new URL.parse('http://dummyhost/func1/param1/param2')
	var route = router.resolve(url)
	self.assertEquals('test1_2.defaultRoute2[1]', route.moduleName, 'test1_2')
	self.assertEquals('test1_2.defaultRoute2[2]', route.action,     'func1')
	self.assertEquals('test1_2.defaultRoute2[3]', route.module.modulePath, modulePathVerify)
	self.assertEquals('test1_2.defaultRoute2[4]', route.moduleName, 'test1_2')
	self.assertEquals('test1_2.defaultRoute2[5]', route.urlComponents.length, 2)
	self.assertEquals('test1_2.defaultRoute2[6]', route.urlComponents[0], 'param1')
	self.assertEquals('test1_2.defaultRoute2[7]', route.urlComponents[1], 'param2')

	// Verify a complete end to end request
	this.invokeRequest('http://dummyhost/test1_2/method1/a/b', '', function(res) {
		self.assertEquals('test1_2.invocation[1]', res.text, 'ab')
		self.assertEquals('test1_2.invocation[2]', res.http_code, 200)
		self.assertEquals('test1_2.invocation[3]', res.http_headers['Content-Type'], 'text/html')
		self.next()
	})
}

// Test template extensions
Tests.prototype.test1_3 = function() {
	var self = this
	if (!this.router)
		this.initModules()
	var router = this.router
	// Verify template extension works for this module
	var input = "Simple macro {test1_2:thing2}{test1_2:thing1} filter {=var1|test1_2:pad}{/test1_2:thing2} {include name=test1_2:minime}"
	var verify = "Simple macro <<Thing1 filter XXXpadmeXXX>> MINIME\n"
	router.template.applyTemplate(input, {var1: 'padme'}).on('ready', function(output) {
		self.assertEquals('test1_2.template[1]', output, verify)
		self.next()
	})
}

// Test delayed output, mime override
Tests.prototype.test1_4 = function() {
	var self = this
	if (!this.router)
		this.initModules()
	this.invokeRequest('http://dummyhost/test1_2/method2/500/2000', '', function(res) {
		self.assertEquals('test1_4.invocation[1]', res.text, '2500')
		self.assertEquals('test1_4.invocation[2]', res.http_code, 200)
		self.assertEquals('test1_4.invocation[3]', res.http_headers['Content-Type'], 'text/plain')
		self.next()
	})
}

// Test view rendering, default mime
Tests.prototype.test1_5 = function() {
	var self = this
	if (!this.router)
		this.initModules()
	this.invokeRequest('http://dummyhost/test1_2/method3/500/2000', '', function(res) {
		self.assertEquals('test1_5.invocation[1]', res.text, 'Here is the answer: 500 + 2000 = 2500\n')
		self.assertEquals('test1_5.invocation[2]', res.http_code, 200)
		self.assertEquals('test1_5.invocation[3]', res.http_headers['Content-Type'], 'text/html')
		self.next()
	})
}

// Test view rendering, set vars, mime by extension
Tests.prototype.test1_6 = function() {
	var self = this
	if (!this.router)
		this.initModules()
	this.invokeRequest('http://dummyhost/test1_2/method4/256/1024', '', function(res) {
		self.assertEquals('test1_6.invocation[1]', res.text, 'Result: 256 + 1024 = 1280\n')
		self.assertEquals('test1_6.invocation[2]', res.http_code, 200)
		self.assertEquals('test1_6.invocation[3]', res.http_headers['Content-Type'], 'text/plain')
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
