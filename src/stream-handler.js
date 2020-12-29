const parseTorrent = require('parse-torrent');
const {parseId} = require('./tools');

const streamHandler = async args => {
	try {
		const {magnetLink, seeders, parsedName, size, index = false} = parseId(
			args
		);

		const {infoHash} = parseTorrent(magnetLink);
		const stream = {
			name: 'TPB-CTL',
			title: `${parsedName}
💾  ${size}
👤  ${seeders}`,
			type: args.type === 'custom' ? 'movie' : args.type,
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
