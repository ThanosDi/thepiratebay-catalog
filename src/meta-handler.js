const {
	ifElse,
	filter,
	pipe,
	map,
	pathOr,
	pathEq,
	propOr,
	addIndex,
} = require('ramda');
const {encode} = require('base-64');
const Magnet2torrent = require('magnet2torrent-js');
const episodeParser = require('episode-parser');
const isVideo = require('is-video');
const {parseId, getId} = require('./tools');

const mapIndexed = addIndex(map);

const m2t = new Magnet2torrent({timeout: 120});
const urlExist = require('url-exist');
const anyPass = require('ramda/src/anyPass');
const propEq = require('ramda/src/propEq');

const FALLBACK_LOGO =
	'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/i/02b4826d-e6a0-4129-8486-38b601edaa03/dcs8pfz-9e7d00ac-d2f7-4ff2-88cb-8466d383a96a.png';
const FALLBACK_BACKGROUND =
	'https://www.wallpapertip.com/wmimgs/181-1815770_the-pirate-bay-the-pirate-bay-tracker-torrent.jpg';

const shouldShowSearch = anyPass([
	propEq('season', 0),
	pathEq(['extra', 'id'], 'Porn'),
]);

const getVideoArray = ({
	args,
	torrent,
	magnetLink,
	seeders,
	parsedName,
	size,
	poster,
	extra,
	infoHash,
}) =>
	ifElse(
		anyPass([
			pathEq(['args', 'type'], 'series'),
			pathEq(['extra', 'id'], 'Porn'),
		]),
		pipe(
			pathOr([], ['torrent', 'files']),
			mapIndexed((file, index) => ({
				...file,
				index,
			})),
			filter(({name}) => isVideo(name)),
			map(file => {
				const episodeParsed = episodeParser(file.name);
				const season = propOr(0, 'season', episodeParsed);
				const episode = propOr(file.index, 'episode', episodeParsed);
				const parameters = {
					magnetLink,
					parsedName: parsedName.trim(),
					size,
					seeders,
					index: file.index,
					extra,
					infoHash,
				};

				// Use firstAired hack to access search view or episode view.
				const firstAired = shouldShowSearch({season, extra})
					? ''
					: '2002-01-31T22:00:00.000Z';
				return {
					name: file.name,
					season,
					number: episode,
					firstAired,
					id: `${getId(args)}:${season}:${episode}:${encode(
						JSON.stringify(parameters),
					)}`,
					episode,
				};
			}),
		),
		() => [],
	)({
		args,
		torrent,
		magnetLink,
		seeders,
		parsedName,
		size,
		poster,
		extra,
		infoHash,
	});

const metaHandler = async args => {
	const {
		magnetLink,
		seeders,
		parsedName,
		size,
		poster,
		extra,
		infoHash,
	} = parseId(args);
	const torrent = await m2t.getTorrent(magnetLink);
	const videos = getVideoArray({
		args,
		torrent,
		magnetLink,
		seeders,
		parsedName,
		size,
		poster,
		extra,
		infoHash,
	});

	const logoUrl = poster.replace('/poster/', '/logo/');
	const backgroundUrl = poster.replace('/poster/', '/background/');
	const [logo, background] = await Promise.all([
		urlExist(logoUrl),
		urlExist(backgroundUrl),
	]);
	const metaObject = {
		id: args.id,
		name: parsedName,
		background: background ? backgroundUrl : FALLBACK_BACKGROUND,
		logo: logo ? logoUrl : FALLBACK_LOGO,
		posterShape: 'regular',
		type: args.type,
		videos,
		description: parsedName.toUpperCase(),
	};

	return Promise.resolve({meta: metaObject});
};

module.exports = metaHandler;
