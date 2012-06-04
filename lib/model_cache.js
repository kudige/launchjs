var Path = require('path')

var ModelCache = function() {
	this._cache = {}
}

Launch.extend(ModelCache.prototype, {
	get: function(key) {
		if (!this._cache[key]) {
			try {
				var ModelClass = require(Path.resolve(Config.model.path, key))
				if (typeof(ModelClass) === 'function') {
					var model = new ModelClass(key)
					this._cache[key] = model
				}
			} catch(e) {
				console.log("** Error loading model %s : %s".format(key, e.message))
			}
		}
		return this._cache[key]
	}
})

module.exports = (new ModelCache)