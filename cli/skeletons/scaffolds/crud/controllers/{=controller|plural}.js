{=controller|caps}Controller = MakeController(__filename, module)


Launch.extend({=controller|caps}Controller.prototype,{
	/* Event handlers */
	_onNotfound: function(error) {
		this.output('Not found!')
	},
	_onError: function(error) {
		this.sendView('error')
	},
	_onAdd: function({=controller|lower}) {
		this.redirect('info/%s'.format({=controller|lower}.key()))
	},
	_onReady: function({=controller|lower}) {
		if ({=controller|lower}.key())
			return this.redirect('info/%s'.format({=controller|lower}.key()))
		this.output(JSON.stringify({=controller|lower}.get()))
	},
	_onSave: function({=controller|lower}) {
		console.log('on save')
		this.redirect('info/%s'.format({=controller|lower}.key()))
	},
	_onExists: function() {
		this.sendView('exists')
	},

	/* Helpers */
	filter_counter: function(count) {
		return this.id.pluralize(parseInt(count))
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

	/* Controller Actions */
	index: function() {
		this.set('{=controller|plural}', this.{=controller|caps}.list())
	},
	add: function() {
		var self = this
		if (this.postdata) {
			this.{=controller|caps}.add(this.postdata.{=controller|lower}, 'name').watch(this)
			return this.WAIT
		}
        Launch.each(this.schema.relatedModels(),function(i, modelname) {
            self.set(modelname.pluralize().toLowerCase(), self[modelname].list())
        })
	},
	edit: function(key) {
		var self = this
		if (this.postdata) {
			var {=controller|lower} = this.{=controller|caps}.find(this.postdata.{=controller|lower}[this.schema.primary])
			Launch.each(this.postdata.{=controller|lower},function(field, value) {
				{=controller|lower}[field] = value
			})
			
			{=controller|lower}.watch(self).save()
			return this.WAIT
		}
        this.set('{=controller}', this.{=controller|caps}.find(key)).watch(this)
        Launch.each(this.schema.relatedModels(),function(i, modelname) {
            self.set(modelname.pluralize().toLowerCase(), self[modelname].list())
        })
	},
	info: function(key) {
		this.set('{=controller|lower}', this.{=controller|caps}.find(key)).watch(this)
	}
})

var {=controller|lower}Controller = new {=controller|caps}Controller
module.exports = {=controller|lower}Controller
