var queryobject = require('./query'),
Model = require('./model'),
URL = require('url'),
TemplateIO = require('./template_io'),
DynObj = new (require('dynobj').DynObj)()

var Context = DynObj.create()

Launch.extend(Context.prototype, {
	__get__: function(key) {
		if (this.global)
			return this.global[key]
	},

	init: function(controller, io, urlinfo, postrawdata, modroute, template) {
		this.io = io
		this.url = urlinfo
		if (this.url)
			this.query = urlinfo.query
		this.global = controller
		this.module_route = modroute
		this.postraw = postrawdata
		this.view = new root.View(template)
		this.nwaiting = 0
		this.header_sent = false
		try {
			this.postdata = queryobject.parse(postrawdata)
		} catch(e) {
			console.log('Context.init error: ' + e)
		}
	},
	set: function(key, val) {
		this.view.set(key, val)
		return val
	},
	invoke: function(action, params) {
		this.action = action
		// We have found the controller, find the action to call
		var actionFn = this.global[action]
		if (!actionFn)
			actionFn = this.global.defaultRoute
		if (actionFn) 
			return this.io.invoke(this, actionFn, params)
		else
			return this.io.error("Action %s not found".format(this.action))
	},
	_checkDone: function() {
		if (this.nwaiting <= 0)
			this.io.text('')
	},
	output: function(message, mime) {
		if (message.constructor !== Buffer && typeof(message) === typeof({}))
			return this.outputJSON(message)
		if (!this.header_sent) {
			this.io.mime(mime || 'text/html')
			this.header_sent = true
		}
		this.io.text(message)
		this._checkDone()
	},
	outputJSON: function(obj) {
		if (!this.header_sent) {
			this.io.mime('text/plain')
			this.header_sent = true
		}
		var message = ''
		try {
			message = JSON.stringify(obj)
		} catch(e) {
		}
		this.io.text(message)
		this._checkDone()
	},
	sendView: function(viewname, mime) {
		return this.global.sendView(this, viewname, mime)
	},
	addWidgets: function(widgets) {
		var self = this
		Launch.each(widgets, function(id, widget) {
			var widgetContext = new Context
			widgetContext.init(widget, new TemplateIO(self.view.template), null, '', id, self.view.template)
			Launch.classFields(widget, function(methodName, method) {
				if (typeof(method) === 'function' && methodName.match(/^[a-zA-Z][_a-zA-Z0-9]*$/)) {
					self.view.template.addMacro('%s:%s'.format(id, methodName), function(context) {
						return widgetContext.invoke(methodName, context.params)
					})
				}
			})
 
		})
	},
	redirect: function(url) {
		var urlinfo = URL.parse(url, true)
		if (urlinfo.hostname) {
			// Fullpath
				this.io.redirect(url)
			console.log('fullpath')
		} else {
			if (url.match(/^\//)) {
				this.io.redirect(url)
			} else {
				url = '/%s/%s'.format (this.module_route, url)
				this.io.redirect(url)
			}
		}
		return this.DONE
	}
})

/*
 * Detect a variable passed either in postback, or in query
 */
Context.prototype.detectVar = function(varname) {
	if (this.postdata && this.postdata[varname] !== undefined)
		return this.postdata[varname]
	if (this.query && this.query[varname] !== undefined)
		return this.query[varname]
}

Context.prototype.error = function(message) {
	this.set('error', message)
	return this.sendView('error')
}

module.exports = Context
