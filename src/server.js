const {serveHTTP} = require('stremio-addon-sdk');
const addonInterface = require('./addon');

require('events').EventEmitter.defaultMaxListeners = 50;
const ONE_DAY = 86400;

try {
	serveHTTP(addonInterface, {
		port: process.env.PORT || 7000,
		cacheMaxAge: 3600
	}); // cacheMaxAge: 10000
} catch (error) {
	console.error(error);
}
