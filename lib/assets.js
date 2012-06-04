var FS = require('fs'),
Path = require('path'),
Mime = require('mime')

var S_IFREG = 0x0100000
var router = {}
var Webroots = {'': Config.webroot}

function is_file(path) {
	try {
		var stat = FS.lstatSync(path)
		return (stat && (stat.isFile() || stat.isSymbolicLink()))
	} catch(e) {
	}
}

var AssetsController = function() {
	Controller.call(this, __filename)
}
Util.inherits(AssetsController, Controller)

AssetsController.prototype.handler = function() {
	var context = this
	var fullpath = null
	if (fullpath = this.resolve(context.url.pathname)) {
		var mime = Mime.lookup(fullpath, 'text/html')
		
		FS.readFile(fullpath, function(err, data) {
			if (err) {
				console.log("readFile error: " + err)
				context.res.writeHead(404, {'Content-Type': 'text/plain'})
				context.res.end("Error: " + err)
			} else {
				context.res.writeHead(200, {'Content-Type': mime, 'Content-Length' : data.length})
				context.res.write(data)
				context.res.end('')
			}
		})
	}
	return this.DONE
}

AssetsController.prototype.canHandle = function(path) {
	if (this.resolve(path))
		return 'handler'
}

AssetsController.prototype.resolve = function(path) {
	for (var prefix in Webroots) {
		if (path.indexOf(prefix) === 0) {
			path = path.substring(prefix.length)
			var webroot = Webroots[prefix]
			var fullpath = Path.resolve(prefix, webroot, '.' + path)
			if (is_file(fullpath))
				return fullpath
		}
	}
}

AssetsController.prototype._connectAsset = function(name, path) {
	Webroots[name] = path
}

root.AssetManager = new AssetsController()
LaunchExport(module, root.AssetManager)

