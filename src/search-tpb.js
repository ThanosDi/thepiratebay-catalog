const request = require('request-promise');
const {map} = require('ramda');
const baseUrl = 'https://apibay.org';
const timeout = 5000;

const searchCategory = category => _request(`q.php?q=+&cat=${category}`);

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
		infoHash,
		magnetLink: `magnet:?xt=urn:btih:${infoHash}`
	};
};

module.exports = {searchCategory};
