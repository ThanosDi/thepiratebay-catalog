const {ifElse, filter, pipe, map, pathOr, pathEq} = require('ramda');
const {encode} = require('base-64');
const Magnet2torrent = require('magnet2torrent-js');
const episodeParser = require('episode-parser');
const isVideo = require('is-video');
const {parseId, getId} = require('./tools');

const m2t = new Magnet2torrent({timeout: 120});
const urlExist = require('url-exist');

const FALLBACK_LOGO =
	'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/i/02b4826d-e6a0-4129-8486-38b601edaa03/dcs8pfz-9e7d00ac-d2f7-4ff2-88cb-8466d383a96a.png';
const FALLBACK_BACKGROUND =
	'https://www.wallpapertip.com/wmimgs/181-1815770_the-pirate-bay-the-pirate-bay-tracker-torrent.jpg';

const metaHandler = async args => {
	const {magnetLink, seeders, parsedName, size, poster} = parseId(args);

	const torrent = await m2t.getTorrent(magnetLink);

	const videos = ifElse(
		pathEq(['args', 'type'], 'series'),
		pipe(
			pathOr([], ['torrent', 'files']),
			map((file, index) => ({
				...file,
				index
			})),

			filter(({name}) => isVideo(name)),
			filter(file => {
				const parsed = episodeParser(file.name);
				return args.type === 'series' && parsed;
			}),
			map(file => {
				const {season, episode} = episodeParser(file.name);
				const parameters = {
					magnetLink,
					parsedName: parsedName.trim(),
					size,
					seeders,
					index: file.index
				};
				return {
					name: file.name,
					season,
					number: episode,
					firstAired: '2002-01-31T22:00:00.000Z',
					id: `${getId(args)}:${season}:${episode}:${encode(
						JSON.stringify(parameters)
					)}`,
					episode
				};
			})
		),
		() => []
	)({args, torrent});

	const logoUrl = poster.replace('/poster/', '/logo/');
	const backgroundUrl = poster.replace('/poster/', '/background/');
	const [logo, background] = await Promise.all([
		urlExist(logoUrl),
		urlExist(backgroundUrl)
	]);
	const metaObject = {
		id: args.id,
		name: parsedName,
		background: background ? backgroundUrl : FALLBACK_BACKGROUND,
		logo: logo ? logoUrl : FALLBACK_LOGO,
		posterShape: 'regular',
		type: args.type,
		videos,
		description: parsedName.toUpperCase()
	};

	return Promise.resolve({meta: metaObject});
};

module.exports = metaHandler;
