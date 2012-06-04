exports.TemplateHelper = function() {
}

Launch.extend(exports.TemplateHelper.prototype, {
	filter_plural: function(s) {
		if (typeof(s) !== typeof(''))
			s = s.toString()
		return s.pluralize()
	},
	filter_singular: function(s) {
		if (typeof(s) !== typeof(''))
			s = s.toString()
		return s.singularize()
	},
	filter_ordinal: function(n) {
		num = new Number(n)
		return num.ordinalize()
	}
})

