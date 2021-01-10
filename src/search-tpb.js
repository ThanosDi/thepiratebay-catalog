const request = require('request-promise');
const {map, isEmpty, isNil, anyPass} = require('ramda');
const delay = require('delay');
const baseUrl = 'https://apibay.org';
const timeout = 5000;

const notFound = anyPass([isEmpty, isNil]);

const searchCategory = (category, retry = true) => {
	return _request(`q.php?q=+&cat=${category}`).catch(() => {
		if (retry) {
			return delay(timeout).then(() => searchCategory(category, false));
		}

		return [];
	});
};

const searchTop100recent = (retry = true) => {
	return _request(`precompiled/data_top100_recent.json`).catch(() => {
		if (retry) {
			return delay(timeout).then(() => searchTop100recent(false));
		}

		return [];
	});
};

const searchTop100all = (retry = true) => {
	return _request(`precompiled/data_top100_all.json`).catch(() => {
		if (retry) {
			return delay(timeout).then(() => searchTop100all(false));
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
		imdb: notFound(result.imdb) ? 'tt1234567890' : result.imdb,
		infoHash,
		magnetLink: `magnet:?xt=urn:btih:${infoHash}`
	};
};

module.exports = {
	searchCategory,
	search,
	searchTop100recent,
	searchTop100all
};
