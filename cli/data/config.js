var config = {}

// Application name
config.appname = '{$appname|caps}'

// Path to the webroot - defaults to toplevel webroot folder
config.webroot = 'assets'

// Path to common libraries
config.commonPath = 'common'

// Module configuration
config.module = {
	// Default path to load modules from
	path: 'controllers',
	defaultModule: '{$appname|lower}',
	// Should all the available modules be autoloaded
	serverScripts: false,
	autoload: true
}

config.view = {
	// Global view path
	path: 'views',

	// Default application template
	app_template: 'views/app.html',
}

// Server configuration
config.server = {
	// default http port
	port: {$httpPort}

	// default websock port
	//websockPort: {$websockPort}
}

config.model = {
	path: 'models'
}

config.database = {
	name: '{$appname|lower}'
}

module.exports = config
