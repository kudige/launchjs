var Emitter = require('events').EventEmitter

function MultiWaiter() {
	Emitter.call(this)
	this.pending = 0
	this._allDone = false
}
Util.inherits(MultiWaiter, Emitter)

MultiWaiter.prototype.addPending = function() {
	this.pending++
}


MultiWaiter.prototype.finishPending = function() {
	var self = this
	self.pending--
	if (self._allDone) {
		if (!self.pending)
			self.emit('done')
	}
}

MultiWaiter.prototype.waitall = function(cb) {
	this._allDone = true
	if (!this.pending) {
		setTimeout(cb, 0)
	}

	this.on('done', function() {
		setTimeout(cb, 0)
	})
}

MultiWaiter.prototype.__defineGetter__('finished', function() {
	return this.finishPending.bind(this)
})

root.MultiWait = MultiWaiter
module.exports = MultiWaiter
