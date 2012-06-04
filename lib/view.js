var Template = require('transformer'),
Emitter = require('events').EventEmitter,
Debug = require('./debug')

/*
 * Emits:
 * error: Upon template errors
 * ready: Upon template rendering completed
 * set  : Upon a view var is set
 */
var View = function(template) {
	Emitter.call(this)
	this.viewVars = {}
	this.directives = {}
	this.npending = 0
	this.template = template
}
Util.inherits(View, Emitter)

View.debug    = new Debug('View')

View.prototype.on = function(event, callback) {
	Emitter.prototype.on.call(this, event, callback)
	return this
}

View.prototype.reset = function() {
	this.viewVars = {}
	this.directives = {}
	this.npending = 0
}

View.prototype.set = function(key, value, onError) {
	var self = this
	View.debug.api('set %s = %s'.format(key, value))
	if (typeof(value) === 'object' && typeof(value.onReady) === 'function' 
		&& (typeof(value.isReady) !== 'function' || !value.isReady())) {
		// Deferred value
		self.npending++
		value.onReady(function(realValue) {
			View.debug.info(sprintf('value for key [%s] is ready ', key))
			self.npending--
			self.set(key, realValue)
		}).onError(function(msg) {
			self.npending--
			self.set(key, onError)
		})
	} else {
		this.viewVars[key] = value
		this.emit('set', key)
	}
	return this
}

View.prototype.render = function(data, template_data, template_options) {
	var self = this
	View.debug.api('render')

	if (this.npending > 0) {
		View.debug.info('render pending ' + this.npending)
		this.on('set', function(k, v) {
			View.debug.info('render set callback for key ' + k + ' npending ' + self.npending)
			if (self.npending == 0) {
				self.render(data, template_data)
			}
		})
	} else {
		var template = this.template
		template.applyTemplate(data, this.viewVars, null, function(view) {
			function emitView(view) {
				View.debug.event('render')
				self.emit('render', view)
			}
			if (template_data) {
				templateVars = {config: root.Config, viewvars: self.viewVars, template_content: view}
				template.applyTemplate(template_data, templateVars, null, emitView, template_options)
			} else {
				emitView(view)
			}
		}, template_options)
	}
	return this
}

//View.debug.enable()
module.exports = View