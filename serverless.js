const {getRouter} = require('stremio-addon-sdk');
const addonInterface = require('./src/addon');

const router = getRouter(addonInterface);

module.exports = function (request, response) {
	router(request, response, () => {
		response.statusCode = 404;
		response.end();
	});
};
