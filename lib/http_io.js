var HttpIO = function(req, res) {
	this.req = req
	this.res = res
	this.sess = req.session.data
}

HttpIO.prototype.invoke = function(context, actionFn, params) {
	var decodedComponents = [], module = context.global
	for (var i=0; i<params.length; i++) {
		decodedComponents.push(decodeURIComponent(params[i]))
	}
	context._preAction(context.action)
	var response = actionFn.apply(context, decodedComponents)
	context._postAction(context.action, response)
	if (response === module.WAIT ||
		response === module.DONE) {
		// The action is an async response OR action has already responded, just return
		return
	}

	if (typeof(response) === 'undefined') {
		// action wants to send the default view
		try {
			return context.sendView(context.action, context.mime)
		} catch(e) {
			this.res.writeHead(200, {'Content-Type': 'text/html'})
			this.res.end('Page error: ' + e.message)
			return
		}
	}
	
	// action returned the response to send
	var mime = module.content_type || 'text/html'
	var http_code = 200
	if (response.http_code)
		http_code = response.http_code
	if (response.content_type) {
		mime = response.content_type
		response = response.data
	}
	this.res.writeHead(http_code, {'Content-Type': mime})
	if (typeof(response) !== typeof(''))
		response = JSON.stringify(response)
	this.res.end(response)
}

HttpIO.prototype.mime = function(mimeType) {
	this.mimeType = mimeType
}

HttpIO.prototype.text = function(data) {
	this.res.writeHead(200, {'Content-Type':this.mimeType, 'Content-Length': data.length})
	this.res.end(data)
}

HttpIO.prototype.error = function(message) {
	this.res.writeHead(404, {'Content-Type':this.mimeType})
	this.res.end(message)
}

HttpIO.prototype.redirect = function(url) {
	this.res.writeHead(301, {'Location': url})
	this.res.end('')
}

module.exports = HttpIO