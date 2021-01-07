const byteSize = require('byte-size');

const {parseId} = require('./tools');
const streamHandler = async args => {
	try {
		const id = parseId(args);
		const {seeders, parsedName, size, index = false, infoHash} = id;
		const {value, unit} = byteSize(size);
		const stream = {
			name: 'TPB-CTL',
			title: `${parsedName}
💾  ${value} ${unit}
👤  ${seeders}`,
			type: args.type,
			infoHash,
			...(index === false ? {} : {fileIdx: index})
		};

		return Promise.resolve({streams: [stream]});
	} catch {
		return Promise.resolve([]);
	}
};

module.exports = streamHandler;
