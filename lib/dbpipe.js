function DbPipe(dbhandle, query) {
	this.dbhandle = dbhandle
	this.query = query
	this.init()
}

Launch.extend(DbPipe.prototype, {
	replyHandler: function(reply) {
		//console.log('%s : %s'.format(reply.numberReturned, reply.more))
		this.more = reply.more
		if (reply.numberReturned > 0)
			this.queue(reply.documents)
		else
			this.next()
	},

	/* Public API */
	restart: function(timeout) {
		this.init()
		timeout = timeout || 0
		setTimeout(this.start.bind(this), timeout)
	},

	start: function() {
		if (this.state !== 'stopped')
			return
		this.dbhandle.find(this.query, this.replyHandler.bind(this))
		this.state = 'running'
		this.next()
	},
	stop: function() {
		if (this.state === 'stopped')
			return
		this.state = 'stopped'
	},

	/* Protected API */
	init: function() {
		this.state = 'stopped'
		this.count = 0
		this.more = true
		this.documents = []
	},

	queue: function(docs) {
		var self = this
		Launch.each(docs, function(i, doc){
			self.documents.push(doc)
		})
		if (this.state === 'waiting')
			this.next()
	},

	next: function() {
		if (this.state === 'stopped')
			return
		if (this.documents.length > 0) {
			this.state = 'running'
			var doc = this.documents.shift()
			this.count++
			setTimeout(this.process.bind(this, doc), 0)
		} else if (this.more) {
			this.state = 'waiting'
		} else {
			this.end()
		}
	},

	/* Overlaod this */
	process: function(document) {
		console.log("WARNING: DbPipe needs to be subclassed before using it.")
	},
	end: function() {
	}
})

module.exports = DbPipe
