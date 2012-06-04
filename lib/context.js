var queryobject = require('./query'),
Model = require('./model'),
URL = require('url'),
DynObj = new (require('dynobj').DynObj)()

var Context = DynObj.create()

Launch.extend(Context.prototype, {
	__get__: function(key) {
		if (this.global)
			return this.global[key]
	},

	init: function(controller, req, res, action, urlinfo, postrawdata, modroute, template) {
		this.req = req
		this.res = res
		this.sess = req.session.data
		this.action = action
		this.url = urlinfo
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
			console.log(e.message)
		}
	},
	set: function(key, val) {
		this.view.set(key, val)
		return val
	},
	_checkDone: function() {
		if (this.nwaiting <= 0)
			this.res.end('')
	},
	output: function(message, mime) {
		if (message.constructor !== Buffer && typeof(message) === typeof({}))
			return this.outputJSON(message)
		if (!this.header_sent) {
			this.res.writeHead(200, {'Content-Type': mime || 'text/html'})
			this.header_sent = true
		}
		this.res.write(message)
		this._checkDone()
	},
	outputJSON: function(obj) {
		if (!this.header_sent) {
			this. res.writeHead(200, {'Content-Type': 'text/plain'})
			this.header_sent = true
		}
		var message = ''
		try {
			message = JSON.stringify(obj)
		} catch(e) {
		}
		this.res.write(message)
		this._checkDone()
	},
	sendView: function(viewname, mime) {
		return this.global.sendView(this, viewname, mime)
	},
	redirect: function(url) {
		var urlinfo = URL.parse(url, true)
		if (urlinfo.hostname) {
			// Fullpath
			console.log('fullpath')
			this.res.writeHead(301, {'Location': url})
			this.res.end('')
		} else {
			if (url.match(/^\//)) {
				this.res.writeHead(301, {'Location': url})
				this.res.end('')
			} else {
				url = '/%s/%s'.format (this.module_route, url)
				this.res.writeHead(301, {'Location': url})
				this.res.end('')
			}
		}
		this.res.end('')
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
