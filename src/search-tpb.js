const request = require('request-promise');
const {map} = require('ramda');
const delay = require('delay');
const baseUrl = 'https://apibay.org';
const timeout = 5000;

const searchCategory = (category, retry = true) => {
	return _request(`q.php?q=+&cat=${category}`).catch(() => {
		if (retry) {
			return delay(timeout).then(() => searchCategory(category, false));
		}
	});
};

const search = async (query, category, retry = true) => {
	return _request(`q.php?q=${query}&cat=${category}`).catch(() => {
		if (retry) {
			return delay(timeout).then(() => search(query, category, false));
		}
	});
};

// const search = (query, category) =>
// 	_request(`q.php?q=${query}&cat=${category}`);

const _request = async endpoint => {
	const url = `${baseUrl}/${endpoint}`;
	return request
		.get(url, {timeout})
		.then(data => JSON.parse(data))
		.then(map(toTorrent));
};

const toTorrent = result => {
	const infoHash = result.info_hash.toLowerCase();
	return {
		name: result.name,
		size: result.size,
		seeders: result.seeders,
		leechers: result.leechers,
		uploader: result.username,
		imdb: result.imdb,
		infoHash,
		magnetLink: `magnet:?xt=urn:btih:${infoHash}`
	};
};

module.exports = {searchCategory, search};
