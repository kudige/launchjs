var URL = require('url'),
FS = require('fs'),
Path = require('path'),
Template = require('transformer'),
Context = require('./context'),
HttpIO = require('./http_io'),
Helpers = require('./helpers')

var requests = []

// The Great Router
var Router = function(config) {
	root.Config   = config
	this.modules  = {}
	this.routes   = {}
	this.widgets  = {}
	this.controllersPath = config.module.path || '../'
	this.template = new Template
	this.template.enableExtension('html','')
	this.template.addExtension(new Helpers.TemplateHelper,'')
	this.addModule('assets', __dirname + '/assets')
}

Router.prototype.addModule = function(name, fullpath) {
	var modpath = fullpath ||Path.resolve(this.controllersPath, name)
	var self = this
	function loadModule(fullpath) {
		var launchModule = require(fullpath)
		if (launchModule instanceof Controller) {
			self.routes[launchModule.id] = launchModule
		}
		if (self.routes.defaultRoute && self.routes.defaultRoute.id === launchModule.id)
			self.routes.defaultRoute = launchModule
		return launchModule
	}
	var launchModule = loadModule(modpath)

	if (Config.module.autoreload) {
		FS.watchFile(modpath, function() {
			console.log('reloading ' + launchModule.id)
			uncacheModule(launchModule)
			launchModule = loadModule(modpath)
		})
	}

	this.template.addExtension(launchModule, launchModule.id.singularize())
	this.template.include(Path.resolve(launchModule._viewpath(), 'elements'), launchModule.id.singularize())
	return launchModule
}

Router.prototype.addWidget = function(name, fullpath) {
	var widgetpath = fullpath
	var self = this
	function loadWidget(fullpath) {
		var launchWidget = require(fullpath)
		return launchWidget
	}
	var launchWidget = loadWidget(widgetpath)

	if (Config.widget.autoreload) {
		FS.watchFile(modpath, function() {
			console.log('reloading ' + launchWidget.id)
			uncacheModule(launchWidget)
			launchWidget = loadWidget(widgetpath)
		})
	}
	var widgetPath = launchWidget.id + ':list'
	self.widgets[launchWidget.id] = launchWidget
	return launchWidget
}

Router.prototype.setDefaultModule = function(modname) {
	if (this.routes[modname])
		this.routes.defaultRoute = this.routes[modname]
}

Router.prototype.resolve = function(url) {
	// things we need to detect from url
	var components = url.pathname.split('/')
	var module_name = undefined
	var module = undefined
	var action = undefined

	// See if any module can handle this request as a special case
	for (var mod in this.routes) {
		if (typeof(this.routes[mod].canHandle) === 'function') {
			var handler = this.routes[mod].canHandle(url.pathname)
			if (handler) {
				// We found a special case handler
				module_name = mod
				action = handler
				module = this.routes[mod]
			}
		}
	}

	// If not, use the controller approach (/controller/action/...)
	if (!module_name || !action) {
		components.shift()
		module_name = components.shift()
		if (!module_name)
			module_name = 'defaultRoute'

		action = components.shift()
		if (!action)
			action = 'index'
		module = this.routes[module_name]
	}

	// If we still didn't find it, try default using controller (/action/...)
	if (!module) {
		components = url.pathname.split('/')
		components.shift()
		module_name = 'defaultRoute'
		action = components.shift()
		if (!action)
			action = 'index'
		module = this.routes[module_name]
	}

	if (module) {
		return {
			module: module,
			moduleName: module_name,
			urlComponents: components,
			action: action
		}
	}
	return null
}

Router.prototype.handleRequest = function(req, res, postdata) {
	var url = URL.parse(req.url, true)

	// Resolve the route to a controller
	var routeInfo = this.resolve(url)

	if (!routeInfo) {
		// Couldn't find a controller to handle the request
		res.writeHead(404, 'Not found')
		res.end('Module not found')
		return
	}

	var module = routeInfo.module
	var module_name = routeInfo.moduleName
	var components = routeInfo.urlComponents
	var action = routeInfo.action


	// module = module handling the request
	// route  = action function
	var request = new Context()
	request.init(module, new HttpIO(req, res), url, postdata, module_name, this.template)
	request.addWidgets(this.widgets)
	request.invoke(action, components)
}

Router.prototype.autoloadModules = function() {
	var possibleModules = FS.readdirSync(Config.module.path)
	for (var i=0; i<possibleModules.length; i++) {
		try {
		    this.addModule(possibleModules[i])
			console.log('module '+possibleModules[i] +' loaded')
		} catch(e) {
			console.log("Module " + possibleModules[i] + " error " + e.message)
		}
	}

}

Router.prototype.autoloadWidgets = function() {
	var possibleWidgets = FS.readdirSync(Config.widget.path)
	for (var i=0; i<possibleWidgets.length; i++) {
//		try {
		    this.addWidget(possibleWidgets[i], Path.resolve(Config.widget.path, possibleWidgets[i]))
			console.log('Widget '+possibleWidgets[i] +' loaded')
//		} catch(e) {
//			console.log("Widget " + possibleWidgets[i] + " error " + e.message)
//		}
	}

}

module.exports = Router