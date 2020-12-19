const {serveHTTP} = require('stremio-addon-sdk');
const ONE_DAY = 86400;
const addonInterface = require('./addon');
serveHTTP(addonInterface, {port: 7000, cacheMaxAge: 1}); // cacheMaxAge: 10000
