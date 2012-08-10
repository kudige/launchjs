{=controller|caps}Controller = MakeController(__filename, module)


Launch.extend({=controller|caps}Controller.prototype,{
	/* DB event handlers: Replace 'Event' with Add, Ready, Save, Exits, Notfound, Error */
	_onEvent: function(param) {
	},

	/* Filters */
	_init: function() {
        this._uses('{=controller|caps}')
        this.schema = this.{=controller|caps}.schema()
        this._uses(this.schema.relatedModels())
	},

	_preAction: function(action) {
        var schema = this.{=controller|caps}.schema()
		this.set('action', action)
        this.set('%s_schema'.format(this.id.singularize()), schema)
        this.set('%s_formfields'.format(this.id.singularize()), schema.formfields(this.id.singularize(), action))
	},

	/* Controller Actions are triggered from the URL */
	index: function() {
	},

	method1: function(param1, param2) {
	}
})

var {=controller|lower}Controller = new {=controller|caps}Controller
module.exports = {=controller|lower}Controller
