var Transformer = require('transformer'),
DelayedValue = Transformer.DelayedValue

var TemplateIO = function(template) {
	this.template = template
}

TemplateIO.prototype.invoke = function(context, actionFn, params) {
	var module = context.global
	context._preAction(context.action)
	var response = actionFn.call(context, params)
	context._postAction(context.action, response)
	if (response === module.WAIT ||
		response === module.DONE) {
		// The action is an async response OR action has already responded, just return
		this.delayedValue = new DelayedValue
		return this.delayedValue
	}

	if (typeof(response) === 'undefined') {
		// action wants to send the default view
		try {
			this.delayedValue = new DelayedValue
			setTimeout(function() {
				context.sendView(context.action, context.mime)
			}, 10)
			return this.delayedValue
		} catch(e) {
			console.log('TemplateIO.invoke error: ' + e.message)
		}
	}
	
	return response
}

TemplateIO.prototype.mime = function(mimeType) {
}

TemplateIO.prototype.text = function(data) {
	if (this.delayedValue) {
		this.delayedValue.value(data)
		this.delayedValue = null
	}
}

TemplateIO.prototype.error = function(message) {
}

TemplateIO.prototype.redirect = function(url) {
}

module.exports = TemplateIO