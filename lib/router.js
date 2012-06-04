var URL = require('url'),
FS = require('fs'),
Path = require('path'),
Template = require('transformer'),
Context = require('./context'),
Helpers = require('./helpers')

var requests = []

// The Great Router
var Router = function(config) {
	root.Config = config
	this.modules = {}
	this.routes  = {}
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

	if (!Config.module.no_autoreload) {
		FS.watchFile(modpath, function() {
			console.log('reloading ' + launchModule.id)
			uncacheModule(launchModule)
			launchModule = loadModule(modpath)
		})
	}

	this.template.addExtension(launchModule, launchModule.id)
	this.template.include(Path.resolve(launchModule._viewpath(), 'elements'), launchModule.id.singularize())
	return launchModule
}

Router.prototype.setDefaultModule = function(modname) {
	if (this.routes[modname])
		this.routes.defaultRoute = this.routes[modname]
}

Router.prototype.handleRequest = function(req, res, postdata) {
	var url = URL.parse(req.url, true)
	var components = url.pathname.split('/')

	// things we need to detect from url
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

	if (!module) {
		// Couldn't find a controller to handle the request
		res.writeHead(404, 'Not found')
		res.end('Module not found')
		return
	}

	// We have found the controller, find the action to call
	var route = module[action]
	if (!route)
		route = module.defaultRoute

	// module = module handling the request
	// route  = action function
	if (route) {
		var fn = route
		var request = new Context()
		request.init(module, req, res, action, url, postdata, module_name, this.template)
		
		var decodedComponents = []
		for (var i=0; i<components.length; i++) {
			decodedComponents.push(decodeURIComponent(components[i]))
		}
		request._preAction(action)
		var response = fn.apply(request, decodedComponents)

		request._postAction(action, response)
		if (response === module.WAIT ||
			response === module.DONE) {
			// The action is an async response OR action has already responded, just return
			return
		}

		if (typeof(response) === 'undefined') {
			// action wants to send the default view
			try {
				return module.sendView(request, request.action, request.mime)
			} catch(e) {
				res.writeHead(200, {'Content-Type': 'text/html'})
				res.end('Page error: ' + e.message)
				return
			}
		}
		
		// action returned the response to send
		var mime = module.content_type
		var http_code = 200
		if (response.http_code)
			http_code = response.http_code
		if (response.content_type) {
			mime = response.content_type
			response = response.data
		}
		res.writeHead(http_code, {'Content-Type': mime})
		res.end(response)
	} else {
		res.writeHead(404, 'Not found')
		res.end('Page not found')
	}
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

module.exports = Router