var {=controller|caps} = MakeModel(__filename, module)

Launch.extend({=controller|caps}.prototype,{
	schema: function() {
		var schema = new Schema(this)
{foreach from=fields item=field}
		schema.fields.push('{=field|fieldname}'){/foreach}
		schema.primary = '{=fields|uniquefield}'
{foreach from=relations item=relation}
		schema.relation('{=relation.field}','{=relation.target}'){/foreach}
		return schema
	}
})

module.exports = {=controller|caps}
