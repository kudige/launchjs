TestController = MakeController(__filename, module)

Launch.extend(TestController.prototype, {
	_init: function() {
		this._uses('Model1', 'Model2', 'CamelCase1')
	},
	_viewpath: function() {
		return __dirname
	},
	// Controller methods

	// Direct method
	method1: function(a,b) {
		console.log('method1')
		return a+b
	},

	// Delayed output + mime
	method2: function(a,b) {
		var self = this
		setTimeout(function() {
			self.output(parseInt(a) + parseInt(b), 'text/plain')
		}, 100)
		return this.WAIT
	},
	
	// Output via view, default mime
	method3: function(a,b) {
		this.set('a', a)
		this.set('b', b)
		this.set('result', parseInt(a)+parseInt(b))
	},

	// Output via view with delayed set, mime by extension
	method4: function(a,b) {
		this.set('a', a)
		this.set('b', b)
		this.set('result', parseInt(a)+parseInt(b))
	},


	// Template Extensions
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
