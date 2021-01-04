const {serveHTTP} = require('stremio-addon-sdk');
const addonInterface = require('./addon');

require('events').EventEmitter.defaultMaxListeners = 50;

try {
	serveHTTP(addonInterface, {
		port: process.env.PORT || 7000,
		cacheMaxAge: 60
	});
} catch (error) {
	console.error(error);
}
