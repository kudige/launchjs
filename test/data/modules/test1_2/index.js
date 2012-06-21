TestController = MakeController(__filename, module)

Launch.extend(TestController.prototype, {
	_init: function() {
		this._uses('Model1', 'Model2', 'CamelCase1')
	},
	_viewpath: function() {
		return __dirname
	},
	macro_thing1: function() {
		return "Thing1"
	},
	filter_pad: function(str) {
		return 'XXX%sXXX'.format(str)
	},
	block_thing2: function(context, i) {
		if (i>0) {
			context.append('>>')
			return false
		}
		context.prepend('<<')
		return true
	}
})

var testController = new TestController
module.exports = testController
