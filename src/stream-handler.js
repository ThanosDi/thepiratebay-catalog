const parseTorrent = require('parse-torrent');
const byteSize = require('byte-size');

const {parseId} = require('./tools');
const streamHandler = async args => {
	console.log('streamHandler', args);

	try {
		const {magnetLink, seeders, parsedName, size, index = false} = parseId(
			args
		);
		console.log({magnetLink, seeders, parsedName, size, index});
		const {value, unit} = byteSize(size);
		const {infoHash} = parseTorrent(magnetLink);
		const stream = {
			name: 'TPB-CTL',
			title: `${parsedName}
💾  ${value} ${unit}
👤  ${seeders}`,
			type: args.type,
			infoHash,
			...(index ? {fileIdx: index} : {})
		};

		return Promise.resolve({streams: [stream]});
	} catch (error) {
		console.log({error});
		return Promise.resolve([]);
	}
};

module.exports = streamHandler;
