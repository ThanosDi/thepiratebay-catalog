const request = require('request-promise');
const {map, isEmpty} = require('ramda');
const delay = require('delay');
const baseUrl = 'https://apibay.org';
const timeout = 5000;

const _request = async endpoint => {
	const url = `${baseUrl}/${endpoint}`;

	return request
		.get(url, {timeout})
		.then(data => JSON.parse(data))
		.then(map(toTorrent));
};

const searchCategory = (category, retry = true) => {
	const url =
		category === '600' ? `q.php?q=category:500` : `q.php?q=+&cat=${category}`;

	return _request(url).catch(() => {
		if (retry) {
			return delay(timeout).then(() => searchCategory(category, false));
		}

		return [];
	});
};

const search = async (query, category, retry = true) => {
	const queryParsed = query.trim().split(' ').join('+');
	return _request(`q.php?q=${queryParsed}&cat=${category}`).catch(() => {
		if (retry) {
			return delay(timeout).then(() => search(query, category, false));
		}

		return [];
	});
};

const toTorrent = result => {
	const infoHash = result.info_hash.toLowerCase();
	return {
		name: result.name,
		size: result.size,
		seeders: result.seeders,
		leechers: result.leechers,
		uploader: result.username,
		imdb: isEmpty(result.imdb) ? 'tt1234567890' : result.imdb,
		infoHash,
		magnetLink: `magnet:?xt=urn:btih:${infoHash}`
	};
};

module.exports = {searchCategory, search};
