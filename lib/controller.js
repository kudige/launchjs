var Path = require('path'),
//Template = require('./template.js'),
Mime = require('mime'),
FS = require('fs'),
Scripts = require('./scripts'),
Model = require('./model'),
modelCache = require('./model_cache'),
Wrapper = require('./wrapper'),
Util = require('./utils')

function detectModuleName(modulePath) {
	var basename = Path.basename(modulePath, Path.extname(modulePath))
	if (basename === 'index')
		return Path.basename(Path.dirname(modulePath))
	return basename
}

/*
 * Base class for controllers.
 */
var Controller = function(modulePath, nodeModule) {
	this.modulePath = modulePath
	this.moduleDir = Path.dirname(modulePath)
	this.configPath = this.moduleDir + '/config'
	this._modeluses = {}

	// Load default configuration
	try {
		this.config = require(this.configPath)
		var configNodeModule = findModule(this.config)
		configNodeModule.parent = nodeModule
		nodeModule.children.push(configNodeModule)
	} catch(e) {
		this.config = {}
	}
	this.id = this.config.name || detectModuleName(modulePath)

	if (typeof(AssetManager) != 'undefined')
		AssetManager._connectAsset('/'+this.id, this._assetpath())

	// Some magic tokens 
	this.WAIT = 'WAIT_TOKEN_MAGIC_497'
	this.DONE = 'WAIT_TOKEN_MAGIC_498'
	this._init()
}

Controller.prototype._uses = function() {
	var self = this
	var args = arguments
	if (args.length === 1 && Array.isArray(args[0]))
		args = args[0]
	Launch.each(args, function(i, name) {
		if (name.match(/^(.+):(.+)/)) {
			i = RegExp.$1
			name = RegExp.$2
		}
		var key = name
		if (i.match(/^[0-9]+$/))
			name = name.toLowerCase()
		else
			key = i

		self._modeluses[key] = name
		self.__defineGetter__(key, function() {
			return self._modelHelper(key)
		})
	})
	return this
}

Controller.prototype._modelHelper = function(key) {
	return Model.model(key, this._modeluses[key])
}

Controller.prototype._viewpath = function() {
	return Path.resolve(Config.view.path, this.id)
}

Controller.prototype._templatePath = function() {
	var path = (this.config.template)?(this.moduleDir + '/' + this.config.template):root.Config.view.app_template
	if (path)
		return Path.normalize(path)
}

Controller.prototype._init = function() {
}

Controller.prototype._assetpath = function() {
	return Path.normalize(this.moduleDir + '/' + (this.config.assets || 'assets') + '/')
}

Controller.prototype._findview = function(basepath) {
	for (var mimetype in Mime.types) {
		try {
			if (FS.statSync(basepath + '.' + mimetype)) {
				return {file: basepath + '.' + mimetype, mime: Mime.types[mimetype]}
			}
		} catch(e) {
		}
	}
}

Controller.prototype._formfields = function(model_fields, action, unique_field) {
	var self = this
	var formfields = []
	Launch.each(model_fields, function(i, name) {
		var fieldinfo = {name: self.id.singularize() + '.' + name}
		if (action === 'edit' && name === unique_field)
			fieldinfo.type = 'hidden'
		
		formfields.push(fieldinfo)
	})
	return formfields
}

Controller.prototype.sendView = function(context, view, mime) {
	var self = this
	view = view || context.action
	var viewpath = Path.resolve(this._viewpath(), view)
	var viewinfo = this._findview(viewpath)
	if (!viewinfo) {
		context.io.mime('text/html')
		context.io.text('Page view not found')
		return
	}
	var mime = mime || viewinfo.mime
	var template_path = this._templatePath()
	var template_data = (template_path)?ReadFileCached(template_path):null
	var template_options = {namespace: self.id}
	FS.readFile(viewinfo.file, function (err, data) {
		if (err) {
			context.io.mime('text/html')
			context.io.text('Page view not found') // TODO - error pages
		} else {
			context.io.mime(mime)
			if (mime === 'text/html') {
				context.view.on('render', function(text) {
					if (Config.module.serverScripts === undefined || Config.serverScripts) {
						console.log("Processing scripts ...")
						Scripts.processScripts(text, context.view.viewVars, function(text) {
							console.log("Processed scripts")
							context.res.end(text)
						})
					} else {
						console.log("Skipping scripts")
						context.io.text(text)
					}
				}).render(data, template_data, template_options)
			} else {
				context.io.text(data)
			}
		}
	})
	return this.DONE
}

Launch.extend(Controller.prototype, {
	_preAction: function(action) {
	},

	_postAction: function(action, response) {
	}
})



root.Controller = Controller

