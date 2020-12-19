const {getRouter} = require('stremio-addon-sdk');
const addonInterface = require('./addon');

const router = getRouter(addonInterface);

module.exports = function (request, res) {
	router(request, res, () => {
		res.statusCode = 404;
		res.end();
	});
};
