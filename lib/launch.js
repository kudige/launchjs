var Path = require('path'),
utils = require('../lib/utils'),
Session = require('../dep/sesh').magicSession(),
DbPipe = require('../lib/dbpipe'),
mymod = require('module')
require('./inflector')

var Router = require('./router')
require('./controller')

// Wrapper for launch modules to export
root.LaunchExport = function(mod, obj) {
	mod.exports = obj
}

root.uncacheModule = function(mod) {
	var modcache = findModule(mod)
	for (var i=0; i<modcache.children.length; i++) {
		mymod._cache[modcache.children[i].id] = undefined
	}
	mymod._cache[modcache.id] = undefined
}

root.View = require('./view')
var Model = require('./model')

root.findModule = function(mod) {
	for (var p in mymod._cache) {
		if (mymod._cache[p].exports === mod)
			return mymod._cache[p]
	}
}

function resolvePath(path) {
	path = path || ''
	if (path.match(/^\//))
		return path

	return Path.resolve(Config.rootPath, path)
}

function processConfig(config) {
	config.rootPath = root.RootPath
	config.webroot = resolvePath(config.webroot || 'webroot')
	config.module  = config.module || {}
	config.widget  = config.widget || {}
	config.module.path  = resolvePath(config.module.path || 'modules')
	config.widget.path  = resolvePath(config.widget.path || 'widgets')
	config.commonPath   = resolvePath(config.commonPath || 'common')
	config.view         = config.view || {}
	config.model        = config.model || {}
	config.view.path    = resolvePath(config.view.path || 'views')
	config.view.app_template    = resolvePath(config.view.app_template || 'views/app.html')
	config.model.path    = resolvePath(config.model.path || 'models')
	if (!config.features)
		config.features = {}
	//require.paths.unshift(config.commonPath)
}

/* Convenient function to launch the server with default settings */
exports.launch = function(rootpath, setupOnly) {
	root.RootPath = rootpath || Path.dirname(module.parent.filename) + '/'
	var configPath =  Path.resolve(RootPath, 'config')
	var Config = require(configPath)
	root.Config = Config
	processConfig(Config)

	if (!setupOnly) {
		var Port = Config.server.port,
		HTTP = require('http'),
		router = new Router(Config)

		if (Config.module.autoload) 
			router.autoloadModules()
		if (Config.widget.autoload) 
			router.autoloadWidgets()

		router.setDefaultModule(Config.module.defaultModule || 'main')
		// Main server
		var server = HTTP.createServer(function (req, res) {
//			try {
				if (req.method === 'POST') {
					var data = "";
					req.on("data", function(chunk) {
						data += chunk;	})
						.on("end", function() {
							router.handleRequest(req, res, data);
						});
				} else {
					router.handleRequest(req, res);
				}
/*			} catch(e) {
				res.writeHead('Context-Type', 'text/html')
				res.end('There was an error with that request: ' + e.message)
				console.log(e.stack)
			}
*/
		})
		server.listen(Port)
		console.log('Server running at http://127.0.0.1:' + Port + '/');
	}
}

exports.Router = Router
//exports.DbPipe = DbPipe
