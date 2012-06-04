var Wrap = require('../wrapper')
var obj = [5,6,7,8]
var wobj = Wrap(obj)

for (var i in wobj) {
	console.log(i)
}

