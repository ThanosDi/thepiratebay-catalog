<<<<<<< HEAD
const { serveHTTP } = require('stremio-addon-sdk');
=======
const {serveHTTP} = require('stremio-addon-sdk');
>>>>>>> ac92c627f6471b730a382c899a2a1fbd25e73421
const addonInterface = require('./addon');

require('events').EventEmitter.defaultMaxListeners = 50;
const ONE_DAY = 86400;

serveHTTP(addonInterface, {
<<<<<<< HEAD
    port: process.env.PORT || 7000,
    cacheMaxAge: 1
}); // cacheMaxAge: 10000
=======
	port: process.env.PORT || 7000,
	cacheMaxAge: 10000
}); // cacheMaxAge: 10000
>>>>>>> ac92c627f6471b730a382c899a2a1fbd25e73421
